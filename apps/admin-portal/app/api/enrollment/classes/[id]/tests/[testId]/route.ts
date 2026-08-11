import { NextRequest, NextResponse } from "next/server";
import { findClassTestById, listQuestionsForTest, teacherCanManageClass, updateClassTest } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string; testId: string }> };

export async function GET(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const testId = Number((await context.params).testId);
    const test = await findClassTestById(testId);
    if (!test) return NextResponse.json({ error: "Tes tidak ditemukan" }, { status: 404 });
    if (actor.role === "lecture" && !(await teacherCanManageClass(actor.id, test.classId))) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }
    const questions = await listQuestionsForTest(testId);
    return NextResponse.json({ data: { ...test, questions } });
}

export async function PATCH(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const testId = Number((await context.params).testId);
    const test = await findClassTestById(testId);
    if (!test) return NextResponse.json({ error: "Tes tidak ditemukan" }, { status: 404 });
    if (actor.role === "lecture" && !(await teacherCanManageClass(actor.id, test.classId))) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await request.json();
    const passScore = body.passScore !== undefined ? Number(body.passScore) : undefined;
    const timeLimitMinutes = body.timeLimitMinutes !== undefined ? Number(body.timeLimitMinutes) : undefined;
    if (passScore !== undefined && (!Number.isFinite(passScore) || passScore < 0 || passScore > 100)) {
        return NextResponse.json({ error: "Nilai kelulusan harus 0-100" }, { status: 400 });
    }
    if (timeLimitMinutes !== undefined && (!Number.isFinite(timeLimitMinutes) || timeLimitMinutes <= 0)) {
        return NextResponse.json({ error: "Batas waktu tidak valid" }, { status: 400 });
    }

    await updateClassTest(testId, {
        title: body.title !== undefined ? String(body.title).trim() : undefined,
        instructions: body.instructions !== undefined ? String(body.instructions).trim() : undefined,
        passScore,
        timeLimitMinutes,
    });
    return NextResponse.json({ message: "Tes berhasil diperbarui" });
}
