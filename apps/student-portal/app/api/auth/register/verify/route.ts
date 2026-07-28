import { NextRequest, NextResponse } from "next/server";
import { queryMySQL } from "@repo/database";
import {
    OTP_MAX_ATTEMPTS,
    OTP_TTL_MINUTES,
    REGISTRATION_COOKIE_NAME,
    createRegistrationToken,
    ensureRegistrationTables,
    findLatestOtp,
    findPreStudentByEmail,
    normalizeEmail,
    otpMatches,
} from "@/app/lib/registration";

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

        await ensureRegistrationTables();
        const preStudent = await findPreStudentByEmail(email);
        if (!preStudent) return NextResponse.json({ error: "Pendaftaran tidak ditemukan" }, { status: 404 });
        if (preStudent.registration_completed_at) {
            return NextResponse.json({ error: "Email sudah terdaftar. Silakan login." }, { status: 409 });
        }

        const pending = await findLatestOtp(email);
        if (!pending) return NextResponse.json({ error: "Kode OTP tidak ditemukan. Kirim kode baru." }, { status: 404 });
        const ageSeconds = Math.floor(Date.now() / 1000) - Number(pending.sent_at_epoch);
        if (ageSeconds > OTP_TTL_MINUTES * 60) {
            return NextResponse.json({ error: "Kode OTP sudah kedaluwarsa. Kirim kode baru." }, { status: 410 });
        }
        if (pending.attempts >= OTP_MAX_ATTEMPTS) {
            return NextResponse.json({ error: "Terlalu banyak percobaan. Kirim kode baru." }, { status: 429 });
        }
        if (!otpMatches(pending.otp_hash, email, otp)) {
            await queryMySQL("UPDATE student_email_otps SET attempts = attempts + 1 WHERE id = ?", [pending.id]);
            return NextResponse.json({ error: "Kode OTP salah" }, { status: 400 });
        }

        await queryMySQL("UPDATE pre_students SET email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP) WHERE id = ?", [preStudent.id]);
        await queryMySQL("UPDATE student_email_otps SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?", [pending.id]);

        const response = NextResponse.json({
            message: "Email berhasil diverifikasi",
            profile: { fullName: preStudent.full_name, email: preStudent.email },
        });
        response.cookies.set(REGISTRATION_COOKIE_NAME, createRegistrationToken(preStudent.id, email), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 60,
            path: "/",
        });
        return response;
    } catch (error) {
        console.error("Verify registration OTP error:", error);
        return NextResponse.json({ error: "Verifikasi gagal. Coba lagi nanti." }, { status: 500 });
    }
}
