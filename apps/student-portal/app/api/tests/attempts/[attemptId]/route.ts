import { NextRequest, NextResponse } from "next/server";
import { findAttemptWithQuestions } from "@repo/database";
import { requirePreStudent } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ attemptId: string }> };

export async function GET(request: NextRequest, context: Context) {
    const session = await requirePreStudent(request);
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const attemptId = Number((await context.params).attemptId);
    const result = await findAttemptWithQuestions(attemptId, session.id);
    if (!result) return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ data: result });
}
