import { NextRequest, NextResponse } from "next/server";
import { updateStudentStatus, type StudentStatus } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

const VALID_STATUSES = new Set<StudentStatus>(["active", "inactive"]);

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

    const studentId = Number((await context.params).id);
    if (!studentId) return NextResponse.json({ error: "ID siswa tidak valid" }, { status: 400 });

    try {
        const body = await request.json();
        const status = String(body.status ?? "") as StudentStatus;
        if (!VALID_STATUSES.has(status)) return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });

        const data = await updateStudentStatus(studentId, status, actor.id);
        return NextResponse.json({ data });
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message === "STUDENT_NOT_FOUND") return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
        console.error("Update student status error:", error);
        return NextResponse.json({ error: "Gagal memperbarui status siswa" }, { status: 500 });
    }
}
