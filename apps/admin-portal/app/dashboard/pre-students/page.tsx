export const dynamic = "force-dynamic";

import Link from "next/link";
import { listPreStudentsOverview, type AttemptPassStatus, type PaymentStatus, type PreStudentOverviewStatus } from "@repo/database";
import FilterSelect from "@/app/components/FilterSelect";

interface PreStudentsPageProps {
    searchParams?: Promise<{ page?: string; search?: string; status?: string; passStatus?: string; paymentStatus?: string }>;
}

const PAGE_SIZE = 20;

function formatDate(date: Date | string | null): string {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(date));
}

function formatCurrency(amount: number | string | null): string {
    if (amount === null || amount === undefined) return "-";
    return `Rp ${Number(amount).toLocaleString("id-ID")}`;
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
    pre_student: { label: "Calon Siswa", className: "bg-warning-10 text-warning-100" },
    student: { label: "Siswa Aktif", className: "bg-success-10 text-success-base" },
};

const PASS_STATUS_BADGE: Record<string, { label: string; className: string }> = {
    passed: { label: "Lulus", className: "bg-success-10 text-success-base" },
    failed: { label: "Tidak Lulus", className: "bg-error-10 text-error-base" },
    pending: { label: "Sedang Tes", className: "bg-primary-10 text-primary-base" },
};

const PAYMENT_STATUS_BADGE: Record<string, { label: string; className: string }> = {
    verified: { label: "Terverifikasi", className: "bg-success-10 text-success-base" },
    pending: { label: "Menunggu", className: "bg-warning-10 text-warning-100" },
    rejected: { label: "Ditolak", className: "bg-error-10 text-error-base" },
};

