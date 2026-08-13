export const dynamic = "force-dynamic";

import { ensureStudentsTable, queryMySQL, type RowDataPacket } from "@repo/database";

interface Student {
    id: number;
    user_id: number;
    full_name: string;
    email: string;
    whatsapp: string | null;
    japanese_level: string | null;
    activated_at: Date | null;
    class_code: string | null;
    class_name: string | null;
}

interface StudentsPageProps {
    searchParams?: Promise<{ page?: string; search?: string }>;
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

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
    const params = searchParams ? await searchParams : {};
    const page = Math.max(1, parseInt(params.page ?? "1", 10));
    const search = params.search ?? "";
    const offset = (page - 1) * PAGE_SIZE;

    // Active students from the admission flow only (user_id set once payment is
    // verified — see admission-test-mysql.ts verifyPayment). Legacy leads from the
    // retired public quiz never had a users row, so they're intentionally excluded.
    const conditions: string[] = ["s.user_id IS NOT NULL"];
    const queryParams: unknown[] = [];

    if (search) {
        conditions.push("(s.full_name LIKE ? OR s.email LIKE ? OR s.whatsapp LIKE ?)");
        const term = `%${search}%`;
        queryParams.push(term, term, term);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    let students: Student[] = [];
    let total = 0;

    try {
        await ensureStudentsTable();
        const countRows = await queryMySQL<RowDataPacket[]>(
            `SELECT COUNT(*) as total FROM students s ${whereClause}`,
            queryParams
        );
        total = Number(countRows[0]?.total ?? 0);

        const rows = await queryMySQL<RowDataPacket[]>(
            `SELECT s.id, s.user_id, s.full_name, s.email, s.whatsapp, s.japanese_level, s.activated_at,
                    c.code AS class_code, c.name AS class_name
             FROM students s
             LEFT JOIN class_memberships m ON m.user_id = s.user_id AND m.status = 'active'
             LEFT JOIN enrollment_classes c ON c.id = m.class_id
             ${whereClause}
             ORDER BY s.activated_at DESC
             LIMIT ? OFFSET ?`,
            [...queryParams, PAGE_SIZE, offset]
        );
        students = rows as Student[];
    } catch {
        // Leave students empty, show error state
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    function buildUrl(newPage: number) {
        const p = new URLSearchParams();
        if (newPage > 1) p.set("page", String(newPage));
        if (search) p.set("search", search);
        return `/dashboard/students${p.size > 0 ? `?${p}` : ""}`;
    }

    const pageNumbers: number[] = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-40">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <form method="GET" action="/dashboard/students">
                            <input
                                type="search"
                                name="search"
                                defaultValue={search}
                                placeholder="Cari siswa..."
                                className="w-64 bg-absolute-white border border-neutral-20 rounded-xl py-2 pl-9 pr-4 text-sm text-neutral-70 placeholder:text-neutral-40 outline-none focus:border-primary-base transition-all"
                            />
                        </form>
                    </div>
                    <span className="text-sm text-neutral-50">{new Intl.NumberFormat("id-ID").format(total)} siswa aktif</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-0 border-b border-neutral-20">
                            <tr>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-6 py-3.5">Siswa</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">No. HP</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Level</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Kelas</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Aktif sejak</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-10">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-neutral-50">
                                        Belum ada siswa aktif.
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.id} className="hover:bg-neutral-0 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary-20 flex items-center justify-center text-primary-base text-sm font-bold flex-shrink-0">
                                                    {student.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-neutral-80">{student.full_name}</p>
                                                    <p className="text-xs text-neutral-40">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-neutral-60">{student.whatsapp ?? "-"}</td>
                                        <td className="px-4 py-4">
                                            <span className="bg-primary-10 text-primary-base text-xs font-semibold px-2.5 py-1 rounded-full">
                                                {student.japanese_level ?? "-"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-neutral-70">
                                            {student.class_code ? (
                                                <span className="font-semibold">{student.class_code} · {student.class_name}</span>
                                            ) : (
                                                <span className="text-neutral-30">Belum ada kelas aktif</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-neutral-60">
                                            {formatDate(student.activated_at)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-20">
                    <p className="text-sm text-neutral-50">
                        Menampilkan{" "}
                        <span className="font-semibold text-neutral-80">
                            {Math.min(offset + 1, total)}–{Math.min(offset + PAGE_SIZE, total)}
                        </span>{" "}
                        dari <span className="font-semibold text-neutral-80">{new Intl.NumberFormat("id-ID").format(total)}</span> siswa
                    </p>
                    <div className="flex items-center gap-1.5">
                        <a
                            href={buildUrl(Math.max(1, page - 1))}
                            aria-disabled={page === 1}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-20 text-neutral-50 transition-all ${page === 1 ? "opacity-40 pointer-events-none" : "hover:bg-neutral-10"}`}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
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
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
