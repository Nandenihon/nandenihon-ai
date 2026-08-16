import { NextRequest, NextResponse } from "next/server";
import { createPayment, findMyPayments, findPassedAttemptWithoutPayment } from "@repo/database";
import { uploadFileToR2 } from "@repo/utils/r2-upload";
import { requirePreStudent } from "@/app/lib/enrollment-auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const PAYMENT_AMOUNT = 50000;

export async function GET(request: NextRequest) {
    const session = await requirePreStudent(request);
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const [passedAttempt, payments] = await Promise.all([
        findPassedAttemptWithoutPayment(session.id),
        findMyPayments(session.id),
    ]);
    return NextResponse.json({ passedAttempt, payments });
}

export async function POST(request: NextRequest) {
    const session = await requirePreStudent(request);
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

    const formData = await request.formData();
    const attemptId = Number(formData.get("attemptId"));
    const file = formData.get("file");

    if (!attemptId) return NextResponse.json({ error: "attemptId wajib diisi" }, { status: 400 });
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Pilih bukti pembayaran terlebih dahulu" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Format harus JPG, PNG, WebP, atau PDF" }, { status: 400 });

    try {
        const upload = await uploadFileToR2({
            buffer: Buffer.from(await file.arrayBuffer()),
            contentType: file.type,
            folder: `test-payment-${session.id}`,
            originalFilename: file.name,
        });
        const paymentId = await createPayment({ attemptId, userId: session.id, amount: PAYMENT_AMOUNT, proofUrl: upload.pathname });
        return NextResponse.json({ paymentId, message: "Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin." }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const errors: Record<string, string> = {
            ATTEMPT_NOT_PASSED: "Attempt ini belum lolos tes",
            PAYMENT_ALREADY_EXISTS: "Pembayaran untuk attempt ini sudah diajukan",
        };
        if (!errors[message]) console.error("Upload payment proof error:", error);
        return NextResponse.json({ error: errors[message] || "Gagal mengunggah bukti pembayaran" }, { status: 400 });
    }
}
