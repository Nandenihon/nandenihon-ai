import { NextRequest, NextResponse } from "next/server";
import { findSubmissionForReview } from "@repo/database";
import { CLASS_MANAGER_ROLES, canReviewClassWork, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string }> };

/** GET /api/enrollment/submissions/:id — submission details for the correction screen. */
export async function GET(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const item = await findSubmissionForReview(Number((await context.params).id));
    if (!item) return NextResponse.json({ error: "Submission tidak ditemukan" }, { status: 404 });
    if (!await canReviewClassWork(actor, Number(item.class_id))) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    return NextResponse.json({
        data: {
            id: Number(item.id),
            assignmentId: Number(item.assignment_id),
            assignmentTitle: String(item.assignment_title),
            classCode: String(item.class_code),
            studentName: item.student_name ? String(item.student_name) : "Siswa",
            version: Number(item.version),
            originalFilename: String(item.original_filename),
            submittedAt: item.submitted_at,
            status: String(item.status),
            maxScore: Number(item.max_score),
            score: item.score === null ? null : Number(item.score),
            feedback: item.feedback ?? "",
            hasCorrection: Boolean(item.correction_file_key),
            correctionUploadedAt: item.correction_uploaded_at ?? null,
        },
    });
}
