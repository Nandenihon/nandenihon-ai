import { NextRequest, NextResponse } from "next/server";
import { ensureQuizTables, insertQuestions, parseQuestionCsv, type QuizLevel } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

const VALID_LEVELS = new Set(["N5 Basic", "N5 Menengah", "N5 Lanjutan", "N4"]);
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB is plenty for a CSV question bank

export async function POST(request: NextRequest) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    try {
        await ensureQuizTables();

        const formData = await request.formData();
        const file = formData.get("file");
        const level = String(formData.get("level") ?? "");

        if (!VALID_LEVELS.has(level)) {
            return NextResponse.json({ error: `level harus salah satu dari: ${[...VALID_LEVELS].join(", ")}` }, { status: 400 });
        }
        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json({ error: "Pilih file CSV soal terlebih dahulu" }, { status: 400 });
        }
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 });
        }
        if (!file.name.toLowerCase().endsWith(".csv")) {
            return NextResponse.json({ error: "File harus berformat .csv (dari Excel: File > Save As > CSV UTF-8)" }, { status: 400 });
        }

        const content = Buffer.from(await file.arrayBuffer()).toString("utf-8");
        const parsed = parseQuestionCsv(content);
        if (parsed.errors.length) {
            return NextResponse.json({ error: parsed.errors.join("; ") }, { status: 400 });
        }
        if (parsed.questions.length === 0) {
            return NextResponse.json({ error: "File tidak berisi soal yang valid" }, { status: 400 });
        }

        const count = await insertQuestions(parsed.questions.map((question) => ({ ...question, level: level as QuizLevel })));
        return NextResponse.json({ message: `${count} soal berhasil diimpor untuk level ${level}` }, { status: 201 });
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        console.error("Error importing questions:", error);
        return NextResponse.json({ error: "Gagal mengimpor soal", details }, { status: 500 });
    }
}
