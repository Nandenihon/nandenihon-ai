import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";
import { ensureLmsTables, submitQuizGrade, findLatestQuizGrade } from "@repo/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET  /api/lessons/[id]/quiz — fetch latest grade for this quiz lesson
 * POST /api/lessons/[id]/quiz — submit a new quiz score
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || session.role !== "student") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const lessonId = parseInt(id, 10);
    if (isNaN(lessonId)) return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });

    try {
        await ensureLmsTables();
        const grade = await findLatestQuizGrade(session.id, lessonId);
        return NextResponse.json({ grade });
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: "Gagal memuat nilai", details: msg }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || session.role !== "student") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const lessonId = parseInt(id, 10);
    if (isNaN(lessonId)) return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });

    try {
        const body = await request.json();
        const score = Number(body.score ?? 0);
        if (score < 0 || score > 100) {
            return NextResponse.json({ error: "Score harus antara 0–100" }, { status: 400 });
        }

        await ensureLmsTables();
        const grade = await submitQuizGrade(session.id, lessonId, score);
        return NextResponse.json({ grade, message: "Nilai berhasil disimpan" });
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: "Gagal menyimpan nilai", details: msg }, { status: 500 });
    }
}
