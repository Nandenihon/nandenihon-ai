import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import { fetchR2Object } from "@repo/utils/r2-upload";
import { COOKIE_NAME, verifyToken } from "@/app/lib/auth";

type Context = { params: Promise<{ id: string }> };

/** GET /api/enrollment/submissions/:id/correction — the teacher-corrected PDF of the student's own submission. */
export async function GET(request: NextRequest, context: Context) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifyToken(token) : null;
    if (!session || session.id < 1) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const rows = await queryMySQL<RowDataPacket[]>(
        "SELECT correction_file_key, original_filename FROM submissions WHERE id = ? AND student_id = ? LIMIT 1",
        [Number((await context.params).id), session.id]
    );
    const item = rows[0];
    if (!item?.correction_file_key) return NextResponse.json({ error: "Koreksi belum tersedia" }, { status: 404 });
    const object = await fetchR2Object(String(item.correction_file_key));
    if (!object?.body) return NextResponse.json({ error: "File koreksi tidak ditemukan di storage" }, { status: 404 });
    return new NextResponse(object.body, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="koreksi-${String(item.original_filename).replaceAll('"', "")}"`,
            "Cache-Control": "private, no-store",
        },
    });
}
