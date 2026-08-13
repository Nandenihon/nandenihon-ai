import { NextRequest, NextResponse } from "next/server";
import { listAttemptsForUser } from "@repo/database";
import { requirePreStudent } from "@/app/lib/enrollment-auth";

export async function GET(request: NextRequest) {
    const session = await requirePreStudent(request);
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    return NextResponse.json({ data: await listAttemptsForUser(session.id) });
}
