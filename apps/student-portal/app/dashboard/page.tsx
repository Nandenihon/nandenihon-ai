import Link from "next/link";
import { headers } from "next/headers";
import { listActiveClassMembershipsForUser, type StudentDashboard } from "@repo/database";
import CourseCard from "../components/CourseCard";
import {
    getAttendanceSummary,
    getDailyQuizLeaderboard,
    getSchedulePreview,
    getStudentDashboardSafe,
    getStudentGrades,
} from "./dashboard-data";

function formatDate(value: string | Date | null): string {
    if (!value) return "-";
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

async function getMyClasses(userId: number) {
    try {
        return await listActiveClassMembershipsForUser(userId);
    } catch {
        return [];
    }
}

export const dynamic = "force-dynamic";

function MetricCard({ icon, label, value, detail, accent }: {
    icon: string; label: string; value: string; detail: string; accent: string;
}) {
    return (
        <article className="portal-card flex items-center gap-4 p-5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${accent}`} aria-hidden="true">{icon}</div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-50">{label}</p>
                <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-[#14213d]">{value}</p>
                <p className="truncate text-xs text-neutral-40">{detail}</p>
            </div>
        </article>
    );
}

function SectionHeading({ title, description, href }: { title: string; description?: string; href?: string }) {
    return (
        <div className="mb-4 flex items-end justify-between gap-4">
            <div>
                <h2 className="text-lg font-extrabold text-[#14213d] sm:text-xl">{title}</h2>
                {description && <p className="mt-1 text-sm text-neutral-50">{description}</p>}
            </div>
            {href && <Link href={href} className="portal-focus shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-primary-base hover:bg-primary-10">Lihat semua</Link>}
        </div>
    );
}

function PreStudentHome({ firstName }: { firstName: string }) {
    return (
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
            <section className="relative overflow-hidden rounded-[1.75rem] bg-[#142d63] px-6 py-9 text-white shadow-[0_24px_60px_rgba(20,45,99,0.25)] sm:px-9">
                <p className="mb-2 text-sm font-semibold text-primary-20">こんにちは, {firstName}! 👋</p>
                <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">Selamat datang, calon siswa Nande Nihon</h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100">
                    Pilih kelas yang kamu minati dan kerjakan tes penempatannya. Jika lolos, kamu akan diarahkan ke halaman pembayaran.
                </p>
                <Link href="/dashboard/class-catalog" className="portal-focus mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-primary-90 shadow-lg transition-transform hover:-translate-y-0.5">
                    Pilih kelas &amp; mulai tes →
                </Link>
            </section>
            <section className="grid gap-4 sm:grid-cols-2">
                <Link href="/dashboard/tests/history" className="portal-card portal-card-interactive portal-focus p-5">
                    <p className="text-2xl" aria-hidden="true">📝</p>
                    <p className="mt-2 font-bold text-neutral-80">Riwayat Tes</p>
                    <p className="mt-1 text-xs text-neutral-50">Lihat semua tes yang sudah kamu kerjakan, termasuk yang belum lolos.</p>
                </Link>
                <Link href="/dashboard/payment" className="portal-card portal-card-interactive portal-focus p-5">
                    <p className="text-2xl" aria-hidden="true">💳</p>
                    <p className="mt-2 font-bold text-neutral-80">Pembayaran</p>
                    <p className="mt-1 text-xs text-neutral-50">Sudah lolos tes? Upload bukti pembayaran di sini.</p>
                </Link>
            </section>
        </div>
    );
}

export default async function StudentDashboardPage() {
    const headersList = await headers();
    const studentName = headersList.get("x-user-name") ?? "Siswa";
    const studentId = Number(headersList.get("x-user-id") ?? "0");
    const role = headersList.get("x-user-role");
    const firstName = studentName.split(" ")[0];

    if (role === "pre_student") {
        return <PreStudentHome firstName={firstName} />;
    }

    const dashboard: StudentDashboard = await getStudentDashboardSafe(studentId);
    const recentGrades = await getStudentGrades(studentId, 3);
    const leaderboard = await getDailyQuizLeaderboard(3);
    const myClasses = await getMyClasses(studentId);
    const attendance = getAttendanceSummary(dashboard);
    const schedule = getSchedulePreview(dashboard);
    const activeCourse = dashboard.enrolledCourses.find((course) => course.enrollmentStatus !== "completed") ?? dashboard.enrolledCourses[0];
    const primaryClass = myClasses[0];
    const average = recentGrades.length
        ? Math.round(recentGrades.reduce((total, grade) => total + grade.score, 0) / recentGrades.length)
        : 0;

    return (
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-8 sm:py-8">
            <section className="relative overflow-hidden rounded-[1.75rem] bg-[#142d63] px-6 py-7 text-white shadow-[0_24px_60px_rgba(20,45,99,0.25)] sm:px-9 sm:py-9">
                <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full bg-primary-50/30 blur-2xl" />
                <div className="absolute bottom-0 right-[20%] h-24 w-24 rounded-full bg-secondary-base/20 blur-xl" />
                <div className="relative grid items-center gap-7 lg:grid-cols-[1fr_360px]">
                    <div>
                        <p className="mb-2 text-sm font-semibold text-primary-20">こんにちは, {firstName}! 👋</p>
                        {activeCourse ? (
                            <>
                                <h1 className="max-w-2xl text-2xl font-extrabold leading-tight sm:text-3xl">Siap melanjutkan belajar hari ini?</h1>
                                <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100">Lanjutkan <strong className="text-white">{activeCourse.title}</strong> dan jaga momentum belajarmu.</p>
                                <Link href={`/courses/${activeCourse.id}`} className="portal-focus mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-primary-90 shadow-lg transition-transform hover:-translate-y-0.5">
                                    <span aria-hidden="true">▶</span> Lanjutkan belajar
                                </Link>
                            </>
                        ) : primaryClass ? (
                            <>
                                <h1 className="max-w-2xl text-2xl font-extrabold leading-tight sm:text-3xl">Selamat datang di kelas {primaryClass.name}!</h1>
                                <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100">
                                    Kamu resmi terdaftar di <strong className="text-white">{primaryClass.name}</strong> ({primaryClass.level}). Materi belajar akan ditambahkan oleh pengajarmu.
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-2xl font-extrabold sm:text-3xl">Selamat datang di ruang belajarmu</h1>
                                <p className="mt-3 text-sm text-blue-100">Kursus aktif akan muncul di sini setelah pendaftaran dikonfirmasi.</p>
                            </>
                        )}
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                        <div className="flex items-end justify-between">
                            <div><p className="text-xs font-semibold text-blue-100">Progres keseluruhan</p><p className="mt-1 text-4xl font-black">{dashboard.overallProgressPercent}%</p></div>
                            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{dashboard.enrolledCourses.length} kursus</span>
                        </div>
                        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label="Progres belajar keseluruhan" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dashboard.overallProgressPercent}>
                            <div className="h-full rounded-full bg-gradient-to-r from-secondary-base to-tertiary-base" style={{ width: `${dashboard.overallProgressPercent}%` }} />
                        </div>
                        <p className="mt-3 text-xs text-blue-100">Sedikit progres setiap hari akan jadi hasil besar.</p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
                <MetricCard icon="学" label="Progres belajar" value={`${dashboard.overallProgressPercent}%`} detail={`${dashboard.enrolledCourses.length} kursus terdaftar`} accent="bg-primary-10 text-primary-base" />
                <MetricCard icon="✓" label="Kehadiran" value={`${attendance.percent}%`} detail={`${attendance.present} dari ${attendance.total} sesi`} accent="bg-success-10 text-success-100" />
                <MetricCard icon="★" label="Rata-rata nilai" value={recentGrades.length ? String(average) : "–"} detail={recentGrades.length ? `${recentGrades.length} penilaian terbaru` : "Belum ada penilaian"} accent="bg-warning-10 text-warning-100" />
            </section>

            <section>
                <SectionHeading title="Kelas Saya" description="Kelas yang sedang kamu ikuti setelah lolos tes penempatan." />
                {myClasses.length ? (
                    <div className="grid gap-5 sm:grid-cols-2">
                        {myClasses.map((cls) => (
                            <article key={cls.membership_id} className="portal-card overflow-hidden">
                                <div className="h-2 bg-primary-base" />
                                <div className="p-6">
                                    <p className="text-xs font-bold text-primary-base">{cls.code} · {cls.level}</p>
                                    <h3 className="mt-1 text-lg font-black text-[#14213d]">{cls.name}</h3>
                                    {cls.description && <p className="mt-2 line-clamp-2 text-sm text-neutral-60">{cls.description}</p>}
                                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                        <div><dt className="text-neutral-40">Program</dt><dd className="font-semibold">{cls.program}</dd></div>
                                        <div><dt className="text-neutral-40">Pengajar</dt><dd className="font-semibold">{cls.teacher_name || "Nande Nihon"}</dd></div>
                                        <div><dt className="text-neutral-40">Jadwal</dt><dd className="font-semibold">{cls.schedule}</dd></div>
                                        <div><dt className="text-neutral-40">Periode</dt><dd className="font-semibold">{formatDate(cls.start_at)} – {formatDate(cls.end_at)}</dd></div>
                                    </dl>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="portal-card p-10 text-center">
                        <div className="text-4xl" aria-hidden="true">🏫</div>
                        <h3 className="mt-3 font-bold text-neutral-80">Belum terdaftar di kelas manapun</h3>
                        <p className="mt-1 text-sm text-neutral-50">Hubungi admin jika kamu merasa seharusnya sudah aktif di sebuah kelas.</p>
                    </div>
                )}
            </section>

            <section>
                <SectionHeading title="Kursus saya" description="Pilih kursus dan lanjutkan dari progres terakhir." />
                {dashboard.enrolledCourses.length ? (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {dashboard.enrolledCourses.map((course) => <CourseCard key={course.id} {...course} />)}
                    </div>
                ) : (
                    <div className="portal-card p-10 text-center"><div className="text-4xl" aria-hidden="true">📚</div><h3 className="mt-3 font-bold text-neutral-80">Belum ada kursus aktif</h3><p className="mt-1 text-sm text-neutral-50">Hubungi admin untuk mengaktifkan kursus pertamamu.</p></div>
                )}
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="portal-card p-5 sm:p-6">
                    <SectionHeading title="Agenda belajar" description="Kursus yang bisa kamu lanjutkan sekarang." href="/dashboard/schedule" />
                    <div className="space-y-2">
                        {schedule.length ? schedule.slice(0, 3).map((item) => (
                            <Link key={item.id} href={`/courses/${item.id}`} className="portal-focus flex min-h-16 items-center gap-4 rounded-xl border border-transparent p-3 transition-colors hover:border-primary-20 hover:bg-primary-10">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-10 text-sm font-black text-primary-base">{item.level}</div>
                                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-neutral-80">{item.title}</p><p className="truncate text-xs text-neutral-50">{item.description}</p></div>
                                <span className="text-xs font-bold text-primary-base">{item.time} →</span>
                            </Link>
                        )) : <p className="rounded-xl bg-neutral-0 p-5 text-sm text-neutral-50">Belum ada agenda belajar.</p>}
                    </div>
                </div>

                <div className="portal-card overflow-hidden p-5 sm:p-6">
                    <SectionHeading title="Tantangan harian" description="Latihan singkat, hasil nyata." />
                    <Link href="/dashboard/daily-quiz" className="portal-focus block rounded-2xl bg-gradient-to-br from-[#fff7dd] to-[#ffecf6] p-5">
                        <div className="text-3xl" aria-hidden="true">⚡</div><p className="mt-3 font-extrabold text-[#14213d]">Daily Quiz</p><p className="mt-1 text-xs leading-relaxed text-neutral-60">Jawab soal hari ini dan naikkan peringkatmu.</p><span className="mt-4 inline-block text-sm font-extrabold text-primary-base">Mulai quiz →</span>
                    </Link>
                    {leaderboard[0] && <p className="mt-4 text-center text-xs text-neutral-50">Skor tertinggi hari ini: <strong className="text-neutral-80">{leaderboard[0].bestScore}</strong></p>}
                </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
                {[{ href: "/dashboard/ebooks", icon: "📖", title: "E-Book", text: "Materi pendukung" }, { href: "/dashboard/grades", icon: "📈", title: "Nilai", text: "Lihat perkembangan" }, { href: "/dashboard/forum", icon: "💬", title: "Forum", text: "Diskusi bersama" }].map((item) => (
                    <Link key={item.href} href={item.href} className="portal-card portal-card-interactive portal-focus flex items-center gap-4 p-4"><span className="text-2xl" aria-hidden="true">{item.icon}</span><div><p className="text-sm font-bold text-neutral-80">{item.title}</p><p className="text-xs text-neutral-50">{item.text}</p></div><span className="ml-auto text-primary-base">→</span></Link>
                ))}
            </section>
        </div>
    );
}
