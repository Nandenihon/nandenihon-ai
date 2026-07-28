import { NextRequest, NextResponse } from "next/server";
import { listApplications, teacherCanManageClass } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

export async function GET(request: NextRequest) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const params = request.nextUrl.searchParams;
    const classId = Number(params.get("classId")) || undefined;
    if (actor.role === "teacher" && (!classId || !await teacherCanManageClass(actor.id, classId))) {
        return NextResponse.json({ error: "Anda bukan pengajar kelas ini" }, { status: 403 });
    }
    const data = await listApplications({
        status: params.get("status") || undefined,
        classId,
        search: params.get("search") || undefined,
    });
    return NextResponse.json({ data });
}
