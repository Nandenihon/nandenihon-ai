import { NextRequest, NextResponse } from "next/server";
import { createClassTest, listTestsForTeacher, teacherCanManageClass } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const classId = Number((await context.params).id);
    return NextResponse.json({
        data: await listTestsForTeacher(actor.role === "lecture" ? actor.id : null, classId),
    });
}

export async function POST(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const classId = Number((await context.params).id);
    if (actor.role === "lecture" && !(await teacherCanManageClass(actor.id, classId))) {
        return NextResponse.json({ error: "Anda bukan pengajar kelas ini" }, { status: 403 });
    }

    const body = await request.json();
    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "Judul tes wajib diisi" }, { status: 400 });
    const passScore = Number(body.passScore ?? 60);
    const timeLimitMinutes = Number(body.timeLimitMinutes ?? 30);
    if (!Number.isFinite(passScore) || passScore < 0 || passScore > 100) {
        return NextResponse.json({ error: "Nilai kelulusan harus 0-100" }, { status: 400 });
    }
    if (!Number.isFinite(timeLimitMinutes) || timeLimitMinutes <= 0) {
        return NextResponse.json({ error: "Batas waktu tidak valid" }, { status: 400 });
    }

    const id = await createClassTest({
        classId,
        createdBy: actor.id,
        title,
        instructions: String(body.instructions ?? "").trim() || undefined,
        passScore,
        timeLimitMinutes,
    });
    return NextResponse.json({ id }, { status: 201 });
}
