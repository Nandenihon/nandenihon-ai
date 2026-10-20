import crypto from "crypto";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import { findPreStudentByEmail, type PreStudentRow } from "./registration";

export const RESET_OTP_TTL_MINUTES = 10;
export const RESET_OTP_RESEND_SECONDS = 60;
export const RESET_OTP_MAX_ATTEMPTS = 5;
export const RESET_TOKEN_TTL_MINUTES = 15;
export const RESET_COOKIE_NAME = "nn_student_password_reset";

const RESET_TOKEN_PURPOSE = "password_reset";

type ResetOtpRow = RowDataPacket & {
    id: number;
    email: string;
    otp_hash: string;
    attempts: number;
    sent_at_epoch: number;
};

export type ResettableAccount =
    | { kind: "pre_student"; preStudent: PreStudentRow; name: string }
    | { kind: "legacy_user"; userId: number; name: string };

function getSecret(): string {
    const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new Error("OTP_HASH_SECRET atau JWT_SECRET belum dikonfigurasi");
    return secret;
}

export function hashResetOtp(email: string, otp: string): string {
    return crypto.createHmac("sha256", getSecret()).update(`reset:${email}:${otp}`).digest("hex");
}

export function resetOtpMatches(expectedHash: string, email: string, otp: string): boolean {
    const actual = Buffer.from(hashResetOtp(email, otp), "hex");
    const expected = Buffer.from(expectedHash, "hex");
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function createResetToken(email: string): string {
    const payload = Buffer.from(JSON.stringify({
        purpose: RESET_TOKEN_PURPOSE,
        email,
        expiresAt: Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000,
    })).toString("base64url");
    const signature = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
    return `${payload}.${signature}`;
}

export function verifyResetToken(token: string): { email: string } | null {
    try {
        const [payload, signature] = token.split(".");
        if (!payload || !signature) return null;
        const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest();
        const actual = Buffer.from(signature, "base64url");
        if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
        const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        if (parsed.purpose !== RESET_TOKEN_PURPOSE || !parsed.email || parsed.expiresAt < Date.now()) return null;
        return { email: String(parsed.email) };
    } catch {
        return null;
    }
}

let resetTableReady: Promise<void> | null = null;

export async function ensurePasswordResetTable(): Promise<void> {
    if (!resetTableReady) {
        resetTableReady = ensurePasswordResetTableUncached().catch((error) => {
            resetTableReady = null;
            throw error;
        });
    }
    await resetTableReady;
}

async function ensurePasswordResetTableUncached(): Promise<void> {
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS password_reset_otps (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            otp_hash CHAR(64) NOT NULL,
            attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
            sent_at_epoch BIGINT UNSIGNED NOT NULL,
            expires_at_epoch BIGINT UNSIGNED NOT NULL,
            consumed_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_password_reset_otps_lookup (email, consumed_at, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

export async function findLatestResetOtp(email: string): Promise<ResetOtpRow | null> {
    const rows = await queryMySQL<ResetOtpRow[]>(
        `SELECT id, email, otp_hash, attempts, sent_at_epoch
         FROM password_reset_otps
         WHERE email = ? AND consumed_at IS NULL
         ORDER BY id DESC LIMIT 1`,
        [email]
    );
    return rows[0] ?? null;
}

/**
 * Looks up the account a forgot-password request should act on. Only accounts
 * that already have a usable password are resettable: a completed
 * pre-student registration (scrypt hash) or a legacy `users` row with
 * role = 'student' (md5 hash) — see the dual-path check in the login route.
 */
export async function findResettableAccount(email: string): Promise<ResettableAccount | null> {
    const preStudent = await findPreStudentByEmail(email);
    if (preStudent?.registration_completed_at && preStudent.password_hash) {
        return { kind: "pre_student", preStudent, name: preStudent.nickname || preStudent.full_name };
    }

    const rows = await queryMySQL<RowDataPacket[]>(
        "SELECT id, username, role, is_active FROM users WHERE email = ? LIMIT 1",
        [email]
    );
    const user = rows[0];
    if (user && user.role === "student" && user.is_active !== 0 && user.is_active !== false) {
        return { kind: "legacy_user", userId: Number(user.id), name: String(user.username || "Siswa") };
    }

    return null;
}

export async function sendPasswordResetOtpEmail(email: string, name: string, otp: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY belum dikonfigurasi");
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            from: "Nande Nihon <resetpass@nandenihon.com>",
            to: [email],
            subject: `${otp} adalah kode reset password Nande Nihon Anda`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#25324b">
                    <h2 style="color:#264682">Reset Password Akun Anda</h2>
                    <p>Halo ${escapeHtml(name)},</p>
                    <p>Kami menerima permintaan untuk mereset password akun siswa Nande Nihon Anda. Masukkan kode berikut untuk melanjutkan:</p>
                    <div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:18px 20px;background:#fff2f0;border-radius:12px;text-align:center;color:#c0392b">${otp}</div>
                    <p>Kode ini berlaku selama ${RESET_OTP_TTL_MINUTES} menit. Jika Anda tidak meminta reset password, abaikan email ini dan password Anda akan tetap aman.</p>
                    <p style="color:#8a94a6;font-size:12px;margin-top:24px">Demi keamanan, jangan bagikan kode ini kepada siapa pun, termasuk pihak yang mengaku dari Nande Nihon.</p>
                </div>`,
        }),
    });
    if (!response.ok) {
        console.error("Resend password reset OTP error:", response.status, await response.text());
        throw new Error("Email reset password gagal dikirim");
    }
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
    })[character] ?? character);
}
