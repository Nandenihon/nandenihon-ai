import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";
import { ensureLmsTables, findLessonsByCourse, findProgressByStudentAndCourse } from "@repo/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const courseId = parseInt(id, 10);
    if (isNaN(courseId)) return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });

    try {
        await ensureLmsTables();
        const [lessons, progress] = await Promise.all([
            findLessonsByCourse(courseId),
            findProgressByStudentAndCourse(session.id, courseId),
        ]);

        const progressMap = new Map(progress.map((p) => [p.lessonId, p.isCompleted]));

        const lessonsWithProgress = lessons.map((l) => ({
            ...l,
            isCompleted: progressMap.get(l.id) ?? false,
        }));

        return NextResponse.json({ lessons: lessonsWithProgress });
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: "Gagal memuat pelajaran", details: msg }, { status: 500 });
    }
}
