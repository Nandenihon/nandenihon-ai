import { NextRequest, NextResponse } from "next/server";
import { queryMySQL } from "@repo/database";
import {
    OTP_RESEND_SECONDS,
    OTP_TTL_MINUTES,
    ensureRegistrationTables,
    findLatestOtp,
    findPreStudentByEmail,
    generateOtp,
    hashOtp,
    isValidEmail,
    normalizeEmail,
    sendOtpEmail,
} from "@/app/lib/registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const fullName = String(body.fullName ?? "").trim();
        const email = normalizeEmail(body.email);

        if (fullName.length < 2 || fullName.length > 255) {
            return NextResponse.json({ error: "Nama harus terdiri dari 2–255 karakter" }, { status: 400 });
        }
        if (!isValidEmail(email)) {
            return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
        }

        await ensureRegistrationTables();
        const existing = await findPreStudentByEmail(email);
        if (existing?.registration_completed_at) {
            return NextResponse.json({ error: "Email sudah terdaftar. Silakan login." }, { status: 409 });
        }

        const latest = await findLatestOtp(email);
        if (latest) {
            const remaining = OTP_RESEND_SECONDS - (Math.floor(Date.now() / 1000) - Number(latest.sent_at_epoch));
            if (remaining > 0) {
                return NextResponse.json({ error: `Tunggu ${Math.ceil(remaining)} detik sebelum mengirim ulang` }, { status: 429 });
            }
        }

        await queryMySQL(
            `INSERT INTO pre_students (full_name, email)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE
                full_name = IF(registration_completed_at IS NULL, VALUES(full_name), full_name),
                updated_at = CURRENT_TIMESTAMP`,
            [fullName, email]
        );

        const otp = generateOtp();
        await sendOtpEmail(email, fullName, otp);
        const sentAtEpoch = Math.floor(Date.now() / 1000);
        await queryMySQL(
            `INSERT INTO student_email_otps
                (email, name, password_hash, otp_hash, sent_at_epoch, expires_at_epoch, sent_at, expires_at)
             VALUES (?, ?, NULL, ?, ?, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MINUTE))`,
            [email, fullName, hashOtp(email, otp), sentAtEpoch, sentAtEpoch + OTP_TTL_MINUTES * 60, OTP_TTL_MINUTES]
        );
        return NextResponse.json({ message: "Kode OTP telah dikirim", email, expiresIn: OTP_TTL_MINUTES * 60 });
    } catch (error) {
        console.error("Request registration OTP error:", error);
        return NextResponse.json({ error: "Tidak dapat mengirim kode OTP. Coba lagi nanti." }, { status: 500 });
    }
}
