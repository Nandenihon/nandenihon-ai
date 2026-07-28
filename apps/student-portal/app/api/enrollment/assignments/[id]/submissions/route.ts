import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { recordSubmission } from "@repo/database";
import { uploadFileToR2 } from "@repo/utils/r2-upload";
import { COOKIE_NAME, verifyToken } from "@/app/lib/auth";

const MAX_PDF_SIZE = Number(process.env.ASSIGNMENT_PDF_MAX_BYTES || 10 * 1024 * 1024);
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifyToken(token) : null;
    if (!session || session.role !== "student" || session.id < 1) return NextResponse.json({ error: "Membership student diperlukan" }, { status: 403 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Pilih file PDF" }, { status: 400 });
    if (file.size > MAX_PDF_SIZE) return NextResponse.json({ error: `Ukuran PDF maksimal ${Math.round(MAX_PDF_SIZE / 1024 / 1024)} MB` }, { status: 400 });
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "File harus berformat PDF" }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") return NextResponse.json({ error: "Isi file bukan PDF yang valid" }, { status: 400 });
    try {
        const assignmentId = Number((await context.params).id);
        const upload = await uploadFileToR2({
            buffer, contentType: "application/pdf", folder: "assignment-submissions",
            originalFilename: file.name, filenamePrefix: `${assignmentId}-${session.id}`,
            cacheControl: "private, no-store",
        });
        const data = await recordSubmission({
            assignmentId, studentId: session.id, fileKey: upload.key, originalFilename: file.name,
            mimeType: file.type, size: file.size, checksum: crypto.createHash("sha256").update(buffer).digest("hex"),
        });
        return NextResponse.json({ message: "Tugas berhasil dikumpulkan", data }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const mapped: Record<string, string> = {
            ASSIGNMENT_NOT_OPEN: "Tugas sudah ditutup", NOT_CLASS_MEMBER: "Anda bukan anggota aktif kelas ini",
            RESUBMISSION_DISABLED: "Pengumpulan ulang tidak diizinkan",
        };
        return NextResponse.json({ error: mapped[message] || "Gagal mengunggah tugas" }, { status: 409 });
    }
}
