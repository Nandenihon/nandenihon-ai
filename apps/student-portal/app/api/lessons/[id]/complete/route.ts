import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";
import { ensureLmsTables, markLessonComplete } from "@repo/database";

export const runtime = "nodejs";

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
        await ensureLmsTables();
        await markLessonComplete(session.id, lessonId);
        return NextResponse.json({ message: "Pelajaran ditandai selesai" });
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: "Gagal menyimpan progres", details: msg }, { status: 500 });
    }
}
