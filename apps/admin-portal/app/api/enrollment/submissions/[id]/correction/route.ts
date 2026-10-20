import { NextRequest, NextResponse } from "next/server";
import { findSubmissionForReview, saveSubmissionCorrection } from "@repo/database";
import { fetchR2Object, uploadFileToR2 } from "@repo/utils/r2-upload";
import { CLASS_MANAGER_ROLES, canReviewClassWork, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

// Corrected PDFs embed a full-page annotation image per page, so allow more room than student uploads.
const MAX_CORRECTION_SIZE = Number(process.env.CORRECTION_PDF_MAX_BYTES || 25 * 1024 * 1024);
type Context = { params: Promise<{ id: string }> };

async function loadReviewableSubmission(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return { error: NextResponse.json({ error: "Akses ditolak" }, { status: 403 }) };
    const item = await findSubmissionForReview(Number((await context.params).id));
    if (!item) return { error: NextResponse.json({ error: "Submission tidak ditemukan" }, { status: 404 }) };
    if (!await canReviewClassWork(actor, Number(item.class_id))) return { error: NextResponse.json({ error: "Akses ditolak" }, { status: 403 }) };
    return { actor, item };
}

async function streamPdf(fileKey: string, filename: string, source: "correction" | "original") {
    const object = await fetchR2Object(fileKey);
    if (!object?.body) return NextResponse.json({ error: "File tidak ditemukan di storage" }, { status: 404 });
    return new NextResponse(object.body, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${filename.replaceAll('"', "")}"`,
            "Cache-Control": "private, no-store",
            "X-Pdf-Source": source,
        },
    });
}

/**
 * GET /api/enrollment/submissions/:id/correction — the corrected PDF.
 * With ?fallback=original it returns the student's original file when no correction exists yet,
 * so the correction screen can start loading the PDF without waiting for the submission details.
 */
export async function GET(request: NextRequest, context: Context) {
    const result = await loadReviewableSubmission(request, context);
    if (result.error) return result.error;
    const { item } = result;
    if (item.correction_file_key) {
        return streamPdf(String(item.correction_file_key), `koreksi-${item.original_filename}`, "correction");
    }
    if (request.nextUrl.searchParams.get("fallback") === "original") {
        return streamPdf(String(item.file_key), String(item.original_filename), "original");
    }
    return NextResponse.json({ error: "Belum ada koreksi" }, { status: 404 });
}

/** POST /api/enrollment/submissions/:id/correction — multipart "file": the annotated (or teacher-uploaded) PDF. */
export async function POST(request: NextRequest, context: Context) {
    const result = await loadReviewableSubmission(request, context);
    if (result.error) return result.error;
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Pilih file PDF koreksi" }, { status: 400 });
    if (file.size > MAX_CORRECTION_SIZE) {
        return NextResponse.json({ error: `Ukuran PDF koreksi maksimal ${Math.round(MAX_CORRECTION_SIZE / 1024 / 1024)} MB` }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") return NextResponse.json({ error: "File koreksi harus berupa PDF" }, { status: 400 });
    try {
        const submissionId = Number(result.item.id);
        const upload = await uploadFileToR2({
            buffer, contentType: "application/pdf", folder: "assignment-corrections",
            originalFilename: `koreksi-${result.item.original_filename}`, filenamePrefix: `${submissionId}-koreksi`,
            cacheControl: "private, no-store",
        });
        await saveSubmissionCorrection({ submissionId, fileKey: upload.key, actorId: result.actor.id });
        return NextResponse.json({ message: "Koreksi berhasil disimpan" }, { status: 201 });
    } catch (error) {
        console.error("Saving submission correction failed:", error);
        return NextResponse.json({ error: "Gagal menyimpan koreksi" }, { status: 500 });
    }
}
