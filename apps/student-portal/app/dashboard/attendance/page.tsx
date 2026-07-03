import { headers } from "next/headers";
import { getAttendanceSummary, getStudentDashboardSafe } from "../dashboard-data";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
    const headersList = await headers();
    const studentId = Number(headersList.get("x-user-id") ?? "0");
    const dashboard = await getStudentDashboardSafe(studentId);
    const summary = getAttendanceSummary(dashboard);

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-40">Absensi</p>
                <h1 className="text-2xl font-bold text-neutral-90">Summary Absensi</h1>
            </div>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                {[
                    ["Kehadiran", `${summary.percent}%`, `${summary.present}/${summary.total} sesi selesai`],
                    ["Hadir", String(summary.present), "Sesi yang sudah diselesaikan"],
                    ["Tidak Hadir", String(summary.absent), "Belum ada data ketidakhadiran"],
                    ["Tersisa", String(summary.remaining), "Sesi yang belum selesai"],
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
                    <h2 className="text-sm font-bold text-neutral-90">Absensi per Kursus</h2>
                </div>
                <div className="divide-y divide-neutral-10">
                    {dashboard.enrolledCourses.length === 0 ? (
                        <p className="px-5 py-10 text-center text-sm text-neutral-50">Belum ada data absensi.</p>
                    ) : (
                        dashboard.enrolledCourses.map((course) => (
                            <div key={course.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
                                <div>
                                    <p className="text-sm font-semibold text-neutral-80">{course.title}</p>
                                    <p className="text-xs text-neutral-50">{course.level} · {course.completedLessons}/{course.totalLessons} sesi</p>
                                </div>
                                <div className="min-w-48">
                                    <div className="mb-1 flex justify-between text-xs text-neutral-50">
                                        <span>Progress hadir</span>
                                        <span className="font-semibold text-primary-base">{course.progressPercent}%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-neutral-10">
                                        <div className="h-full rounded-full bg-primary-base" style={{ width: `${course.progressPercent}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
