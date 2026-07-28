import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { acceptApplication, rejectApplication, reviewApplication } from "@repo/database";
import { REVIEWER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, REVIEWER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const applicationId = Number((await context.params).id);
    const body = await request.json();
    const action = String(body.action ?? "");
    const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
    try {
        if (action === "review") {
            await reviewApplication(applicationId, actor.id);
            return NextResponse.json({ message: "Aplikasi sedang direview" });
        }
        if (action === "reject") {
            await rejectApplication(applicationId, actor.id, String(body.reason ?? ""));
            return NextResponse.json({ message: "Aplikasi ditolak" });
        }
        if (action === "accept") {
            const key = request.headers.get("idempotency-key");
            if (!key) return NextResponse.json({ error: "Idempotency-Key wajib dikirim" }, { status: 400 });
            const data = await acceptApplication(applicationId, actor.id, key, requestId);
            return NextResponse.json({ message: "Aplikasi diterima", data });
        }
        return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const errors: Record<string, [string, number]> = {
            CLASS_FULL: ["Kelas sudah penuh", 409],
            CLASS_NOT_AVAILABLE: ["Kelas tidak tersedia", 409],
            REJECTION_REASON_REQUIRED: ["Alasan penolakan wajib diisi", 400],
            INVALID_APPLICATION_TRANSITION: ["Status aplikasi tidak dapat diubah", 409],
            APPLICATION_NOT_FOUND: ["Aplikasi tidak ditemukan", 404],
        };
        const mapped = errors[message];
        if (mapped) return NextResponse.json({ error: mapped[0] }, { status: mapped[1] });
        console.error("Application decision error:", error);
        return NextResponse.json({ error: "Gagal memproses keputusan" }, { status: 500 });
    }
}
