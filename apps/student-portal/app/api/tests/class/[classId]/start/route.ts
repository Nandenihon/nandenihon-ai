import { NextRequest, NextResponse } from "next/server";
import { startAttempt } from "@repo/database";
import { requirePreStudent } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ classId: string }> };

const ERROR_MESSAGES: Record<string, string> = {
    TEST_NOT_AVAILABLE: "Kelas ini belum membuka tes penempatan",
    NOT_ENOUGH_QUESTIONS: "Bank soal untuk level kelas ini belum cukup. Hubungi admin.",
    ALREADY_PASSED: "Kamu sudah lolos salah satu tes. Lanjutkan ke halaman pembayaran.",
    ATTEMPT_IN_PROGRESS: "Kamu masih memiliki tes lain yang sedang berjalan",
    RETAKE_COOLDOWN: "Kamu baru saja gagal tes ini. Coba lagi setelah 24 jam, atau pilih kelas lain.",
};

export async function POST(request: NextRequest, context: Context) {
    const session = await requirePreStudent(request);
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const classId = Number((await context.params).classId);
    try {
        const attemptId = await startAttempt(session.id, classId);
        return NextResponse.json({ attemptId });
    } catch (error) {
        const code = error instanceof Error ? error.message : "";
        return NextResponse.json({ error: ERROR_MESSAGES[code] || "Tidak dapat memulai tes" }, { status: 409 });
    }
}
