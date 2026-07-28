import { NextRequest, NextResponse } from "next/server";
import { withdrawApplication } from "@repo/database";
import { requireCandidate } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
    const candidate = await requireCandidate(request);
    if (!candidate) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    try {
        await withdrawApplication(Number((await context.params).id), candidate.preStudentId);
        return NextResponse.json({ message: "Aplikasi berhasil ditarik" });
    } catch {
        return NextResponse.json({ error: "Aplikasi tidak dapat ditarik" }, { status: 409 });
    }
}
