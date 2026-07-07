import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";
import {
    findLatestDailyQuizAttempt,
    findTodayDailyQuizAttempt,
    submitDailyQuizAttempt,
} from "@repo/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseQuestionIds(value: unknown): number[] {
    if (!Array.isArray(value)) return [];
    return value.map((id) => Number(id));
}

function parseSelectedAnswers(value: unknown): (number | null)[] {
    if (!Array.isArray(value)) return [];
    return value.map((answer) => (answer === null ? null : Number(answer)));
}

function parseResponseTimes(value: unknown): number[] {
    if (!Array.isArray(value)) return [];
    return value.map((time) => Number(time));
}

async function getStudentSession(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await verifyToken(token);
    return session?.role === "student" ? session : null;
}

export async function GET(request: NextRequest) {
    const session = await getStudentSession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const [todayAttempt, latestAttempt] = await Promise.all([
            findTodayDailyQuizAttempt(session.id),
            findLatestDailyQuizAttempt(session.id),
        ]);

        return NextResponse.json({
            attempt: latestAttempt,
            todayAttempt,
            completedToday: Boolean(todayAttempt),
        });
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Gagal memuat daily quiz", details },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const session = await getStudentSession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const questionIds = parseQuestionIds(body.questionIds);
        const selectedAnswers = parseSelectedAnswers(body.selectedAnswers);
        const responseTimes = parseResponseTimes(body.responseTimes);

        const attempt = await submitDailyQuizAttempt({
            studentId: session.id,
            questionIds,
            selectedAnswers,
            responseTimes,
        });

        return NextResponse.json({
            attempt,
            message: "Nilai daily quiz berhasil disimpan",
        });
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        const status = details.includes("Kamu sudah menyelesaikan tantangan hari ini") ? 409 : 400;
        return NextResponse.json(
            { error: "Gagal menyimpan nilai daily quiz", details },
            { status }
        );
    }
}