export default async function PreStudentsPage({ searchParams }: PreStudentsPageProps) {
    const params = searchParams ? await searchParams : {};
    const page = Math.max(1, parseInt(params.page ?? "1", 10));
    const search = params.search ?? "";
    const status = (params.status ?? "") as PreStudentOverviewStatus | "";
    const passStatus = (params.passStatus ?? "") as AttemptPassStatus | "";
    const paymentStatus = (params.paymentStatus ?? "") as PaymentStatus | "";

    let result: Awaited<ReturnType<typeof listPreStudentsOverview>> | null = null;
    let error = "";
    try {
        result = await listPreStudentsOverview({
            search: search || undefined,
            status: status || undefined,
            passStatus: passStatus || undefined,
            paymentStatus: paymentStatus || undefined,
            page,
            pageSize: PAGE_SIZE,
        });
    } catch {
        error = "Gagal memuat data calon siswa";
    }

    const rows = result?.data ?? [];
    const total = result?.total ?? 0;
    const totalPages = result?.totalPages ?? 1;

    function buildUrl(overrides: Partial<{ page: number; status: string; passStatus: string; paymentStatus: string }>) {
        const p = new URLSearchParams();
        const next = { page, status, passStatus, paymentStatus, ...overrides };
        if (search) p.set("search", search);
        if (next.page > 1) p.set("page", String(next.page));
        if (next.status) p.set("status", next.status);
        if (next.passStatus) p.set("passStatus", next.passStatus);
        if (next.paymentStatus) p.set("paymentStatus", next.paymentStatus);
        return `/dashboard/pre-students${p.size > 0 ? `?${p}` : ""}`;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-wrap items-center gap-2">
                    <FilterSelect
                        options={[
                            { value: "", label: "Semua status" },
                            { value: "pre_student", label: "Calon Siswa" },
                            { value: "student", label: "Siswa Aktif" },
                        ]}
                        value={status}
                        buildUrl={buildUrl({ status: "__VALUE__", page: 1 })}
                    />
                    <FilterSelect
                        options={[
                            { value: "", label: "Semua nilai" },
                            { value: "passed", label: "Lulus" },
                            { value: "failed", label: "Tidak Lulus" },
                        ]}
                        value={passStatus}
                        buildUrl={buildUrl({ passStatus: "__VALUE__", page: 1 })}
                    />
                    <FilterSelect
                        options={[
                            { value: "", label: "Semua pembayaran" },
                            { value: "pending", label: "Menunggu" },
                            { value: "verified", label: "Terverifikasi" },
                        ]}
                        value={paymentStatus}
                        buildUrl={buildUrl({ paymentStatus: "__VALUE__", page: 1 })}
                    />
                </div>
                <form method="GET" action="/dashboard/pre-students" className="relative">
                    {status && <input type="hidden" name="status" value={status} />}
                    {passStatus && <input type="hidden" name="passStatus" value={passStatus} />}
                    {paymentStatus && <input type="hidden" name="paymentStatus" value={paymentStatus} />}
                    <input
                        type="search"
                        name="search"
                        defaultValue={search}
                        placeholder="Cari nama, email, no. HP..."
                        className="w-72 bg-absolute-white border border-neutral-20 rounded-xl py-2 px-4 text-sm text-neutral-70 placeholder:text-neutral-40 outline-none focus:border-primary-base transition-all"
                    />
                </form>
            </div>



            {error && <div className="rounded-xl bg-error-10 p-4 text-sm text-error-base">{error}</div>}

            <div className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-0 border-b border-neutral-20">
                            <tr>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-6 py-3.5">Calon Siswa</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Kontak</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Status</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Nilai Tes Terakhir</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Pembayaran</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Bergabung</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-10">
                            {rows.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-neutral-50">Belum ada data calon siswa.</td></tr>
                            ) : (
                                rows.map((row) => {
                                    const role = ROLE_BADGE[row.current_role as string] ?? ROLE_BADGE.pre_student;
                                    const passBadge = row.latest_pass_status ? PASS_STATUS_BADGE[row.latest_pass_status as string] : null;
                                    const paymentBadge = row.latest_payment_status ? PAYMENT_STATUS_BADGE[row.latest_payment_status as string] : null;
                                    return (
                                        <tr key={row.id} className="hover:bg-neutral-0 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary-20 flex items-center justify-center text-primary-base text-sm font-bold flex-shrink-0">
                                                        {String(row.full_name).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-neutral-80 truncate">{row.full_name}</p>
                                                        <p className="text-xs text-neutral-40 truncate">{row.nickname} · {row.japanese_level ?? "-"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-neutral-60">
                                                <p className="truncate max-w-[200px]">{row.email}</p>
                                                <p className="text-xs text-neutral-40">{row.phone_number ?? "-"}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${role.className}`}>{role.label}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {passBadge ? (
                                                    <div>
                                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${passBadge.className}`}>{passBadge.label}</span>
                                                        <p className="mt-1 text-xs text-neutral-50">{row.latest_score}% · {row.latest_class_name} · {Number(row.passed_attempts)}/{Number(row.total_attempts)} lulus</p>
                                                    </div>
                                                ) : <span className="text-xs text-neutral-40">Belum tes</span>}
                                            </td>
                                            <td className="px-4 py-4">
                                                {paymentBadge ? (
                                                    <div>
                                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${paymentBadge.className}`}>{paymentBadge.label}</span>
                                                        <p className="mt-1 text-xs text-neutral-50">{formatCurrency(row.latest_payment_amount)}</p>
                                                    </div>
                                                ) : <span className="text-xs text-neutral-40">Belum bayar</span>}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-neutral-60">{formatDate(row.created_at)}</td>
                                            <td className="px-4 py-4">
                                                <Link href={`/dashboard/pre-students/${row.id}`} className="text-xs font-semibold text-primary-base hover:underline">Detail</Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-20">
                    <p className="text-sm text-neutral-50">
                        Menampilkan <span className="font-semibold text-neutral-80">{rows.length}</span> dari{" "}
                        <span className="font-semibold text-neutral-80">{new Intl.NumberFormat("id-ID").format(total)}</span> calon siswa
                    </p>
                    <div className="flex items-center gap-1.5">
                        <a href={buildUrl({ page: Math.max(1, page - 1) })} aria-disabled={page === 1} className={`w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-20 text-neutral-50 transition-all ${page === 1 ? "opacity-40 pointer-events-none" : "hover:bg-neutral-10"}`}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        </a>
                        <span className="text-sm font-medium text-neutral-60 px-2">{page} / {totalPages}</span>
                        <a href={buildUrl({ page: Math.min(totalPages, page + 1) })} aria-disabled={page === totalPages} className={`w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-20 text-neutral-50 transition-all ${page === totalPages ? "opacity-40 pointer-events-none" : "hover:bg-neutral-10"}`}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
