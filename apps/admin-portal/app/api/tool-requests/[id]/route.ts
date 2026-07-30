import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";

async function getSession(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
}

/**
 * PUT /api/tool-requests/[id]
 * Update status (helpdesk action) or update content (classadmin edit action).
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession(request);
    if (!session) {
        return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Fetch current request
        const currentReq = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM learning_tool_requests WHERE id = ? LIMIT 1",
            [id]
        );

        if (currentReq.length === 0) {
            return NextResponse.json({ error: "Request tidak ditemukan" }, { status: 404 });
        }

        const toolRequest = currentReq[0];
        const body = await request.json();

        // Check if responder action (super_admin, admin_1, admin_2)
        if (body.status && ["approved", "rejected"].includes(body.status)) {
            if (!["super_admin", "admin_1", "admin_2"].includes(session.role)) {
                return NextResponse.json({ error: "Hanya admin yang dapat merespon request" }, { status: 403 });
            }

            await queryMySQL<ResultSetHeader>(
                "UPDATE learning_tool_requests SET status = ?, responder_id = ?, response_notes = ?, provided_link = ? WHERE id = ?",
                [body.status, session.id, body.response_notes || null, body.provided_link || null, id]
            );

            const updated = await queryMySQL<RowDataPacket[]>(
                "SELECT * FROM learning_tool_requests WHERE id = ?",
                [id]
            );
            return NextResponse.json({ data: updated[0] });
        }

        // Otherwise it is an edit action (requester edit)
        if (toolRequest.requester_id !== session.id && !["super_admin", "admin_1", "admin_2"].includes(session.role)) {
            return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
        }

        if (toolRequest.status !== "pending") {
            return NextResponse.json({ error: "Hanya request dengan status pending yang dapat diubah" }, { status: 400 });
        }

        const { tool_name, quantity, notes, category } = body;
        if (!tool_name || !quantity || Number(quantity) <= 0) {
            return NextResponse.json({ error: "Nama tool dan jumlah (quantity) wajib diisi dengan benar" }, { status: 400 });
        }

        await queryMySQL<ResultSetHeader>(
            "UPDATE learning_tool_requests SET tool_name = ?, quantity = ?, notes = ?, category = ? WHERE id = ?",
            [tool_name, Number(quantity), notes || null, category || "Alat Pembelajaran", id]
        );

        const updated = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM learning_tool_requests WHERE id = ?",
            [id]
        );
        return NextResponse.json({ data: updated[0] });

    } catch (error) {
        console.error("Error updating tool request:", error);
        return NextResponse.json({ error: "Gagal memperbarui request" }, { status: 500 });
    }
}

/**
 * DELETE /api/tool-requests/[id]
 * Delete request (requester only, and only if pending).
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession(request);
    if (!session) {
        return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const currentReq = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM learning_tool_requests WHERE id = ? LIMIT 1",
            [id]
        );

        if (currentReq.length === 0) {
            return NextResponse.json({ error: "Request tidak ditemukan" }, { status: 404 });
        }

        const toolRequest = currentReq[0];

        if (toolRequest.requester_id !== session.id && !["super_admin", "admin_1", "admin_2"].includes(session.role)) {
            return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
        }

        if (toolRequest.status !== "pending") {
            return NextResponse.json({ error: "Hanya request dengan status pending yang dapat dihapus" }, { status: 400 });
        }

        await queryMySQL<ResultSetHeader>(
            "DELETE FROM learning_tool_requests WHERE id = ?",
            [id]
        );

        return NextResponse.json({ message: "Request berhasil dihapus" });

    } catch (error) {
        console.error("Error deleting tool request:", error);
        return NextResponse.json({ error: "Gagal menghapus request" }, { status: 500 });
    }
}
