import { headers } from "next/headers";
import type { StudentDashboard } from "@repo/database";
import ProgressRing from "../components/ProgressRing";
import CourseCard from "../components/CourseCard";
import {
    getAttendanceSummary,
    getDailyQuizLeaderboard,
    getSchedulePreview,
    getStudentDashboardSafe,
    getStudentGrades,
} from "./dashboard-data";

export const dynamic = "force-dynamic";

function StatCard({
    label,
    value,
    detail,
    tone = "primary",
}: {
    label: string;
    value: string;
    detail: string;
    tone?: "primary" | "success" | "warning" | "neutral";
}) {
    const toneClass = {
        primary: "bg-primary-10 text-primary-base",
        success: "bg-success-10 text-success-base",
        warning: "bg-warning-10 text-warning-100",
        neutral: "bg-neutral-10 text-neutral-70",
    }[tone];

    return (
        <div className="card p-5">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
                <span className="text-sm font-bold">{value}</span>
            </div>
            <p className="text-sm font-semibold text-neutral-80">{label}</p>
            <p className="mt-1 text-xs text-neutral-50">{detail}</p>
        </div>
    );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
    return (
        <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-90">{title}</h2>
            {href && (
                <a href={href} className="text-xs font-semibold text-primary-base hover:text-primary-80">
                    Lihat semua
                </a>
            )}
        </div>
    );
}

export default async function StudentDashboardPage() {
    const headersList = await headers();
    const studentName = headersList.get("x-user-name") ?? "Siswa";
    const studentId = Number(headersList.get("x-user-id") ?? "0");

    const dashboard: StudentDashboard = await getStudentDashboardSafe(studentId);
    const recentGrades = await getStudentGrades(studentId, 3);
    const leaderboard = await getDailyQuizLeaderboard(5);
    const attendance = getAttendanceSummary(dashboard);
    const schedule = getSchedulePreview(dashboard);

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
                            Pantau progres belajar, jadwal, absensi, nilai, dan aktivitas harian.
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

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Progress Studying"
                    value={`${dashboard.overallProgressPercent}%`}
                    detail={`${dashboard.enrolledCourses.length} kursus aktif`}
                    tone="primary"
                />
                <StatCard
                    label="Summary Absensi"
                    value={`${attendance.percent}%`}
                    detail={`${attendance.present}/${attendance.total} sesi selesai`}
                    tone="success"
                />
                <StatCard
                    label="Nilai Terbaru"
                    value={recentGrades[0] ? `${recentGrades[0].score}` : "-"}
                    detail={recentGrades[0]?.lessonTitle ?? "Belum ada nilai quiz"}
                    tone="warning"
                />
                <StatCard
                    label="Daily Quiz"
                    value={leaderboard[0] ? `#${leaderboard[0].rank}` : "-"}
                    detail={leaderboard[0] ? `${leaderboard[0].studentName} memimpin hari ini` : "Belum ada skor hari ini"}
                    tone="neutral"
                />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <div className="card p-5 xl:col-span-2">
                    <SectionHeader title="Jadwal Belajar" href="/dashboard/schedule" />
                    {schedule.length === 0 ? (
                        <p className="rounded-xl bg-neutral-0 p-5 text-sm text-neutral-50">
                            Belum ada jadwal. Kursus yang aktif akan muncul di sini.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {schedule.map((item) => (
                                <a
                                    key={item.id}
                                    href={`/courses/${item.id}`}
                                    className="flex items-center justify-between rounded-xl border border-neutral-10 p-4 transition-colors hover:border-primary-base hover:bg-primary-10"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-neutral-80">{item.title}</p>
                                        <p className="text-xs text-neutral-50">{item.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-primary-base">{item.time}</p>
                                        <p className="text-xs text-neutral-40">{item.level}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card p-5">
                    <SectionHeader title="Leaderboard Daily Quiz" href="/dashboard/daily-quiz/leaderboard" />
                    {leaderboard.length === 0 ? (
                        <p className="rounded-xl bg-neutral-0 p-5 text-sm text-neutral-50">
                            Belum ada peserta daily quiz hari ini.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {leaderboard.map((item) => (
                                <div key={item.studentId} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-10 text-xs font-bold text-primary-base">
                                            {item.rank}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-neutral-80">{item.studentName}</p>
                                            <p className="text-xs text-neutral-40">{item.attempts} attempt</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-neutral-90">{item.bestScore}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <a href="/dashboard/ebooks" className="card-muted p-5 transition-colors hover:bg-primary-10">
                    <p className="text-sm font-semibold text-neutral-80">E-Book</p>
                    <p className="mt-1 text-xs text-neutral-50">Akses materi bacaan dan latihan pendukung.</p>
                </a>
                <a href="/dashboard/daily-quiz" className="card-muted p-5 transition-colors hover:bg-primary-10">
                    <p className="text-sm font-semibold text-neutral-80">Daily Quiz</p>
                    <p className="mt-1 text-xs text-neutral-50">Latihan singkat untuk menjaga konsistensi belajar.</p>
                </a>
                <a href="/dashboard/forum" className="card-muted p-5 transition-colors hover:bg-primary-10">
                    <p className="text-sm font-semibold text-neutral-80">Forum Diskusi</p>
                    <p className="mt-1 text-xs text-neutral-50">Diskusi materi dan tanya jawab bersama kelas.</p>
                </a>
            </section>

            {/* Course Cards */}
            <section>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-90">Progress Kursus</h2>
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
