import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";
import crypto from "crypto";

function md5(str: string): string {
    return crypto.createHash("md5").update(str).digest("hex");
}

async function requireAdminSession(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const session = await verifyToken(token);
    if (!session) return null;
    if (!["super_admin", "admin"].includes(session.role)) return null;
    return session;
}

const USER_SELECT = "SELECT id, username AS name, email, role, created_at, updated_at FROM users";
const VALID_ROLES = new Set(["super_admin", "admin", "teacher", "student"]);

function normalizeRole(role: unknown): string {
    if (role === "teachers") return "teacher";
    if (role === "staff") return "admin";
    return typeof role === "string" ? role : "";
}

/**
 * GET /api/user/[id]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireAdminSession(request);
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

    const { id } = await params;
    const users = await queryMySQL<RowDataPacket[]>(
        `${USER_SELECT} WHERE id = ? LIMIT 1`, [id]
    );
    if (!users.length) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ data: users[0] });
}

/**
 * PUT /api/user/[id]
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireAdminSession(request);
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { name, email, password, role } = body;
    const normalizedRole = role ? normalizeRole(role) : "";

    const updates: string[] = [];
    const values: unknown[] = [];

    if (name) { updates.push("username = ?"); values.push(name); }
    if (email) { updates.push("email = ?"); values.push(email); }
    if (password) { updates.push("password = ?"); values.push(md5(password)); }
    if (role) {
        if (!VALID_ROLES.has(normalizedRole)) {
            return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
        }
        updates.push("role = ?");
        values.push(normalizedRole);
    }

    if (updates.length === 0) {
        return NextResponse.json({ error: "Tidak ada data yang diubah" }, { status: 400 });
    }

    values.push(id);
    await queryMySQL<ResultSetHeader>(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    const updated = await queryMySQL<RowDataPacket[]>(
        `${USER_SELECT} WHERE id = ?`, [id]
    );
    return NextResponse.json({ data: updated[0] });
}

/**
 * DELETE /api/user/[id]
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireAdminSession(request);
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

    const { id } = await params;

    // Prevent deleting yourself
    if (String(session.id) === id) {
        return NextResponse.json({ error: "Tidak dapat menghapus akun Anda sendiri" }, { status: 400 });
    }

    await queryMySQL<ResultSetHeader>("DELETE FROM users WHERE id = ?", [id]);
    return NextResponse.json({ message: "User berhasil dihapus" });
}
