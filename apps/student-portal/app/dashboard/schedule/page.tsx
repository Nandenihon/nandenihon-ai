import { headers } from "next/headers";
import { getSchedulePreview, getStudentDashboardSafe } from "../dashboard-data";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
    const headersList = await headers();
    const studentId = Number(headersList.get("x-user-id") ?? "0");
    const dashboard = await getStudentDashboardSafe(studentId);
    const schedule = getSchedulePreview(dashboard);

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-40">Jadwal</p>
                <h1 className="text-2xl font-bold text-neutral-90">Schedule Belajar</h1>
            </div>

            <section className="card divide-y divide-neutral-10 overflow-hidden">
                {schedule.length === 0 ? (
                    <p className="px-5 py-12 text-center text-sm text-neutral-50">Belum ada jadwal belajar.</p>
                ) : (
                    schedule.map((item) => (
                        <a key={item.id} href={`/courses/${item.id}`} className="grid gap-3 px-5 py-4 transition-colors hover:bg-primary-10 md:grid-cols-[120px_1fr_auto] md:items-center">
                            <p className="text-sm font-bold text-primary-base">{item.time}</p>
                            <div>
                                <p className="text-sm font-semibold text-neutral-80">{item.title}</p>
                                <p className="text-xs text-neutral-50">{item.description}</p>
                            </div>
                            <span className="w-fit rounded-full bg-neutral-10 px-3 py-1 text-xs font-semibold text-neutral-60">
                                {item.level}
                            </span>
                        </a>
                    ))
                )}
            </section>
        </div>
    );
}
