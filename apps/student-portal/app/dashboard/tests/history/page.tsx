"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Attempt = {
    id: number; status: string; score: number; pass_status: string;
    started_at: string; submitted_at: string | null;
    class_name: string; class_code: string;
};

const PASS_STATUS_LABEL: Record<string, { label: string; className: string }> = {
    passed: { label: "Lolos", className: "bg-success-10 text-success-100" },
    failed: { label: "Tidak lolos", className: "bg-error-10 text-error-base" },
    pending: { label: "Sedang berjalan", className: "bg-neutral-10 text-neutral-60" },
};

export default function TestHistoryPage() {
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        void (async () => {
            try {
                const response = await fetch("/api/tests/history");
                const data = await response.json();
                if (!response.ok) throw new Error(data.error);
                setAttempts(data.data ?? []);
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "Gagal memuat riwayat");
            } finally { setLoading(false); }
        })();
    }, []);

    return (
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-8">
            <section className="rounded-[1.75rem] bg-gradient-to-br from-[#142d63] to-primary-70 p-7 text-white">
                <h1 className="text-2xl font-black">Riwayat Tes</h1>
                <p className="mt-2 text-sm text-blue-100">Semua tes yang pernah kamu kerjakan tersimpan di sini, termasuk yang belum lolos.</p>
            </section>
            {error && <div role="alert" className="rounded-xl bg-error-10 p-4 text-error-base">{error}</div>}
            {loading ? <p className="py-10 text-center">Memuat riwayat...</p> : attempts.length === 0 ? (
                <div className="portal-card p-10 text-center">
                    <p className="text-neutral-50">Belum ada tes yang dikerjakan.</p>
                    <Link href="/dashboard/class-catalog" className="btn mt-4 inline-block">Pilih kelas &amp; mulai tes</Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {attempts.map((attempt) => {
                        const status = PASS_STATUS_LABEL[attempt.pass_status] ?? PASS_STATUS_LABEL.pending;
                        return (
                            <article key={attempt.id} className="portal-card flex items-center justify-between gap-4 p-5">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-primary-base">{attempt.class_code}</p>
                                    <p className="truncate font-bold text-neutral-80">Tes Penempatan {attempt.class_name}</p>
                                    <p className="text-xs text-neutral-40">
                                        {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(attempt.submitted_at ?? attempt.started_at))}
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    {attempt.status === "completed" && <p className="text-lg font-black text-[#14213d]">{attempt.score}%</p>}
                                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
