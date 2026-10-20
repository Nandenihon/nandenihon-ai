import { headers } from "next/headers";
import { getAttendanceSummary, getStudentAttendanceSafe } from "../dashboard-data";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    present: { label: "Hadir", className: "bg-success-10 text-success-100" },
    late: { label: "Terlambat", className: "bg-warning-10 text-warning-100" },
    excused: { label: "Izin", className: "bg-info-10 text-info-base" },
    absent: { label: "Tidak hadir", className: "bg-error-10 text-error-base" },
};

function formatDate(date: string) {
    return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" })
        .format(new Date(`${date}T00:00:00+07:00`));
}

export default async function AttendancePage() {
    const headersList = await headers();
    const studentId = Number(headersList.get("x-user-id") ?? "0");
    const attendance = await getStudentAttendanceSafe(studentId);
    const summary = getAttendanceSummary(attendance);

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-base">Perkembangan</p>
                <h1 className="text-2xl font-bold text-neutral-90">Ringkasan Kehadiran</h1>
                <p className="mt-1 text-sm text-neutral-50">Kehadiran yang dicatat pengajar di setiap pertemuan kelas.</p>
            </div>

            <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                    ["Kehadiran", summary.total ? `${summary.percent}%` : "–", summary.total ? `${summary.attended} dari ${summary.total} pertemuan` : "Belum ada pertemuan tercatat"],
                    ["Hadir", String(summary.attended), summary.late ? `Termasuk ${summary.late} kali terlambat` : "Tepat waktu"],
                    ["Izin", String(summary.excused), "Ketidakhadiran dengan izin"],
                    ["Tidak Hadir", String(summary.absent), "Tanpa keterangan"],
                ].map(([label, value, detail]) => (
                    <div key={label} className="card p-5">
                        <p className="text-3xl font-bold text-primary-base">{value}</p>
                        <p className="mt-3 text-sm font-semibold text-neutral-80">{label}</p>
                        <p className="mt-1 text-xs text-neutral-50">{detail}</p>
                    </div>
                ))}
            </section>

            <section className="card overflow-hidden">
                <div className="border-b border-neutral-10 px-5 py-4">
                    <h2 className="text-sm font-bold text-neutral-90">Absensi per Kelas</h2>
                </div>
                <div className="divide-y divide-neutral-10">
                    {attendance.classes.length === 0 ? (
                        <p className="px-5 py-10 text-center text-sm text-neutral-50">Kamu belum terdaftar di kelas mana pun.</p>
                    ) : (
                        attendance.classes.map((item) => {
                            const attended = item.present + item.late;
                            const percent = item.total ? Math.round((attended / item.total) * 100) : 0;
                            return (
                                <div key={item.classId} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-neutral-80">{item.name}</p>
                                        <p className="text-xs text-neutral-50">
                                            {item.code} · {item.level}
                                            {item.total ? ` · Hadir ${item.present}, terlambat ${item.late}, izin ${item.excused}, tidak hadir ${item.absent}` : " · Belum ada pertemuan tercatat"}
                                        </p>
                                        {item.schedule && <p className="mt-0.5 text-xs text-neutral-40">Jadwal: {item.schedule}</p>}
                                    </div>
                                    <div className="min-w-48">
                                        <div className="mb-1 flex justify-between text-xs text-neutral-50">
                                            <span>{attended}/{item.total} pertemuan</span>
                                            <span className="font-semibold text-primary-base">{item.total ? `${percent}%` : "–"}</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-neutral-10">
                                            <div className="h-full rounded-full bg-primary-base" style={{ width: `${percent}%` }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            <section className="card overflow-hidden">
                <div className="border-b border-neutral-10 px-5 py-4">
                    <h2 className="text-sm font-bold text-neutral-90">Riwayat Pertemuan Terbaru</h2>
                </div>
                <div className="divide-y divide-neutral-10">
                    {attendance.recent.length === 0 ? (
                        <p className="px-5 py-10 text-center text-sm text-neutral-50">Belum ada absensi yang dicatat pengajar.</p>
                    ) : (
                        attendance.recent.map((record) => {
                            const status = STATUS_LABELS[record.status] ?? { label: record.status, className: "bg-neutral-10 text-neutral-60" };
                            return (
                                <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-neutral-80">{formatDate(record.date)}</p>
                                        <p className="text-xs text-neutral-50">
                                            {record.className}
                                            {record.notes && ` · ${record.notes}`}
                                        </p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>
        </div>
    );
}
