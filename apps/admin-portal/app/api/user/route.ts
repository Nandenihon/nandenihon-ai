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

const DEFAULT_PAGE_SIZE = 10;
const USER_SELECT = "SELECT id, username AS name, email, role, created_at, updated_at FROM users";
const VALID_ROLES = new Set(["super_admin", "admin", "teacher", "student"]);

function normalizeRole(role: unknown): string {
    if (role === "teachers") return "teacher";
    if (role === "staff") return "admin";
    return typeof role === "string" ? role : "";
}

/**
 * GET /api/user
 * List all users (admin only, excludes passwords)
 */
export async function GET(request: NextRequest) {
    const session = await requireAdminSession(request);
    if (!session) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);
        const offset = (page - 1) * limit;
        const search = searchParams.get("search") || "";

        let countSql = "SELECT COUNT(*) as total FROM users";
        let dataSql = USER_SELECT;
        const params: unknown[] = [];

        if (search) {
            countSql += " WHERE username LIKE ? OR email LIKE ?";
            dataSql += " WHERE username LIKE ? OR email LIKE ?";
            params.push(`%${search}%`, `%${search}%`);
        }

        dataSql += " ORDER BY id DESC LIMIT ? OFFSET ?";

        const countResult = await queryMySQL<RowDataPacket[]>(countSql, search ? params : []);
        const total = countResult[0]?.total || 0;

        const users = await queryMySQL<RowDataPacket[]>(dataSql, [...params, limit, offset]);

        return NextResponse.json({
            data: users,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Gagal mengambil data user", details: errorMessage }, { status: 500 });
    }
}

/**
 * POST /api/user
 * Create new user (admin only)
 */
export async function POST(request: NextRequest) {
    const session = await requireAdminSession(request);
    if (!session) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { name, email, password, role } = body;
        const normalizedRole = normalizeRole(role);

        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { error: "name, email, password, dan role wajib diisi" },
                { status: 400 }
            );
        }
        if (!VALID_ROLES.has(normalizedRole)) {
            return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
        }

        // Check email uniqueness
        const existing = await queryMySQL<RowDataPacket[]>(
            "SELECT id FROM users WHERE email = ? LIMIT 1", [email]
        );
        if (existing.length > 0) {
            return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
        }

        const hashedPassword = md5(password);
        const result = await queryMySQL<ResultSetHeader>(
            "INSERT INTO users (username, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)",
            [name, email, hashedPassword, normalizedRole, 1]
        );

        const newUser = await queryMySQL<RowDataPacket[]>(
            `${USER_SELECT} WHERE id = ?`,
            [result.insertId]
        );

        return NextResponse.json({ data: newUser[0] }, { status: 201 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Gagal membuat user", details: errorMessage }, { status: 500 });
    }
}
