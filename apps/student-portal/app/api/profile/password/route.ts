import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import { COOKIE_NAME, verifyToken } from "@/app/lib/auth";

export const runtime = "nodejs";

const md5 = (value: string) => crypto.createHash("md5").update(value).digest("hex");

export async function PATCH(request: NextRequest) {
    try {
        const token = request.cookies.get(COOKIE_NAME)?.value;
        const session = token ? await verifyToken(token) : null;
        if (!session || session.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const currentPassword = String(body.currentPassword ?? "");
        const newPassword = String(body.newPassword ?? "");
        if (newPassword.length < 8 || newPassword.length > 128) return NextResponse.json({ error: "Password baru harus terdiri dari 8–128 karakter" }, { status: 400 });
        if (currentPassword === newPassword) return NextResponse.json({ error: "Password baru harus berbeda" }, { status: 400 });

        const rows = await queryMySQL<RowDataPacket[]>("SELECT password FROM users WHERE id = ? LIMIT 1", [session.id]);
        if (!rows[0] || rows[0].password !== md5(currentPassword)) return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
        await queryMySQL("UPDATE users SET password = ? WHERE id = ?", [md5(newPassword), session.id]);
        return NextResponse.json({ message: "Password berhasil diperbarui" });
    } catch (error) {
        console.error("Update student password error:", error);
        return NextResponse.json({ error: "Gagal memperbarui password" }, { status: 500 });
    }
}
