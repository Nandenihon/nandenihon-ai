import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";

async function getSession(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
}

/**
 * GET /api/tool-requests
 * Retrieve learning tool requests (any authenticated staff session sees all requests).
 */
export async function GET(request: NextRequest) {
    const session = await getSession(request);
    if (!session) {
        return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "15", 10);
        const offset = (page - 1) * limit;

        let query = `
            SELECT r.*, u.username as requester_name, u.email as requester_email,
                   h.username as responder_name
            FROM learning_tool_requests r
            JOIN users u ON r.requester_id = u.id
            LEFT JOIN users h ON r.responder_id = h.id
        `;
        let countQuery = "SELECT COUNT(*) as total FROM learning_tool_requests r";
        const params: unknown[] = [];

        query += " ORDER BY r.created_at DESC LIMIT ? OFFSET ?";

        const countRes = await queryMySQL<RowDataPacket[]>(countQuery, params);
        const total = countRes[0]?.total || 0;

        const requests = await queryMySQL<RowDataPacket[]>(query, [...params, limit, offset]);

        return NextResponse.json({
            data: requests,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching tool requests:", error);
        return NextResponse.json({ error: "Gagal mengambil data request tool" }, { status: 500 });
    }
}

/**
 * POST /api/tool-requests
 * Submit a new learning tool request.
 * - Allowed: admin, super_admin, admin_1, admin_2
 */
export async function POST(request: NextRequest) {
    const session = await getSession(request);
    if (!session) {
        return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    if (!["admin", "super_admin", "admin_1", "admin_2"].includes(session.role)) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { tool_name, quantity, notes, category } = body;

        if (!tool_name || !quantity || Number(quantity) <= 0) {
            return NextResponse.json({ error: "Nama tool dan jumlah (quantity) wajib diisi dengan benar" }, { status: 400 });
        }

        const result = await queryMySQL<ResultSetHeader>(
            "INSERT INTO learning_tool_requests (requester_id, tool_name, quantity, notes, status, category) VALUES (?, ?, ?, ?, ?, ?)",
            [session.id, tool_name, Number(quantity), notes || null, "pending", category || "Alat Pembelajaran"]
        );

        const newRequest = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM learning_tool_requests WHERE id = ?",
            [result.insertId]
        );

        return NextResponse.json({ data: newRequest[0] }, { status: 201 });

    } catch (error) {
        console.error("Error creating tool request:", error);
        return NextResponse.json({ error: "Gagal mengirim request" }, { status: 500 });
    }
}
