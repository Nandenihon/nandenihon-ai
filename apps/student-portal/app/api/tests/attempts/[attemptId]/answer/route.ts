import { NextRequest, NextResponse } from "next/server";
import { recordAnswer } from "@repo/database";
import { requirePreStudent } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ attemptId: string }> };

export async function POST(request: NextRequest, context: Context) {
    const session = await requirePreStudent(request);
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const attemptId = Number((await context.params).attemptId);
    const body = await request.json();
    const questionId = Number(body.questionId);
    const selectedValue = body.selectedValue ? String(body.selectedValue) : null;
    if (!questionId) return NextResponse.json({ error: "questionId wajib diisi" }, { status: 400 });

    try {
        // Correctness is intentionally not echoed back — it would leak the
        // right answer mid-attempt. Score/pass status are revealed on finish.
        await recordAnswer({ attemptId, userId: session.id, questionId, selectedValue });
        return NextResponse.json({ saved: true });
    } catch {
        return NextResponse.json({ error: "Tidak dapat menyimpan jawaban" }, { status: 409 });
    }
}
