import { getDailyQuizLeaderboard } from "../../dashboard-data";

export const dynamic = "force-dynamic";

export default async function DailyQuizLeaderboardPage() {
    const leaderboard = await getDailyQuizLeaderboard(50);

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-40">Daily Quiz</p>
                <h1 className="text-2xl font-bold text-neutral-90">Leaderboard Harian</h1>
            </div>

            <section className="card overflow-hidden">
                <div className="divide-y divide-neutral-10">
                    {leaderboard.length === 0 ? (
                        <p className="px-5 py-12 text-center text-sm text-neutral-50">Belum ada skor leaderboard hari ini.</p>
                    ) : (
                        leaderboard.map((item) => (
                            <div key={item.studentId} className="grid grid-cols-[48px_1fr_auto] items-center gap-4 px-5 py-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${item.rank <= 3 ? "bg-tertiary-20 text-warning-100" : "bg-neutral-10 text-neutral-60"}`}>
                                    {item.rank}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-neutral-80">{item.studentName}</p>
                                    <p className="text-xs text-neutral-40">{item.attempts} attempt</p>
                                </div>
                                <p className="text-lg font-bold text-primary-base">{item.bestScore}</p>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
