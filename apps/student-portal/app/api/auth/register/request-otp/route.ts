import { NextRequest, NextResponse } from "next/server";
import { queryMySQL } from "@repo/database";
import {
    OTP_RESEND_SECONDS,
    OTP_TTL_MINUTES,
    ensureOtpTable,
    findLatestOtp,
    findUserByEmail,
    generateOtp,
    hashOtp,
    hashPassword,
    isValidEmail,
    normalizeEmail,
    sendOtpEmail,
} from "@/app/lib/registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const name = String(body.name ?? "").trim();
        const email = normalizeEmail(body.email);
        const password = String(body.password ?? "");

        if (name.length < 2 || name.length > 255) {
            return NextResponse.json({ error: "Nama harus terdiri dari 2–255 karakter" }, { status: 400 });
        }
        if (!isValidEmail(email)) {
            return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
        }
        if (password.length < 8 || password.length > 128) {
            return NextResponse.json({ error: "Password harus terdiri dari 8–128 karakter" }, { status: 400 });
        }

        await ensureOtpTable();
        if (await findUserByEmail(email)) {
            return NextResponse.json({ error: "Email sudah terdaftar. Silakan login." }, { status: 409 });
        }

        const latest = await findLatestOtp(email);
        if (latest) {
            const elapsedSeconds = Math.floor(Date.now() / 1000) - Number(latest.sent_at_epoch);
            if (elapsedSeconds < OTP_RESEND_SECONDS) {
                return NextResponse.json(
                    { error: `Tunggu ${Math.ceil(OTP_RESEND_SECONDS - elapsedSeconds)} detik sebelum mengirim ulang` },
                    { status: 429 }
                );
            }
        }

        const otp = generateOtp();
        await sendOtpEmail(email, name, otp);
        const sentAtEpoch = Math.floor(Date.now() / 1000);
        const expiresAtEpoch = sentAtEpoch + OTP_TTL_MINUTES * 60;
        await queryMySQL(
            `INSERT INTO student_email_otps
                (email, name, password_hash, otp_hash, sent_at_epoch, expires_at_epoch, sent_at, expires_at)
             VALUES (?, ?, ?, ?,
                ?, ?,
                CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+07:00'),
                DATE_ADD(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+07:00'), INTERVAL ? MINUTE)
             )`,
            [email, name, hashPassword(password), hashOtp(email, otp), sentAtEpoch, expiresAtEpoch, OTP_TTL_MINUTES]
        );

        return NextResponse.json({ message: "Kode OTP telah dikirim", email, expiresIn: OTP_TTL_MINUTES * 60 });
    } catch (error) {
        console.error("Request registration OTP error:", error);
        return NextResponse.json({ error: "Tidak dapat mengirim kode OTP. Coba lagi nanti." }, { status: 500 });
    }
}
