import { NextRequest, NextResponse } from "next/server";
import { findAssignment, gradeSubmission, queryMySQL, teacherCanManageClass, type RowDataPacket } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string }> };
export async function PUT(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const submissionId = Number((await context.params).id);
    const rows = await queryMySQL<RowDataPacket[]>("SELECT assignment_id FROM submissions WHERE id = ? LIMIT 1", [submissionId]);
    const assignment = rows[0] ? await findAssignment(Number(rows[0].assignment_id)) : null;
    if (!assignment) return NextResponse.json({ error: "Submission tidak ditemukan" }, { status: 404 });
    if (!await teacherCanManageClass(actor.id, Number(assignment.class_id)) && !["super_admin", "admin"].includes(actor.role)) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }
    const body = await request.json();
    try {
        return NextResponse.json({ data: await gradeSubmission({
            submissionId, score: Number(body.score), feedback: String(body.feedback ?? "").trim(), gradedBy: actor.id,
        }) });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error && error.message === "INVALID_SCORE" ? "Nilai di luar rentang" : "Gagal menyimpan nilai" }, { status: 400 });
    }
}
