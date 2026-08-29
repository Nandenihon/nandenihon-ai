import { NextRequest, NextResponse } from "next/server";
import { queryMySQL } from "@repo/database";
import { normalizeEmail } from "@/app/lib/registration";
import {
    RESET_OTP_MAX_ATTEMPTS,
    RESET_OTP_TTL_MINUTES,
    RESET_TOKEN_TTL_MINUTES,
    RESET_COOKIE_NAME,
    createResetToken,
    ensurePasswordResetTable,
    findLatestResetOtp,
    resetOtpMatches,
} from "@/app/lib/password-reset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = normalizeEmail(body.email);
        const otp = String(body.otp ?? "").trim();
        if (!/^\d{6}$/.test(otp)) {
            return NextResponse.json({ error: "Kode OTP harus terdiri dari 6 angka" }, { status: 400 });
        }

        await ensurePasswordResetTable();
        const pending = await findLatestResetOtp(email);
        if (!pending) return NextResponse.json({ error: "Kode OTP tidak ditemukan. Kirim kode baru." }, { status: 404 });

        const ageSeconds = Math.floor(Date.now() / 1000) - Number(pending.sent_at_epoch);
        if (ageSeconds > RESET_OTP_TTL_MINUTES * 60) {
            return NextResponse.json({ error: "Kode OTP sudah kedaluwarsa. Kirim kode baru." }, { status: 410 });
        }
        if (pending.attempts >= RESET_OTP_MAX_ATTEMPTS) {
            return NextResponse.json({ error: "Terlalu banyak percobaan. Kirim kode baru." }, { status: 429 });
        }
        if (!resetOtpMatches(pending.otp_hash, email, otp)) {
            await queryMySQL("UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = ?", [pending.id]);
            return NextResponse.json({ error: "Kode OTP salah" }, { status: 400 });
        }

        await queryMySQL("UPDATE password_reset_otps SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?", [pending.id]);

        const response = NextResponse.json({ message: "Kode OTP terverifikasi", email });
        response.cookies.set(RESET_COOKIE_NAME, createResetToken(email), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: RESET_TOKEN_TTL_MINUTES * 60,
            path: "/",
        });
        return response;
    } catch (error) {
        console.error("Verify password reset OTP error:", error);
        return NextResponse.json({ error: "Verifikasi gagal. Coba lagi nanti." }, { status: 500 });
    }
}
