import { headers } from "next/headers";
import { getStudentGrades } from "../dashboard-data";

export const dynamic = "force-dynamic";

export default async function DailyQuizPage() {
    const headersList = await headers();
    const studentId = Number(headersList.get("x-user-id") ?? "0");
    const recentGrades = await getStudentGrades(studentId, 5);
    const latest = recentGrades[0];

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-40">Daily Quiz</p>
                    <h1 className="text-2xl font-bold text-neutral-90">Latihan Harian</h1>
                </div>
                <a href="/dashboard/daily-quiz/leaderboard" className="rounded-lg bg-primary-base px-4 py-2 text-sm font-semibold text-white">
                    Leaderboard
                </a>
            </div>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_.6fr]">
                <div className="card p-6">
                    <p className="text-sm font-bold text-neutral-90">Quiz hari ini</p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-50">
                        Daily quiz akan mengambil materi dari lesson quiz yang tersedia di kursus kamu. Buka kursus aktif untuk mengerjakan quiz dan skor akan masuk ke leaderboard harian.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <a href="/dashboard" className="rounded-lg bg-primary-base px-4 py-2 text-sm font-semibold text-white">
                            Pilih Kursus
                        </a>
                        <a href="/dashboard/grades" className="rounded-lg border border-neutral-20 px-4 py-2 text-sm font-semibold text-neutral-70">
                            Lihat Nilai
                        </a>
                    </div>
                </div>

                <div className="card p-6">
                    <p className="text-sm font-bold text-neutral-90">Skor terakhir</p>
                    <p className="mt-5 text-5xl font-bold text-primary-base">{latest ? latest.score : "-"}</p>
                    <p className="mt-2 text-xs text-neutral-50">{latest?.lessonTitle ?? "Belum ada skor quiz"}</p>
                </div>
            </section>
        </div>
    );
}
