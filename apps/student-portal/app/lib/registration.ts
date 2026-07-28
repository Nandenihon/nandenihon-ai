import crypto from "crypto";
import { queryMySQL, type RowDataPacket } from "@repo/database";

export const OTP_TTL_MINUTES = 10;
export const OTP_RESEND_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;
export const REGISTRATION_COOKIE_NAME = "nn_student_registration";

// Existing LMS tables use positive `users.id` values. Keep pre-student sessions
// in a separate numeric namespace so an equal id can never expose legacy data.
export function toPreStudentSessionId(preStudentId: number): number {
    return -Math.abs(preStudentId);
}

export function fromPreStudentSessionId(sessionId: number): number | null {
    return sessionId < 0 ? Math.abs(sessionId) : null;
}

export type PreStudentRow = RowDataPacket & {
    id: number;
    full_name: string;
    nickname: string | null;
    email: string;
    phone_number: string | null;
    domicile: string | null;
    motivation: string | null;
    japanese_level: string | null;
    password_hash: string | null;
    email_verified_at: Date | string | null;
    registration_completed_at: Date | string | null;
    promoted_user_id: number | null;
};

type OtpRow = RowDataPacket & {
    id: number;
    email: string;
    name: string;
    otp_hash: string;
    attempts: number;
    sent_at_epoch: number;
};

export function normalizeEmail(value: unknown): string {
    return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
}

function getSecret(): string {
    const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new Error("OTP_HASH_SECRET atau JWT_SECRET belum dikonfigurasi");
    return secret;
}

export function hashOtp(email: string, otp: string): string {
    return crypto.createHmac("sha256", getSecret()).update(`${email}:${otp}`).digest("hex");
}

export function otpMatches(expectedHash: string, email: string, otp: string): boolean {
    const actual = Buffer.from(hashOtp(email, otp), "hex");
    const expected = Buffer.from(expectedHash, "hex");
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const derived = crypto.scryptSync(password, salt, 64).toString("hex");
    return `scrypt:${salt}:${derived}`;
}

export function passwordMatches(password: string, storedHash: string): boolean {
    const [algorithm, salt, expectedHex] = storedHash.split(":");
    if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
    const actual = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, "hex");
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function createRegistrationToken(preStudentId: number, email: string): string {
    const payload = Buffer.from(JSON.stringify({
        preStudentId,
        email,
        expiresAt: Date.now() + 30 * 60 * 1000,
    })).toString("base64url");
    const signature = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
    return `${payload}.${signature}`;
}

export function verifyRegistrationToken(token: string): { preStudentId: number; email: string } | null {
    try {
        const [payload, signature] = token.split(".");
        if (!payload || !signature) return null;
        const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest();
        const actual = Buffer.from(signature, "base64url");
        if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
        const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        if (!parsed.preStudentId || !parsed.email || parsed.expiresAt < Date.now()) return null;
        return { preStudentId: Number(parsed.preStudentId), email: String(parsed.email) };
    } catch {
        return null;
    }
}

export async function ensureRegistrationTables(): Promise<void> {
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS pre_students (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            nickname VARCHAR(100) NULL,
            email VARCHAR(255) NOT NULL,
            phone_number VARCHAR(30) NULL,
            domicile VARCHAR(255) NULL,
            motivation TEXT NULL,
            japanese_level ENUM('BEGINNER','N5','N4','N3','N2','N1') NULL,
            password_hash VARCHAR(255) NULL,
            avatar_url VARCHAR(1000) NULL,
            email_verified_at DATETIME NULL,
            registration_completed_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_pre_students_email (email),
            INDEX idx_pre_students_registration (email_verified_at, registration_completed_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const preStudentColumns = await queryMySQL<RowDataPacket[]>("SHOW COLUMNS FROM pre_students");
    if (!preStudentColumns.some((column) => String(column.Field) === "avatar_url")) {
        await queryMySQL("ALTER TABLE pre_students ADD COLUMN avatar_url VARCHAR(1000) NULL AFTER password_hash");
    }

    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS student_email_otps (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            password_hash VARCHAR(255) NULL,
            otp_hash CHAR(64) NOT NULL,
            attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
            sent_at_epoch BIGINT UNSIGNED NULL,
            expires_at_epoch BIGINT UNSIGNED NULL,
            sent_at DATETIME NOT NULL,
            expires_at DATETIME NOT NULL,
            consumed_at DATETIME NULL,
            INDEX idx_student_email_otps_lookup (email, consumed_at, id),
            INDEX idx_student_email_otps_expiry (expires_at_epoch)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const columns = await queryMySQL<RowDataPacket[]>("SHOW COLUMNS FROM student_email_otps");
    const names = new Set(columns.map((column) => String(column.Field)));
    const passwordHashColumn = columns.find((column) => String(column.Field) === "password_hash");
    if (passwordHashColumn && String(passwordHashColumn.Null).toUpperCase() === "NO") {
        await queryMySQL(
            "ALTER TABLE student_email_otps MODIFY COLUMN password_hash VARCHAR(255) NULL"
        );
    }
    if (!names.has("sent_at_epoch")) {
        await queryMySQL("ALTER TABLE student_email_otps ADD COLUMN sent_at_epoch BIGINT UNSIGNED NULL AFTER attempts");
    }
    if (!names.has("expires_at_epoch")) {
        await queryMySQL("ALTER TABLE student_email_otps ADD COLUMN expires_at_epoch BIGINT UNSIGNED NULL AFTER sent_at_epoch");
    }
}

export async function findPreStudentByEmail(email: string): Promise<PreStudentRow | null> {
    const rows = await queryMySQL<PreStudentRow[]>(
        "SELECT * FROM pre_students WHERE email = ? LIMIT 1",
        [email]
    );
    return rows[0] ?? null;
}

export async function findLatestOtp(email: string): Promise<OtpRow | null> {
    const rows = await queryMySQL<OtpRow[]>(
        `SELECT id, email, name, otp_hash, attempts, sent_at_epoch
         FROM student_email_otps
         WHERE email = ? AND consumed_at IS NULL AND sent_at_epoch IS NOT NULL
         ORDER BY id DESC LIMIT 1`,
        [email]
    );
    return rows[0] ?? null;
}

export async function sendOtpEmail(email: string, name: string, otp: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY belum dikonfigurasi");
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            from: "Nande Nihon <no-reply@nandenihon.com>",
            to: [email],
            subject: `${otp} adalah kode verifikasi Nande Nihon Anda`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#25324b">
                    <h2 style="color:#264682">Verifikasi email Anda</h2>
                    <p>Halo ${escapeHtml(name)},</p>
                    <p>Masukkan kode berikut untuk melanjutkan pendaftaran siswa Nande Nihon:</p>
                    <div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:18px 20px;background:#f2f6ff;border-radius:12px;text-align:center">${otp}</div>
                    <p>Kode ini berlaku selama ${OTP_TTL_MINUTES} menit. Jangan berikan kode ini kepada siapa pun.</p>
                </div>`,
        }),
    });
    if (!response.ok) {
        console.error("Resend OTP error:", response.status, await response.text());
        throw new Error("Email OTP gagal dikirim");
    }
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
    })[character] ?? character);
}
