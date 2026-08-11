import { NextRequest, NextResponse } from "next/server";
import { rejectPayment, verifyPayment } from "@repo/database";
import { REVIEWER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, REVIEWER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const paymentId = Number((await context.params).id);
    const body = await request.json();
    const action = String(body.action ?? "");

    try {
        if (action === "verify") {
            const data = await verifyPayment(paymentId, actor.id);
            return NextResponse.json({ message: "Pembayaran diverifikasi, siswa diaktifkan", data });
        }
        if (action === "reject") {
            await rejectPayment(paymentId, actor.id, String(body.reason ?? ""));
            return NextResponse.json({ message: "Pembayaran ditolak" });
        }
        return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const errors: Record<string, [string, number]> = {
            CLASS_FULL: ["Kelas sudah penuh", 409],
            CLASS_NOT_FOUND: ["Kelas tidak ditemukan", 404],
            PAYMENT_NOT_FOUND: ["Pembayaran tidak ditemukan", 404],
            REJECTION_REASON_REQUIRED: ["Alasan penolakan wajib diisi", 400],
            INVALID_PAYMENT_TRANSITION: ["Status pembayaran tidak dapat diubah", 409],
        };
        const mapped = errors[message];
        if (mapped) return NextResponse.json({ error: mapped[0] }, { status: mapped[1] });
        console.error("Payment decision error:", error);
        return NextResponse.json({ error: "Gagal memproses pembayaran" }, { status: 500 });
    }
}
