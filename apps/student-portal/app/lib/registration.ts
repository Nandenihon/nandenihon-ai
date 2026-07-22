import crypto from "crypto";
import { queryMySQL, type RowDataPacket } from "@repo/database";

export const OTP_TTL_MINUTES = 10;
export const OTP_RESEND_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

type OtpRow = RowDataPacket & {
    id: number;
    email: string;
    name: string;
    password_hash: string;
    otp_hash: string;
    expires_at: Date | string;
    attempts: number;
    sent_at: Date | string;
    sent_at_epoch: number;
};

export function normalizeEmail(value: unknown): string {
    return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function hashPassword(password: string): string {
    // Keep compatibility with the current users table and login endpoint.
    return crypto.createHash("md5").update(password).digest("hex");
}

function getOtpSecret(): string {
    const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new Error("OTP_HASH_SECRET atau JWT_SECRET belum dikonfigurasi");
    return secret;
}

export function generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(email: string, otp: string): string {
    return crypto.createHmac("sha256", getOtpSecret()).update(`${email}:${otp}`).digest("hex");
}

export function otpMatches(expectedHash: string, email: string, otp: string): boolean {
    const actual = Buffer.from(hashOtp(email, otp), "hex");
    const expected = Buffer.from(expectedHash, "hex");
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export async function ensureOtpTable(): Promise<void> {
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS student_email_otps (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            otp_hash CHAR(64) NOT NULL,
            attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
            sent_at_epoch BIGINT UNSIGNED NOT NULL,
            expires_at_epoch BIGINT UNSIGNED NOT NULL,
            sent_at DATETIME NOT NULL,
            expires_at DATETIME NOT NULL,
            consumed_at DATETIME NULL,
            INDEX idx_student_email_otps_lookup (email, consumed_at, id),
            INDEX idx_student_email_otps_expiry (expires_at_epoch)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // CREATE TABLE IF NOT EXISTS does not update installations that already
    // have the legacy OTP table, so migrate those schemas explicitly.
    const columns = await queryMySQL<RowDataPacket[]>("SHOW COLUMNS FROM student_email_otps");
    const columnNames = new Set(columns.map((column) => String(column.Field)));

    if (!columnNames.has("sent_at_epoch")) {
        await queryMySQL(
            "ALTER TABLE student_email_otps ADD COLUMN sent_at_epoch BIGINT UNSIGNED NULL AFTER attempts"
        );
    }
    if (!columnNames.has("expires_at_epoch")) {
        await queryMySQL(
            "ALTER TABLE student_email_otps ADD COLUMN expires_at_epoch BIGINT UNSIGNED NULL AFTER sent_at_epoch"
        );
    }
}

export async function findUserByEmail(email: string): Promise<RowDataPacket | null> {
    const rows = await queryMySQL<RowDataPacket[]>(
        "SELECT id, email, role FROM users WHERE email = ? LIMIT 1",
        [email]
    );
    return rows[0] ?? null;
}

export async function findLatestOtp(email: string): Promise<OtpRow | null> {
    const rows = await queryMySQL<OtpRow[]>(
        `SELECT id, email, name, password_hash, otp_hash, expires_at, attempts, sent_at, sent_at_epoch
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
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: "Nande Nihon <no-reply@nandenihon.com>",
            to: [email],
            subject: `${otp} adalah kode verifikasi Nande Nihon Anda`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#25324b">
                    <h2 style="color:#264682">Verifikasi email Anda</h2>
                    <p>Halo ${escapeHtml(name)},</p>
                    <p>Masukkan kode berikut untuk menyelesaikan pendaftaran akun siswa Nande Nihon:</p>
                    <div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:18px 20px;background:#f2f6ff;border-radius:12px;text-align:center">${otp}</div>
                    <p>Kode ini berlaku selama ${OTP_TTL_MINUTES} menit. Jangan berikan kode ini kepada siapa pun.</p>
                    <p style="color:#75809a;font-size:13px">Jika Anda tidak meminta kode ini, abaikan email ini.</p>
                </div>
            `,
        }),
    });

    if (!response.ok) {
        const details = await response.text();
        console.error("Resend OTP error:", response.status, details);
        throw new Error("Email OTP gagal dikirim");
    }
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
    })[character] ?? character);
}
