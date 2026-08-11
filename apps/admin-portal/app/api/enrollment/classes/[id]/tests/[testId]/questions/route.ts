import { NextRequest, NextResponse } from "next/server";
import { findClassTestById, replaceTestQuestions, teacherCanManageClass, type ClassTestQuestionInput } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string; testId: string }> };

export async function PUT(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const testId = Number((await context.params).testId);
    const test = await findClassTestById(testId);
    if (!test) return NextResponse.json({ error: "Tes tidak ditemukan" }, { status: 404 });
    if (actor.role === "lecture" && !(await teacherCanManageClass(actor.id, test.classId))) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await request.json();
    const questions: ClassTestQuestionInput[] = Array.isArray(body.questions)
        ? body.questions.map((question: Record<string, unknown>) => ({
            text: String(question.text ?? ""),
            options: Array.isArray(question.options) ? question.options.map(String) : [],
            correctAnswer: String(question.correctAnswer ?? ""),
            points: question.points !== undefined ? Number(question.points) : 1,
        }))
        : [];

    try {
        const result = await replaceTestQuestions(testId, questions);
        if (result.errors.length) return NextResponse.json({ error: result.errors.join("; ") }, { status: 400 });
        return NextResponse.json({ message: `${result.count} soal tersimpan` });
    } catch (error) {
        const message = error instanceof Error && error.message === "NO_QUESTIONS_PROVIDED"
            ? "Minimal satu soal diperlukan"
            : "Gagal menyimpan soal";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
