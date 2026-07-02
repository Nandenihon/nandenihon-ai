export const dynamic = "force-dynamic";

import { queryMySQL, type RowDataPacket } from "@repo/database";

interface Registration {
    id: number;
    full_name: string;
    theme: string;
    whatsapp_number: string | null;
    domicile: string | null;
    created_at: Date;
    status?: string;
}

interface PageProps {
    searchParams?: Promise<{ page?: string; theme?: string }>;
}

const PAGE_SIZE = 10;

function formatDate(date: Date | null): string {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
}

export default async function SeminarRegistrationsPage({ searchParams }: PageProps) {
    const params = searchParams ? await searchParams : {};
    const page = Math.max(1, parseInt(params.page ?? "1", 10));
    const themeFilter = params.theme ?? "";
    const offset = (page - 1) * PAGE_SIZE;

    let registrations: Registration[] = [];
    let total = 0;

    try {
        const conditions: string[] = [];
        const queryParams: unknown[] = [];

        if (themeFilter) {
            conditions.push("theme = ?");
            queryParams.push(themeFilter);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countRows = await queryMySQL<RowDataPacket[]>(
            `SELECT COUNT(*) as total FROM seminar_registration ${whereClause}`,
            queryParams
        );
        total = Number(countRows[0]?.total ?? 0);

        const rows = await queryMySQL<RowDataPacket[]>(
            `SELECT id, full_name, theme, whatsapp_number, domicile, created_at
             FROM seminar_registration
             ${whereClause}
             ORDER BY id DESC
             LIMIT ? OFFSET ?`,
            [...queryParams, PAGE_SIZE, offset]
        );
        registrations = rows as Registration[];
    } catch {
        // Leave registrations empty
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    function buildUrl(newPage: number) {
        const p = new URLSearchParams();
        if (newPage > 1) p.set("page", String(newPage));
        if (themeFilter) p.set("theme", themeFilter);
        return `/dashboard/seminars/registrations${p.size > 0 ? `?${p}` : ""}`;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-20">
                    <div>
                        <h3 className="text-base font-bold text-neutral-90">Daftar Pendaftar Seminar</h3>
                        <p className="text-xs text-neutral-50 mt-0.5">{total} pendaftar</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-0 border-b border-neutral-20">
                            <tr>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-6 py-3.5">Nama</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Seminar</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Kontak / Domisili</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Tanggal Daftar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-10">
                            {registrations.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-neutral-50">
                                        Belum ada pendaftar.
                                    </td>
                                </tr>
                            ) : (
                                registrations.map((reg) => (
                                    <tr key={reg.id} className="hover:bg-neutral-0 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-20 flex items-center justify-center text-primary-base text-xs font-bold flex-shrink-0">
                                                    {reg.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <p className="text-sm font-semibold text-neutral-80">{reg.full_name}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-neutral-60 max-w-xs truncate">{reg.theme}</td>
                                        <td className="px-4 py-4">
                                            <p className="text-sm text-neutral-60">{reg.whatsapp_number ?? "-"}</p>
                                            {reg.domicile && (
                                                <p className="text-xs text-neutral-40">{reg.domicile}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-neutral-60">{formatDate(reg.created_at)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-20">
                        <p className="text-sm text-neutral-50">
                            Halaman <span className="font-semibold text-neutral-80">{page}</span> dari{" "}
                            <span className="font-semibold text-neutral-80">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <a
                                href={buildUrl(Math.max(1, page - 1))}
                                aria-disabled={page === 1}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-20 text-neutral-60 transition-all ${page === 1 ? "opacity-40 pointer-events-none" : "hover:bg-neutral-10"}`}
                            >
                                ← Prev
                            </a>
                            <a
                                href={buildUrl(Math.min(totalPages, page + 1))}
                                aria-disabled={page === totalPages}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-20 text-neutral-60 transition-all ${page === totalPages ? "opacity-40 pointer-events-none" : "hover:bg-neutral-10"}`}
                            >
                                Next →
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
