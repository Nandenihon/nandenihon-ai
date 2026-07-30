import { NextRequest, NextResponse } from "next/server";
import { createAssignment, listAssignmentsForTeacher, teacherCanManageClass } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

export async function GET(request: NextRequest) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    return NextResponse.json({
        data: await listAssignmentsForTeacher(
            actor.role === "lecture" ? actor.id : null,
            Number(request.nextUrl.searchParams.get("classId")) || undefined
        ),
    });
}

export async function POST(request: NextRequest) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const body = await request.json();
    const input = {
        classId: Number(body.classId), creatorId: actor.id, title: String(body.title ?? "").trim(),
        description: String(body.description ?? "").trim(), subject: String(body.subject ?? "").trim(),
        deadlineAt: String(body.deadlineAt ?? ""), maxScore: Number(body.maxScore),
        attachmentKey: String(body.attachmentKey ?? ""), allowResubmission: Boolean(body.allowResubmission),
    };
    if (!input.classId || !input.title || !input.description || !input.subject || !input.deadlineAt || !Number.isFinite(input.maxScore) || input.maxScore <= 0) {
        return NextResponse.json({ error: "Data tugas belum lengkap" }, { status: 400 });
    }
    if (!await teacherCanManageClass(actor.id, input.classId) && !["super_admin", "admin"].includes(actor.role)) {
        return NextResponse.json({ error: "Anda bukan teacher kelas ini" }, { status: 403 });
    }
    try {
        return NextResponse.json({ id: await createAssignment(input) }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Kelas harus berstatus published" }, { status: 409 });
    }
}
