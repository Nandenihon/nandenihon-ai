import { NextRequest, NextResponse } from "next/server";
import { finishAttempt } from "@repo/database";
import { requirePreStudent } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ attemptId: string }> };

export async function POST(request: NextRequest, context: Context) {
    const session = await requirePreStudent(request);
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const attemptId = Number((await context.params).attemptId);
    try {
        const result = await finishAttempt(attemptId, session.id);
        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ error: "Tidak dapat menyelesaikan tes" }, { status: 409 });
    }
}
