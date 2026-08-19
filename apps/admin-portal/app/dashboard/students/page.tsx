export const dynamic = "force-dynamic";

import Link from "next/link";
import { listStudentsOverview, listPortalClasses, type StudentStatus } from "@repo/database";
import StudentRowActions from "@/app/components/StudentRowActions";
import ClassFilterSelect from "@/app/components/ClassFilterSelect";

interface StudentsPageProps {
    searchParams?: Promise<{ page?: string; search?: string; classId?: string; status?: string }>;
}

const PAGE_SIZE = 20;

const STATUS_BADGE: Record<StudentStatus, { label: string; className: string }> = {
    active: { label: "Aktif", className: "bg-success-10 text-success-base" },
    inactive: { label: "Non-aktif", className: "bg-error-10 text-error-base" },
};

function formatDate(date: Date | string | null): string {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
    }).format(new Date(date));
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
    const params = searchParams ? await searchParams : {};
    const page = Math.max(1, parseInt(params.page ?? "1", 10));
    const search = params.search ?? "";
    const classId = Number(params.classId) || undefined;
    const statusParam = params.status ?? "";
    const status = statusParam === "active" || statusParam === "inactive" ? (statusParam as StudentStatus) : undefined;

    let result: Awaited<ReturnType<typeof listStudentsOverview>> | null = null;
    let error = "";
    try {
        result = await listStudentsOverview({ search: search || undefined, classId, status, page, pageSize: PAGE_SIZE });
    } catch {
        error = "Gagal memuat data siswa";
    }

    const students = result?.data ?? [];
    const total = result?.total ?? 0;
    const totalPages = result?.totalPages ?? 1;

    const allClasses = await listPortalClasses({}).catch(() => []);
    const classOptions = allClasses
        .filter((c) => c.status !== "archived")
        .map((c) => ({ id: Number(c.id), code: String(c.code), name: String(c.name) }));

    function buildUrl(overrides: Partial<{ page: number; classId: string; status: string }>) {
        const p = new URLSearchParams();
        const next = { page, classId: params.classId ?? "", status: statusParam, ...overrides };
        if (search) p.set("search", search);
        if (next.page > 1) p.set("page", String(next.page));
        if (next.classId) p.set("classId", next.classId);
        if (next.status) p.set("status", next.status);
        return `/dashboard/students${p.size > 0 ? `?${p}` : ""}`;
    }

    const exportParams = new URLSearchParams();
    if (search) exportParams.set("search", search);
    if (params.classId) exportParams.set("classId", params.classId);
    if (statusParam) exportParams.set("status", statusParam);

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
                    <form method="GET" action="/dashboard/students" className="flex items-center gap-2 flex-wrap">
                        {params.classId && <input type="hidden" name="classId" value={params.classId} />}
                        {statusParam && <input type="hidden" name="status" value={statusParam} />}
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-40">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                            <input
                                type="search"
                                name="search"
                                defaultValue={search}
                                placeholder="Cari siswa..."
                                className="w-64 bg-absolute-white border border-neutral-20 rounded-xl py-2 pl-9 pr-4 text-sm text-neutral-70 placeholder:text-neutral-40 outline-none focus:border-primary-base transition-all"
                            />
                        </div>
                    </form>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-40 uppercase tracking-wide">Status:</span>
                        <a href={buildUrl({ status: "", page: 1 })} className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${!statusParam ? "bg-neutral-80 text-absolute-white border-neutral-80" : "border-neutral-20 text-neutral-60 hover:bg-neutral-10"}`}>Semua</a>
                        <a href={buildUrl({ status: "active", page: 1 })} className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${statusParam === "active" ? "bg-neutral-80 text-absolute-white border-neutral-80" : "border-neutral-20 text-neutral-60 hover:bg-neutral-10"}`}>Aktif</a>
                        <a href={buildUrl({ status: "inactive", page: 1 })} className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${statusParam === "inactive" ? "bg-neutral-80 text-absolute-white border-neutral-80" : "border-neutral-20 text-neutral-60 hover:bg-neutral-10"}`}>Non-aktif</a>
                    </div>
                    <ClassFilterSelect
                        classOptions={classOptions}
                        value={params.classId ?? ""}
                        buildUrl={buildUrl({ classId: "__CLASS_ID__", page: 1 })}
                    />
                    <span className="text-sm text-neutral-50">{new Intl.NumberFormat("id-ID").format(total)} siswa</span>
                </div>
                <a
                    href={`/api/students/export${exportParams.size > 0 ? `?${exportParams}` : ""}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary-20 px-4 py-2 text-sm font-semibold text-primary-base hover:bg-primary-10 transition-all"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M12 3V16M12 16L7 11M12 16L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 18V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Download CSV
                </a>
            </div>

            {error && <div className="rounded-xl bg-error-10 p-4 text-sm text-error-base">{error}</div>}

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
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Status</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Aktif sejak</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-10">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-neutral-50">
                                        Belum ada siswa.
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => {
                                    const statusBadge = STATUS_BADGE[(student.status as StudentStatus) ?? "active"];
                                    return (
                                        <tr key={student.id as number} className="hover:bg-neutral-0 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary-20 flex items-center justify-center text-primary-base text-sm font-bold flex-shrink-0">
                                                        {String(student.full_name).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-neutral-80">{student.full_name as string}</p>
                                                        <p className="text-xs text-neutral-40">{student.email as string}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-neutral-60">{(student.whatsapp as string) ?? "-"}</td>
                                            <td className="px-4 py-4">
                                                <span className="bg-primary-10 text-primary-base text-xs font-semibold px-2.5 py-1 rounded-full">
                                                    {(student.japanese_level as string) ?? "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-neutral-70">
                                                {student.class_code ? (
                                                    <span className="font-semibold">{student.class_code as string} · {student.class_name as string}</span>
                                                ) : (
                                                    <span className="text-neutral-30">Belum ada kelas aktif</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge.className}`}>{statusBadge.label}</span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-neutral-60">
                                                {formatDate(student.activated_at as Date | null)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col items-start gap-2">
                                                    {student.pre_student_id ? (
                                                        <Link href={`/dashboard/pre-students/${student.pre_student_id}`} className="text-xs font-semibold text-primary-base hover:underline">Detail</Link>
                                                    ) : null}
                                                    <StudentRowActions
                                                        studentId={student.id as number}
                                                        status={(student.status as StudentStatus) ?? "active"}
                                                        currentClassId={student.class_id ? Number(student.class_id) : null}
                                                        classes={classOptions}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-20">
                    <p className="text-sm text-neutral-50">
                        Menampilkan{" "}
                        <span className="font-semibold text-neutral-80">
                            {students.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + students.length}
                        </span>{" "}
                        dari <span className="font-semibold text-neutral-80">{new Intl.NumberFormat("id-ID").format(total)}</span> siswa
                    </p>
                    <div className="flex items-center gap-1.5">
                        <a
                            href={buildUrl({ page: Math.max(1, page - 1) })}
                            aria-disabled={page === 1}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-20 text-neutral-50 transition-all ${page === 1 ? "opacity-40 pointer-events-none" : "hover:bg-neutral-10"}`}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </a>
                        {page > 3 && (
                            <>
                                <a href={buildUrl({ page: 1 })} className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-20 text-sm font-medium text-neutral-60 hover:bg-neutral-10 transition-all">1</a>
                                {page > 4 && <span className="text-neutral-40 text-sm px-1">…</span>}
                            </>
                        )}
                        {pageNumbers.map((p) => (
                            <a
                                key={p}
                                href={buildUrl({ page: p })}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${p === page ? "bg-primary-base text-absolute-white" : "border border-neutral-20 text-neutral-60 hover:bg-neutral-10"}`}
                            >
                                {p}
                            </a>
                        ))}
                        {page < totalPages - 2 && (
                            <>
                                {page < totalPages - 3 && <span className="text-neutral-40 text-sm px-1">…</span>}
                                <a href={buildUrl({ page: totalPages })} className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-20 text-sm font-medium text-neutral-60 hover:bg-neutral-10 transition-all">{totalPages}</a>
                            </>
                        )}
                        <a
                            href={buildUrl({ page: Math.min(totalPages, page + 1) })}
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
