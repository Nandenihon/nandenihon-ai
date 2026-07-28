import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, teacherCanManageClass, type RowDataPacket } from "@repo/database";
import { fetchR2Object } from "@repo/utils/r2-upload";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const rows = await queryMySQL<RowDataPacket[]>(
        `SELECT s.file_key, s.original_filename, s.mime_type, a.class_id
         FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE s.id = ? LIMIT 1`,
        [Number((await context.params).id)]
    );
    const item = rows[0];
    if (!item) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
    if (!await teacherCanManageClass(actor.id, Number(item.class_id)) && !["super_admin", "admin"].includes(actor.role)) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }
    const object = await fetchR2Object(String(item.file_key));
    if (!object?.body) return NextResponse.json({ error: "File tidak ditemukan di storage" }, { status: 404 });
    return new NextResponse(object.body, {
        headers: {
            "Content-Type": String(item.mime_type),
            "Content-Disposition": `inline; filename="${String(item.original_filename).replaceAll('"', "")}"`,
            "Cache-Control": "private, no-store",
        },
    });
}
