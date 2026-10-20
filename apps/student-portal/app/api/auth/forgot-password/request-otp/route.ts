import { NextRequest, NextResponse } from "next/server";
import { queryMySQL } from "@repo/database";
import { generateOtp, isValidEmail, normalizeEmail } from "@/app/lib/registration";
import {
    RESET_OTP_RESEND_SECONDS,
    RESET_OTP_TTL_MINUTES,
    ensurePasswordResetTable,
    findLatestResetOtp,
    findResettableAccount,
    hashResetOtp,
    sendPasswordResetOtpEmail,
} from "@/app/lib/password-reset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = normalizeEmail(body.email);

        if (!isValidEmail(email)) {
            return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
        }

        await ensurePasswordResetTable();
        const account = await findResettableAccount(email);
        if (!account) {
            return NextResponse.json({ error: "Email tidak terdaftar sebagai siswa" }, { status: 404 });
        }

        const latest = await findLatestResetOtp(email);
        if (latest) {
            const remaining = RESET_OTP_RESEND_SECONDS - (Math.floor(Date.now() / 1000) - Number(latest.sent_at_epoch));
            if (remaining > 0) {
                return NextResponse.json({ error: `Tunggu ${Math.ceil(remaining)} detik sebelum mengirim ulang` }, { status: 429 });
            }
        }

        const otp = generateOtp();
        await sendPasswordResetOtpEmail(email, account.name, otp);
        const sentAtEpoch = Math.floor(Date.now() / 1000);
        await queryMySQL(
            `INSERT INTO password_reset_otps (email, otp_hash, sent_at_epoch, expires_at_epoch)
             VALUES (?, ?, ?, ?)`,
            [email, hashResetOtp(email, otp), sentAtEpoch, sentAtEpoch + RESET_OTP_TTL_MINUTES * 60]
        );
        return NextResponse.json({ message: "Kode OTP telah dikirim", email, expiresIn: RESET_OTP_TTL_MINUTES * 60 });
    } catch (error) {
        console.error("Request password reset OTP error:", error);
        return NextResponse.json({ error: "Tidak dapat mengirim kode OTP. Coba lagi nanti." }, { status: 500 });
    }
}
