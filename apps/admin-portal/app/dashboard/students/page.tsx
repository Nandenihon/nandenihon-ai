export const dynamic = "force-dynamic";

import { queryMySQL, type RowDataPacket } from "@repo/database";

interface Student {
    id: number;
    full_name: string;
    email: string;
    whatsapp: string | null;
    level: string | null;
    test_status: string;
    pass_status: string;
    created_at: Date;
}

interface StudentsPageProps {
    searchParams?: Promise<{ page?: string; level?: string; status?: string }>;
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

function getStatusLabel(testStatus: string, passStatus: string): string {
    if (testStatus === "completed") {
        return passStatus === "passed" ? "Lulus" : "Tidak Lulus";
    }
    if (testStatus === "in_progress") return "Dalam Tes";
    return "Aktif";
}

function getStatusColor(testStatus: string, passStatus: string): string {
    if (testStatus === "completed") {
        return passStatus === "passed"
            ? "bg-success-10 text-success-base"
            : "bg-error-10 text-error-base";
    }
    if (testStatus === "in_progress") return "bg-warning-10 text-warning-100";
    return "bg-primary-10 text-primary-base";
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
    const params = searchParams ? await searchParams : {};
    const page = Math.max(1, parseInt(params.page ?? "1", 10));
    const levelFilter = params.level ?? "";
    const statusFilter = params.status ?? "";
    const offset = (page - 1) * PAGE_SIZE;

    const conditions: string[] = [];
    const queryParams: unknown[] = [];

    if (levelFilter) {
        conditions.push("level = ?");
        queryParams.push(levelFilter);
    }
    if (statusFilter === "active") {
        conditions.push("test_status != 'completed'");
    } else if (statusFilter === "completed") {
        conditions.push("test_status = 'completed'");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let students: Student[] = [];
    let total = 0;

    try {
        const countRows = await queryMySQL<RowDataPacket[]>(
            `SELECT COUNT(*) as total FROM students ${whereClause}`,
            queryParams
        );
        total = Number(countRows[0]?.total ?? 0);

        const rows = await queryMySQL<RowDataPacket[]>(
            `SELECT id, full_name, email, whatsapp, level, test_status, pass_status, created_at
             FROM students
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...queryParams, PAGE_SIZE, offset]
        );
        students = rows as Student[];
    } catch {
        // Leave students empty, show error state
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    function buildUrl(newPage: number, newLevel?: string, newStatus?: string) {
        const p = new URLSearchParams();
        if (newPage > 1) p.set("page", String(newPage));
        const lv = newLevel ?? levelFilter;
        const st = newStatus ?? statusFilter;
        if (lv) p.set("level", lv);
        if (st) p.set("status", st);
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
                            {levelFilter && <input type="hidden" name="level" value={levelFilter} />}
                            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
                            <input
                                type="search"
                                name="search"
                                placeholder="Cari siswa..."
                                className="w-64 bg-absolute-white border border-neutral-20 rounded-xl py-2 pl-9 pr-4 text-sm text-neutral-70 placeholder:text-neutral-40 outline-none focus:border-primary-base transition-all"
                            />
                        </form>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={buildUrl(1, "", statusFilter)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${!levelFilter ? "bg-primary-base text-absolute-white border-primary-base" : "border-neutral-20 text-neutral-60 hover:bg-neutral-10"}`}
                        >
                            Semua Level
                        </a>
                        {["N5", "N4", "N3", "N2", "N1"].map((lv) => (
                            <a
                                key={lv}
                                href={buildUrl(1, lv, statusFilter)}
                                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${levelFilter === lv ? "bg-primary-base text-absolute-white border-primary-base" : "border-neutral-20 text-neutral-60 hover:bg-neutral-10"}`}
                            >
                                {lv}
                            </a>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={buildUrl(1, levelFilter, "")}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${!statusFilter ? "bg-neutral-80 text-absolute-white border-neutral-80" : "border-neutral-20 text-neutral-60 hover:bg-neutral-10"}`}
                        >
                            Semua Status
                        </a>
                        <a
                            href={buildUrl(1, levelFilter, "active")}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${statusFilter === "active" ? "bg-neutral-80 text-absolute-white border-neutral-80" : "border-neutral-20 text-neutral-60 hover:bg-neutral-10"}`}
                        >
                            Aktif
                        </a>
                        <a
                            href={buildUrl(1, levelFilter, "completed")}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${statusFilter === "completed" ? "bg-neutral-80 text-absolute-white border-neutral-80" : "border-neutral-20 text-neutral-60 hover:bg-neutral-10"}`}
                        >
                            Selesai
                        </a>
                    </div>
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
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Bergabung</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-10">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-neutral-50">
                                        Belum ada data siswa.
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
                                                {student.level ?? "-"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-neutral-60">
                                            {formatDate(student.created_at)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(student.test_status, student.pass_status)}`}>
                                                {getStatusLabel(student.test_status, student.pass_status)}
                                            </span>
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
