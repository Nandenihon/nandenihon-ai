import { NextRequest, NextResponse } from "next/server";
import { findPortalClass, listClassMembers, teacherCanManageClass } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const classId = Number((await context.params).id);
    const classItem = await findPortalClass(classId);
    if (!classItem || (actor.role === "lecture" && !await teacherCanManageClass(actor.id, classId))) {
        return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: await listClassMembers(classId) });
}
