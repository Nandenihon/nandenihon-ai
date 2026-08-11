export const dynamic = "force-dynamic";

import Link from "next/link";
import { findPreStudentDetail } from "@repo/database";

interface DetailPageProps {
    params: Promise<{ id: string }>;
}

function formatDateTime(date: Date | string | null): string {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(date));
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
    pending: { label: "Sedang Berjalan", className: "bg-primary-10 text-primary-base" },
};

const PAYMENT_STATUS_BADGE: Record<string, { label: string; className: string }> = {
    verified: { label: "Terverifikasi", className: "bg-success-10 text-success-base" },
    pending: { label: "Menunggu", className: "bg-warning-10 text-warning-100" },
    rejected: { label: "Ditolak", className: "bg-error-10 text-error-base" },
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-semibold text-neutral-40 uppercase tracking-wide">{label}</dt>
            <dd className="mt-1 text-sm text-neutral-80">{value || "-"}</dd>
        </div>
    );
}

export default async function PreStudentDetailPage({ params }: DetailPageProps) {
    const { id } = await params;
    const preStudentId = Number(id);

    let detail: Awaited<ReturnType<typeof findPreStudentDetail>> | null = null;
    let error = "";
    try {
        detail = await findPreStudentDetail(preStudentId);
    } catch {
        error = "Gagal memuat detail calon siswa";
    }

    if (error) {
        return <div className="rounded-xl bg-error-10 p-4 text-sm text-error-base">{error}</div>;
    }
    if (!detail) {
        return (
            <div className="rounded-2xl bg-absolute-white border border-neutral-20 p-10 text-center text-sm text-neutral-50">
                Calon siswa tidak ditemukan.
                <div className="mt-4"><Link href="/dashboard/pre-students" className="text-primary-base font-semibold hover:underline">← Kembali ke daftar</Link></div>
            </div>
        );
    }

    const { profile, attempts, payments } = detail;
    const role = ROLE_BADGE[profile.current_role as string] ?? ROLE_BADGE.pre_student;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <Link href="/dashboard/pre-students" className="text-sm font-semibold text-primary-base hover:underline">← Kembali ke daftar</Link>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-primary-80 to-primary-base p-6 text-absolute-white shadow-sm">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold flex-shrink-0">
                            {String(profile.full_name).charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black">{profile.full_name}</h1>
                            <p className="text-sm text-blue-100">{profile.nickname} · {profile.email}</p>
                        </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${role.className}`}>{role.label}</span>
                </div>
            </div>

            {/* Full profile data */}
            <section className="rounded-2xl bg-absolute-white border border-neutral-20 p-6">
                <h2 className="text-lg font-bold text-neutral-90 mb-4">Data Lengkap</h2>
                <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Nama lengkap" value={profile.full_name} />
                    <Field label="Nama panggilan" value={profile.nickname} />
                    <Field label="Email" value={profile.email} />
                    <Field label="No. HP" value={profile.phone_number} />
                    <Field label="Domisili" value={profile.domicile} />
                    <Field label="Level bahasa Jepang" value={profile.japanese_level} />
                    <Field label="Email terverifikasi" value={formatDateTime(profile.email_verified_at as Date | null)} />
                    <Field label="Pendaftaran selesai" value={formatDateTime(profile.registration_completed_at as Date | null)} />
                    <Field label="Bergabung" value={formatDateTime(profile.created_at as Date)} />
                    <Field label="User ID (setelah promosi)" value={profile.promoted_user_id ? `#${profile.promoted_user_id}` : "Belum dipromosikan"} />
                    <Field label="Motivasi" value={<span className="whitespace-pre-wrap">{profile.motivation}</span>} />
                </dl>
            </section>

            {/* Nilai / test attempts */}
            <section className="rounded-2xl bg-absolute-white border border-neutral-20 overflow-hidden">
                <div className="p-6 pb-0">
                    <h2 className="text-lg font-bold text-neutral-90">Riwayat Nilai Tes</h2>
                    <p className="text-sm text-neutral-50">Semua tes yang pernah dikerjakan, termasuk yang belum lolos.</p>
                </div>
                <div className="overflow-x-auto mt-4">
                    <table className="w-full">
                        <thead className="bg-neutral-0 border-b border-neutral-20">
                            <tr>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-6 py-3">Kelas</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3">Tes</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3">Nilai</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3">Status</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3">Selesai</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-10">
                            {attempts.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-50">Belum ada tes yang dikerjakan.</td></tr>
                            ) : (
                                attempts.map((attempt) => {
                                    const badge = PASS_STATUS_BADGE[attempt.pass_status as string] ?? PASS_STATUS_BADGE.pending;
                                    return (
                                        <tr key={attempt.id} className="hover:bg-neutral-0 transition-colors">
                                            <td className="px-6 py-3 text-sm font-semibold text-neutral-80">{attempt.class_code} · {attempt.class_name}</td>
                                            <td className="px-4 py-3 text-sm text-neutral-60">{attempt.test_title}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-neutral-80">{attempt.status === "completed" ? `${attempt.score}%` : "-"}</td>
                                            <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>{badge.label}</span></td>
                                            <td className="px-4 py-3 text-sm text-neutral-60">{formatDateTime(attempt.submitted_at as Date | null)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Pembayaran */}
            <section className="rounded-2xl bg-absolute-white border border-neutral-20 overflow-hidden">
                <div className="p-6 pb-0">
                    <h2 className="text-lg font-bold text-neutral-90">Riwayat Pembayaran</h2>
                </div>
                <div className="overflow-x-auto mt-4">
                    <table className="w-full">
                        <thead className="bg-neutral-0 border-b border-neutral-20">
                            <tr>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-6 py-3">Kelas</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3">Jumlah</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3">Status</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3">Bukti</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3">Diajukan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-10">
                            {payments.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-50">Belum ada pembayaran.</td></tr>
                            ) : (
                                payments.map((payment) => {
                                    const badge = PAYMENT_STATUS_BADGE[payment.status as string] ?? PAYMENT_STATUS_BADGE.pending;
                                    return (
                                        <tr key={payment.id} className="hover:bg-neutral-0 transition-colors">
                                            <td className="px-6 py-3 text-sm font-semibold text-neutral-80">{payment.class_code} · {payment.class_name}</td>
                                            <td className="px-4 py-3 text-sm text-neutral-70">{formatCurrency(payment.amount)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>{badge.label}</span>
                                                {payment.rejection_reason && <p className="mt-1 text-xs text-error-base">{payment.rejection_reason}</p>}
                                            </td>
                                            <td className="px-4 py-3"><a href={payment.proof_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary-base hover:underline">Lihat bukti</a></td>
                                            <td className="px-4 py-3 text-sm text-neutral-60">{formatDateTime(payment.created_at as Date)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
