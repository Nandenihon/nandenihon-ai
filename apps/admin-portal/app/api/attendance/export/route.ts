import { NextRequest, NextResponse } from "next/server";
import { getClassAttendanceExport, type AttendanceStatus } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";
import { canManageAttendance, csvResponse } from "@/app/lib/attendance";

const MAX_RANGE_DAYS = 366;
const STATUS_CODES: Record<AttendanceStatus, string> = { present: "H", late: "T", excused: "I", absent: "A" };
const STATUS_LABELS: Record<AttendanceStatus, string> = { present: "Hadir", late: "Terlambat", excused: "Izin", absent: "Tidak hadir" };

function isIsoDate(value: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

/** "2026-10-20" -> "20/10/2026" */
function displayDate(value: string) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
}

function displayDateTime(value: Date) {
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

function safeFilenamePart(value: string) {
    return value.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "kelas";
}

/**
 * GET /api/attendance/export?classId=&from=YYYY-MM-DD&to=YYYY-MM-DD&format=rekap|detail
 * rekap:  one row per student, one column per meeting date (H/T/I/A) plus totals and attendance rate.
 * detail: one row per recorded meeting per student, for further processing in a spreadsheet.
 */
export async function GET(request: NextRequest) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

    const params = request.nextUrl.searchParams;
    const classId = Number(params.get("classId"));
    const from = String(params.get("from") ?? "");
    const to = String(params.get("to") ?? "");
    const format = params.get("format") === "detail" ? "detail" : "rekap";

    if (!Number.isInteger(classId) || classId < 1) return NextResponse.json({ error: "Pilih kelas terlebih dahulu" }, { status: 400 });
    if (!isIsoDate(from) || !isIsoDate(to)) return NextResponse.json({ error: "Format tanggal tidak valid" }, { status: 400 });
    if (from > to) return NextResponse.json({ error: "Tanggal awal harus sebelum tanggal akhir" }, { status: 400 });
    const rangeDays = (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000;
    if (rangeDays > MAX_RANGE_DAYS) return NextResponse.json({ error: "Rentang tanggal maksimal 1 tahun" }, { status: 400 });
    if (!await canManageAttendance(actor, classId)) return NextResponse.json({ error: "Anda bukan pengajar kelas ini" }, { status: 403 });

    try {
        const data = await getClassAttendanceExport(classId, from, to);
        if (!data) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
        const { classInfo, students, records } = data;
        const filename = `absensi-${format}-${safeFilenamePart(classInfo.code)}-${from}_${to}.csv`;

        if (format === "detail") {
            const nameById = new Map(students.map((s) => [s.userId, s]));
            const rows: unknown[][] = [["Tanggal", "Kode Kelas", "Nama Kelas", "Nama Siswa", "Email", "Status", "Keterangan", "Dicatat oleh", "Terakhir diubah"]];
            for (const record of records) {
                const student = nameById.get(record.userId);
                rows.push([
                    displayDate(record.date), classInfo.code, classInfo.name, student?.name ?? "", student?.email ?? "",
                    STATUS_LABELS[record.status] ?? record.status, record.notes, record.recordedBy, displayDateTime(record.updatedAt),
                ]);
            }
            return csvResponse(rows, filename);
        }

        const dates = [...new Set(records.map((r) => r.date))].sort();
        const statusByStudentDate = new Map(records.map((r) => [`${r.userId}|${r.date}`, r.status]));
        const rows: unknown[][] = [
            ["Rekap Absensi"],
            ["Kelas", `${classInfo.code} - ${classInfo.name} (${classInfo.level})`],
            ["Periode", `${displayDate(from)} s.d. ${displayDate(to)}`],
            ["Keterangan", "H = Hadir, T = Terlambat, I = Izin, A = Tidak hadir, kosong = belum diisi"],
            ["Kehadiran", "(Hadir + Terlambat) / pertemuan yang tercatat"],
            [],
            ["No", "Nama Siswa", "Email", ...dates.map(displayDate), "Hadir", "Terlambat", "Izin", "Tidak hadir", "Pertemuan tercatat", "Kehadiran"],
        ];
        students.forEach((student, index) => {
            const counts: Record<AttendanceStatus, number> = { present: 0, late: 0, excused: 0, absent: 0 };
            const cells = dates.map((date) => {
                const status = statusByStudentDate.get(`${student.userId}|${date}`);
                if (!status) return "";
                counts[status] += 1;
                return STATUS_CODES[status];
            });
            const recorded = counts.present + counts.late + counts.excused + counts.absent;
            const rate = recorded ? `${Math.round(((counts.present + counts.late) / recorded) * 100)}%` : "";
            rows.push([index + 1, student.name, student.email, ...cells, counts.present, counts.late, counts.excused, counts.absent, recorded, rate]);
        });
        if (students.length === 0) rows.push(["", "Belum ada siswa di kelas ini"]);
        return csvResponse(rows, filename);
    } catch (error) {
        console.error("Error exporting attendance:", error);
        return NextResponse.json({ error: "Gagal mengunduh absensi" }, { status: 500 });
    }
}
