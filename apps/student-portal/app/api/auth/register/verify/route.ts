import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import { COOKIE_MAX_AGE, COOKIE_NAME, signToken } from "@/app/lib/auth";
import {
    OTP_MAX_ATTEMPTS,
    OTP_TTL_MINUTES,
    ensureOtpTable,
    findLatestOtp,
    findUserByEmail,
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

        await ensureOtpTable();
        if (await findUserByEmail(email)) {
            return NextResponse.json({ error: "Email sudah terdaftar. Silakan login." }, { status: 409 });
        }

        const pending = await findLatestOtp(email);
        if (!pending) return NextResponse.json({ error: "Kode OTP tidak ditemukan. Kirim kode baru." }, { status: 404 });
        // Use the GMT+7 send time as the source of truth. This avoids legacy
        // expires_at values written under a different MySQL session timezone.
        const ageSeconds = Math.floor(Date.now() / 1000) - Number(pending.sent_at_epoch);
        if (Number.isFinite(ageSeconds) && ageSeconds > OTP_TTL_MINUTES * 60) {
            return NextResponse.json({ error: "Kode OTP sudah kedaluwarsa. Kirim kode baru." }, { status: 410 });
        }
        if (pending.attempts >= OTP_MAX_ATTEMPTS) {
            return NextResponse.json({ error: "Terlalu banyak percobaan. Kirim kode baru." }, { status: 429 });
        }
        if (!otpMatches(pending.otp_hash, email, otp)) {
            await queryMySQL("UPDATE student_email_otps SET attempts = attempts + 1 WHERE id = ?", [pending.id]);
            return NextResponse.json({ error: "Kode OTP salah" }, { status: 400 });
        }

        const columns = await queryMySQL<RowDataPacket[]>("SHOW COLUMNS FROM users");
        const names = new Set(columns.map((column) => String(column.Field)));
        const displayColumn = names.has("name") ? "name" : names.has("username") ? "username" : null;
        const insertColumns = ["email", "password", "role"];
        const values: Array<string | number> = [email, pending.password_hash, "student"];
        if (displayColumn) {
            insertColumns.unshift(displayColumn);
            values.unshift(pending.name);
        }
        if (names.has("is_active")) {
            insertColumns.push("is_active");
            values.push(1);
        }

        const escapedColumns = insertColumns.map((column) => `\`${column}\``).join(", ");
        const placeholders = insertColumns.map(() => "?").join(", ");
        const result = await queryMySQL<ResultSetHeader>(
            `INSERT INTO users (${escapedColumns}) VALUES (${placeholders})`,
            values
        );
        await queryMySQL(
            "UPDATE student_email_otps_v2 SET consumed_at = CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+07:00') WHERE id = ?",
            [pending.id]
        );

        const session = { id: result.insertId, name: pending.name, email, role: "student" as const };
        const token = await signToken(session);
        const response = NextResponse.json({ message: "Pendaftaran berhasil", user: session });
        response.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: COOKIE_MAX_AGE,
            path: "/",
        });
        return response;
    } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === "ER_DUP_ENTRY") {
            return NextResponse.json({ error: "Email sudah terdaftar. Silakan login." }, { status: 409 });
        }
        console.error("Verify registration OTP error:", error);
        return NextResponse.json({ error: "Pendaftaran gagal. Coba lagi nanti." }, { status: 500 });
    }
}
