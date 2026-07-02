export const dynamic = "force-dynamic";

import { listCounselingRegistrations, VALID_TOPICS } from "@repo/database";

interface PageProps {
    searchParams?: Promise<{ page?: string; topic?: string }>;
}

const PAGE_SIZE = 20;

function formatDate(date: Date | string | null): string {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
}

function formatDateTime(date: Date | string | null): string {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date(date));
}

const topicColors: Record<string, string> = {
    Pendidikan: "bg-primary-10 text-primary-base",
    Karir: "bg-warning-10 text-warning-100",
    Keluarga: "bg-success-10 text-success-base",
    Relationship: "bg-secondary-10 text-secondary-80",
};

export default async function CounselingPage({ searchParams }: PageProps) {
    const params = searchParams ? await searchParams : {};
    const page = Math.max(1, parseInt(params.page ?? "1", 10));
    const topicFilter = params.topic ?? "";
    const offset_page = (page - 1) * PAGE_SIZE;

    let registrations: Awaited<ReturnType<typeof listCounselingRegistrations>>["data"] = [];
    let total = 0;
    let totalPages = 1;

    try {
        const result = await listCounselingRegistrations({
            page,
            limit: PAGE_SIZE,
            topic: topicFilter || undefined,
        });
        registrations = result.data;
        total = result.pagination.total;
        totalPages = result.pagination.totalPages;
    } catch {
        // show empty state
    }

    function buildUrl(newPage: number, newTopic?: string) {
        const p = new URLSearchParams();
        if (newPage > 1) p.set("page", String(newPage));
        const t = newTopic !== undefined ? newTopic : topicFilter;
        if (t) p.set("topic", t);
        return `/dashboard/counseling${p.size > 0 ? `?${p}` : ""}`;
    }

    const pageNumbers: number[] = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Topic filter pills */}
                    <a
                        href={buildUrl(1, "")}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                            !topicFilter
                                ? "bg-primary-base text-absolute-white border-primary-base"
                                : "border-neutral-20 text-neutral-60 hover:bg-neutral-10"
                        }`}
                    >
                        Semua Tema
                    </a>
                    {VALID_TOPICS.map((t) => (
                        <a
                            key={t}
                            href={buildUrl(1, t)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                                topicFilter === t
                                    ? "bg-primary-base text-absolute-white border-primary-base"
                                    : "border-neutral-20 text-neutral-60 hover:bg-neutral-10"
                            }`}
                        >
                            {t}
                        </a>
                    ))}
                </div>

                {/* Total badge */}
                <span className="text-sm text-neutral-50">
                    <span className="font-semibold text-neutral-80">{new Intl.NumberFormat("id-ID").format(total)}</span> pendaftar
                </span>
            </div>

            {/* Table */}
            <div className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-0 border-b border-neutral-20">
                            <tr>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-6 py-3.5">Pendaftar</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Kontak</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Domisili</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Pendidikan</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Tema</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Waktu Konsultasi</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Terdaftar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-10">
                            {registrations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-neutral-50">
                                        <div className="flex flex-col items-center gap-3">
                                            <svg className="w-10 h-10 text-neutral-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                                            </svg>
                                            <p>Belum ada pendaftaran konseling.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                registrations.map((reg) => (
                                    <tr key={reg.id} className="hover:bg-neutral-0 transition-colors">
                                        {/* Name + email */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary-20 flex items-center justify-center text-primary-base text-sm font-bold flex-shrink-0">
                                                    {reg.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-neutral-80">{reg.full_name}</p>
                                                    <p className="text-xs text-neutral-40">{reg.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Phone + birth info */}
                                        <td className="px-4 py-4">
                                            <p className="text-sm text-neutral-70">{reg.phone}</p>
                                            <p className="text-xs text-neutral-40">
                                                {reg.birth_place}, {formatDate(reg.birth_date)}
                                            </p>
                                        </td>

                                        {/* Domicile */}
                                        <td className="px-4 py-4 text-sm text-neutral-60">{reg.domicile}</td>

                                        {/* Education */}
                                        <td className="px-4 py-4">
                                            <span className="bg-neutral-10 text-neutral-60 text-xs font-semibold px-2.5 py-1 rounded-full">
                                                {reg.last_education}
                                            </span>
                                        </td>

                                        {/* Topic */}
                                        <td className="px-4 py-4">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${topicColors[reg.topic] ?? "bg-neutral-10 text-neutral-60"}`}>
                                                {reg.topic}
                                            </span>
                                        </td>

                                        {/* Consultation time */}
                                        <td className="px-4 py-4 text-sm text-neutral-60 whitespace-nowrap">
                                            {formatDateTime(reg.consultation_time)}
                                        </td>

                                        {/* Registered at */}
                                        <td className="px-4 py-4 text-sm text-neutral-60 whitespace-nowrap">
                                            {formatDate(reg.created_at)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-20">
                        <p className="text-sm text-neutral-50">
                            Menampilkan{" "}
                            <span className="font-semibold text-neutral-80">
                                {Math.min(offset_page + 1, total)}–{Math.min(offset_page + PAGE_SIZE, total)}
                            </span>{" "}
                            dari <span className="font-semibold text-neutral-80">{new Intl.NumberFormat("id-ID").format(total)}</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            <a
                                href={buildUrl(Math.max(1, page - 1))}
                                aria-disabled={page === 1}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-20 text-neutral-50 transition-all ${page === 1 ? "opacity-40 pointer-events-none" : "hover:bg-neutral-10"}`}
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                            </a>
                            {page > 3 && (
                                <>
                                    <a href={buildUrl(1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-20 text-sm font-medium text-neutral-60 hover:bg-neutral-10 transition-all">1</a>
                                    {page > 4 && <span className="text-neutral-40 text-sm px-1">…</span>}
                                </>
                            )}
                            {pageNumbers.map((p) => (
                                <a
                                    key={p}
                                    href={buildUrl(p)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${p === page ? "bg-primary-base text-absolute-white" : "border border-neutral-20 text-neutral-60 hover:bg-neutral-10"}`}
                                >
                                    {p}
                                </a>
                            ))}
                            {page < totalPages - 2 && (
                                <>
                                    {page < totalPages - 3 && <span className="text-neutral-40 text-sm px-1">…</span>}
                                    <a href={buildUrl(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-20 text-sm font-medium text-neutral-60 hover:bg-neutral-10 transition-all">{totalPages}</a>
                                </>
                            )}
                            <a
                                href={buildUrl(Math.min(totalPages, page + 1))}
                                aria-disabled={page === totalPages}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-20 text-neutral-50 transition-all ${page === totalPages ? "opacity-40 pointer-events-none" : "hover:bg-neutral-10"}`}
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
