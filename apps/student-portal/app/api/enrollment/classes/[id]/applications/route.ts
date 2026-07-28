import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { submitApplication } from "@repo/database";
import { requireCandidate } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
    const candidate = await requireCandidate(request);
    if (!candidate) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const classId = Number((await context.params).id);
    try {
        const body = await request.json().catch(() => ({}));
        const applicationId = await submitApplication(
            classId,
            candidate.preStudentId,
            body.documents ?? [],
            request.headers.get("x-request-id") || crypto.randomUUID()
        );
        return NextResponse.json({ message: "Aplikasi berhasil dikirim", applicationId }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message === "ACTIVE_APPLICATION_EXISTS") return NextResponse.json({ error: "Anda sudah memiliki aplikasi aktif untuk kelas ini" }, { status: 409 });
        if (message === "CLASS_NOT_OPEN") return NextResponse.json({ error: "Enrollment kelas sudah ditutup atau kuota penuh" }, { status: 409 });
        console.error("Submit class application error:", error);
        return NextResponse.json({ error: "Gagal mengirim aplikasi" }, { status: 500 });
    }
}
