import { headers } from "next/headers";
import { getStudentGrades } from "../dashboard-data";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}

export default async function GradesPage() {
    const headersList = await headers();
    const studentId = Number(headersList.get("x-user-id") ?? "0");
    const grades = await getStudentGrades(studentId, 50);
    const average = grades.length > 0
        ? Math.round(grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length)
        : 0;

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-40">Nilai</p>
                    <h1 className="text-2xl font-bold text-neutral-90">Nilai Quiz & Latihan</h1>
                </div>
                <div className="rounded-xl bg-primary-10 px-4 py-3 text-right">
                    <p className="text-xs text-primary-base">Rata-rata</p>
                    <p className="text-2xl font-bold text-primary-base">{grades.length > 0 ? average : "-"}</p>
                </div>
            </div>

            <section className="card overflow-hidden">
                <table className="w-full min-w-[720px]">
                    <thead className="border-b border-neutral-10 bg-neutral-0">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-50">Materi</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-50">Kursus</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-50">Tanggal</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-50">Nilai</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-10">
                        {grades.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-12 text-center text-sm text-neutral-50">
                                    Belum ada nilai quiz.
                                </td>
                            </tr>
                        ) : (
                            grades.map((grade) => (
                                <tr key={grade.id}>
                                    <td className="px-5 py-4 text-sm font-semibold text-neutral-80">{grade.lessonTitle}</td>
                                    <td className="px-5 py-4 text-sm text-neutral-60">{grade.courseTitle}</td>
                                    <td className="px-5 py-4 text-sm text-neutral-50">{formatDate(grade.submittedAt)}</td>
                                    <td className="px-5 py-4 text-right">
                                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${grade.score >= 70 ? "bg-success-10 text-success-base" : "bg-warning-10 text-warning-100"}`}>
                                            {grade.score}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
}
