import { NextRequest, NextResponse } from "next/server";
import { transferStudentToClass } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

    const studentId = Number((await context.params).id);
    if (!studentId) return NextResponse.json({ error: "ID siswa tidak valid" }, { status: 400 });

    try {
        const body = await request.json();
        const classId = Number(body.classId);
        if (!classId) return NextResponse.json({ error: "Kelas tujuan wajib dipilih" }, { status: 400 });

        const data = await transferStudentToClass(studentId, classId, actor.id);
        return NextResponse.json({ data });
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const errors: Record<string, string> = {
            STUDENT_NOT_FOUND: "Siswa tidak ditemukan atau belum memiliki akun aktif",
            CLASS_NOT_FOUND: "Kelas tujuan tidak ditemukan",
            CLASS_FULL: "Kelas tujuan sudah penuh",
        };
        if (errors[message]) return NextResponse.json({ error: errors[message] }, { status: 409 });
        console.error("Transfer student error:", error);
        return NextResponse.json({ error: "Gagal memindahkan siswa" }, { status: 500 });
    }
}
