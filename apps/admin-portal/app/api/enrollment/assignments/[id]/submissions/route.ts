import { NextRequest, NextResponse } from "next/server";
import { findAssignment, listAssignmentSubmissions, teacherCanManageClass } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const id = Number((await context.params).id);
    const assignment = await findAssignment(id);
    if (!assignment) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    if (!await teacherCanManageClass(actor.id, Number(assignment.class_id)) && !["super_admin", "admin"].includes(actor.role)) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }
    return NextResponse.json({ data: await listAssignmentSubmissions(id) });
}
