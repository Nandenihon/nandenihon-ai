import { NextRequest, NextResponse } from "next/server";
import { isAttendanceStatus, listClassAttendance, saveClassAttendance } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";
import { canManageAttendance, validateAttendanceDate } from "@/app/lib/attendance";

const SAVE_ERRORS: Record<string, [string, number]> = {
    CLASS_NOT_FOUND: ["Kelas tidak ditemukan", 404],
    CLASS_NOT_RECORDABLE: ["Absensi hanya bisa diisi untuk kelas yang dipublikasikan atau ditutup", 409],
    NOT_CLASS_MEMBER: ["Ada siswa yang bukan anggota aktif kelas ini. Muat ulang daftar siswa.", 409],
};

/**
 * GET /api/attendance?classId=&date=YYYY-MM-DD
 * Active members of an enrollment class with their attendance on that date.
 */
export async function GET(request: NextRequest) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

    const classId = Number(request.nextUrl.searchParams.get("classId"));
    const date = String(request.nextUrl.searchParams.get("date") ?? "");
    if (!Number.isInteger(classId) || classId < 1) return NextResponse.json({ error: "Pilih kelas terlebih dahulu" }, { status: 400 });
    const dateError = validateAttendanceDate(date);
    if (dateError) return NextResponse.json({ error: dateError }, { status: 400 });
    if (!await canManageAttendance(actor, classId)) return NextResponse.json({ error: "Anda bukan pengajar kelas ini" }, { status: 403 });

    try {
        const rows = await listClassAttendance(classId, date);
        return NextResponse.json({
            data: rows.map((row) => ({
                userId: Number(row.user_id),
                name: String(row.student_name),
                email: String(row.email),
                status: row.status ?? null,
                notes: row.notes ?? "",
                recordedBy: row.recorded_by_name ?? null,
            })),
        });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return NextResponse.json({ error: "Gagal mengambil data absensi" }, { status: 500 });
    }
}

/**
 * POST /api/attendance
 * Body: { classId, date, attendance: [{ userId, status, notes }] }
 */
export async function POST(request: NextRequest) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

    const body = await request.json().catch(() => null);
    const classId = Number(body?.classId);
    const date = String(body?.date ?? "");
    if (!Number.isInteger(classId) || classId < 1 || !Array.isArray(body?.attendance)) {
        return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 });
    }
    const dateError = validateAttendanceDate(date);
    if (dateError) return NextResponse.json({ error: dateError }, { status: 400 });

    const entries: { userId: number; status: "present" | "late" | "excused" | "absent"; notes: string }[] = [];
    for (const item of body.attendance) {
        const userId = Number(item?.userId);
        if (!Number.isInteger(userId) || userId < 1 || !isAttendanceStatus(item?.status)) {
            return NextResponse.json({ error: "Status kehadiran tidak valid" }, { status: 400 });
        }
        entries.push({ userId, status: item.status, notes: String(item.notes ?? "").slice(0, 500) });
    }
    if (entries.length === 0) return NextResponse.json({ error: "Belum ada kehadiran yang diisi" }, { status: 400 });
    if (!await canManageAttendance(actor, classId)) return NextResponse.json({ error: "Anda bukan pengajar kelas ini" }, { status: 403 });

    try {
        const result = await saveClassAttendance({ classId, date, recordedBy: actor.id, entries });
        return NextResponse.json({ message: `Absensi ${result.saved} siswa berhasil disimpan` });
    } catch (error) {
        const mapped = SAVE_ERRORS[error instanceof Error ? error.message : ""];
        if (mapped) return NextResponse.json({ error: mapped[0] }, { status: mapped[1] });
        console.error("Error saving attendance:", error);
        return NextResponse.json({ error: "Gagal menyimpan absensi" }, { status: 500 });
    }
}
