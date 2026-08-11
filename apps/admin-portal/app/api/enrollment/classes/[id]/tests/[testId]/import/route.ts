import { NextRequest, NextResponse } from "next/server";
import { findClassTestById, parseQuestionCsv, replaceTestQuestions, teacherCanManageClass, updateClassTest } from "@repo/database";
import { uploadFileToR2 } from "@repo/utils/r2-upload";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string; testId: string }> };

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB is plenty for a CSV question bank

export async function POST(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const testId = Number((await context.params).testId);
    const test = await findClassTestById(testId);
    if (!test) return NextResponse.json({ error: "Tes tidak ditemukan" }, { status: 404 });
    if (actor.role === "lecture" && !(await teacherCanManageClass(actor.id, test.classId))) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Pilih file CSV soal terlebih dahulu" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".csv")) return NextResponse.json({ error: "File harus berformat .csv" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const content = buffer.toString("utf-8");
    const parsed = parseQuestionCsv(content);
    if (parsed.errors.length) return NextResponse.json({ error: parsed.errors.join("; ") }, { status: 400 });

    try {
        const result = await replaceTestQuestions(testId, parsed.questions);
        if (result.errors.length) return NextResponse.json({ error: result.errors.join("; ") }, { status: 400 });

        const upload = await uploadFileToR2({
            buffer,
            contentType: "text/csv",
            folder: `class-test-import-${testId}`,
            originalFilename: file.name,
        });
        await updateClassTest(testId, { sourceFileName: file.name, sourceFileUrl: upload.publicUrl });

        return NextResponse.json({ message: `${result.count} soal berhasil diimpor dari ${file.name}` });
    } catch (error) {
        const message = error instanceof Error && error.message === "NO_QUESTIONS_PROVIDED"
            ? "File tidak berisi soal yang valid"
            : "Gagal mengimpor soal";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
