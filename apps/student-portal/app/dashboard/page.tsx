import { headers } from "next/headers";
import { ensureLmsTables, getStudentDashboard } from "@repo/database";
import type { StudentDashboard } from "@repo/database";
import ProgressRing from "../components/ProgressRing";
import CourseCard from "../components/CourseCard";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
    const headersList = await headers();
    const studentName = headersList.get("x-user-name") ?? "Siswa";
    const studentId = Number(headersList.get("x-user-id") ?? "0");

    let dashboard: StudentDashboard = { enrolledCourses: [], overallProgressPercent: 0 };
    try {
        await ensureLmsTables();
        dashboard = await getStudentDashboard(studentId);
    } catch {
        // If tables don't have data yet, show empty state
    }

    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "おはようございます" : hour < 17 ? "こんにちは" : "こんばんは";

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* Welcome Banner */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-base via-primary-70 to-primary-80 text-white p-8">
                <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-white/5" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <p className="text-primary-20 text-sm jp-text mb-1">{greeting}！</p>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                            Selamat datang, <span className="text-tertiary-base">{studentName}</span>！
                        </h1>
                        <p className="text-primary-20 text-sm">
                            Lanjutkan belajar bahasa Jepang hari ini 🎌
                        </p>
                    </div>

                    {/* Overall Progress Ring */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                        <ProgressRing
                            percent={dashboard.overallProgressPercent}
                            size={110}
                            strokeWidth={10}
                            color="rgba(255,255,255,0.9)"
                            sublabel="Progres Keseluruhan"
                        />
                        <p className="text-xs text-primary-20">
                            {dashboard.enrolledCourses.length} kursus terdaftar
                        </p>
                    </div>
                </div>
            </section>

            {/* Course Cards */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-neutral-90">Kursus Saya</h2>
                    {dashboard.enrolledCourses.length > 0 && (
                        <span className="text-xs text-neutral-40">
                            {dashboard.enrolledCourses.filter((c) => c.enrollmentStatus === "completed").length} selesai
                        </span>
                    )}
                </div>

                {dashboard.enrolledCourses.length === 0 ? (
                    <div className="card p-12 flex flex-col items-center text-center text-neutral-40">
                        <svg className="w-16 h-16 mb-4 text-neutral-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                        </svg>
                        <h3 className="text-base font-semibold text-neutral-60 mb-1">Belum ada kursus</h3>
                        <p className="text-sm">
                            Hubungi admin untuk mendaftarkan Anda ke kursus.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {dashboard.enrolledCourses.map((course) => (
                            <CourseCard
                                key={course.id}
                                {...course}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Quick tips */}
            <section className="card-muted p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-tertiary-20 flex items-center justify-center flex-shrink-0">
                    <span className="jp-text text-lg">💡</span>
                </div>
                <div>
                    <p className="text-sm font-semibold text-neutral-80">Tips Belajar</p>
                    <p className="text-xs text-neutral-50">
                        Konsistensi adalah kunci. Belajar 15–30 menit setiap hari lebih efektif daripada belajar lama sekaligus.{" "}
                        <span className="jp-text">毎日少しずつ！</span>
                    </p>
                </div>
            </section>
        </div>
    );
}
