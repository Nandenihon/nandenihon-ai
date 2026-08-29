import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { queryMySQL } from "@repo/database";
import { COOKIE_NAME } from "@/app/lib/auth";
import { hashPassword } from "@/app/lib/registration";
import {
    RESET_COOKIE_NAME,
    findResettableAccount,
    verifyResetToken,
} from "@/app/lib/password-reset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const md5 = (value: string) => crypto.createHash("md5").update(value).digest("hex");

export async function POST(request: NextRequest) {
    try {
        const resetToken = request.cookies.get(RESET_COOKIE_NAME)?.value ?? "";
        const verified = verifyResetToken(resetToken);
        if (!verified) {
            return NextResponse.json({ error: "Sesi reset password berakhir. Ulangi proses verifikasi." }, { status: 401 });
        }

        const body = await request.json();
        const password = String(body.password ?? "");
        const passwordConfirmation = String(body.passwordConfirmation ?? "");
        if (password.length < 8 || password.length > 128) {
            return NextResponse.json({ error: "Password harus terdiri dari 8–128 karakter" }, { status: 400 });
        }
        if (password !== passwordConfirmation) {
            return NextResponse.json({ error: "Konfirmasi password tidak sama" }, { status: 400 });
        }

        const account = await findResettableAccount(verified.email);
        if (!account) {
            return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
        }

        if (account.kind === "pre_student") {
            const newHash = hashPassword(password);
            await queryMySQL("UPDATE pre_students SET password_hash = ? WHERE id = ?", [newHash, account.preStudent.id]);
            if (account.preStudent.promoted_user_id) {
                await queryMySQL("UPDATE users SET password = ? WHERE id = ?", [newHash, account.preStudent.promoted_user_id]);
            } else {
                await queryMySQL("UPDATE users SET password = ? WHERE email = ?", [newHash, verified.email]);
            }
        } else {
            await queryMySQL("UPDATE users SET password = ? WHERE id = ?", [md5(password), account.userId]);
        }

        // Force a fresh login on this device after the reset; the app has no
        // server-side session store, so a single-cookie session is all there is
        // to invalidate here.
        const response = NextResponse.json({ message: "Password berhasil direset. Silakan login kembali." });
        response.cookies.delete(COOKIE_NAME);
        response.cookies.delete(RESET_COOKIE_NAME);
        return response;
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Gagal mereset password. Coba lagi nanti." }, { status: 500 });
    }
}
