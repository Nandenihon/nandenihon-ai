"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type PassedAttempt = {
    id: number; class_name: string; class_code: string; score: number;
};
type Payment = {
    id: number; status: "pending" | "verified" | "rejected"; amount: number;
    proof_url: string; rejection_reason: string | null; class_name: string; class_code: string;
    created_at: string;
};

const STATUS_LABEL: Record<Payment["status"], { label: string; className: string }> = {
    pending: { label: "Menunggu verifikasi", className: "bg-warning-10 text-warning-100" },
    verified: { label: "Terverifikasi", className: "bg-success-10 text-success-100" },
    rejected: { label: "Ditolak", className: "bg-error-10 text-error-base" },
};

export default function PaymentPage() {
    const [passedAttempt, setPassedAttempt] = useState<PassedAttempt | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [amount, setAmount] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/payment");
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setPassedAttempt(data.passedAttempt);
            setPayments(data.payments ?? []);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Gagal memuat data pembayaran");
        } finally { setLoading(false); }
    }, []);
    useEffect(() => { void load(); }, [load]);

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!passedAttempt || !file) return;
        setSubmitting(true);
        setError(""); setNotice("");
        const body = new FormData();
        body.append("attemptId", String(passedAttempt.id));
        body.append("amount", amount);
        body.append("file", file);
        const response = await fetch("/api/payment", { method: "POST", body });
        const data = await response.json();
        setSubmitting(false);
        if (!response.ok) { setError(data.error || "Gagal mengunggah bukti pembayaran"); return; }
        setNotice(data.message);
        setAmount(""); setFile(null);
        await load();
    }

    if (loading) return <p className="py-16 text-center">Memuat...</p>;

    return (
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-8">
            <section className="rounded-[1.75rem] bg-gradient-to-br from-[#142d63] to-primary-70 p-7 text-white">
                <h1 className="text-2xl font-black">Pembayaran</h1>
                <p className="mt-2 text-sm text-blue-100">Upload bukti pembayaran setelah lolos tes penempatan. Kelas aktif setelah admin memverifikasi.</p>
            </section>
            {error && <div role="alert" className="rounded-xl bg-error-10 p-4 text-error-base">{error}</div>}
            {notice && <div role="status" className="rounded-xl bg-success-10 p-4 text-success-100">{notice}</div>}

            {passedAttempt ? (
                <div className="portal-card space-y-6 p-6">
                    <div>
                        <p className="text-xs font-bold text-primary-base">{passedAttempt.class_code}</p>
                        <h2 className="text-lg font-black text-[#14213d]">{passedAttempt.class_name}</h2>
                        <p className="text-sm text-neutral-50">Lolos tes penempatan dengan skor {passedAttempt.score}%</p>
                    </div>

                    <div className="flex flex-col items-center rounded-2xl bg-neutral-5 p-6 text-center">
                        <p className="text-sm font-bold text-neutral-70">Scan QRIS untuk membayar</p>
                        <div className="relative mt-4 aspect-square w-full max-w-xs overflow-hidden rounded-xl bg-white">
                            <Image src="/images/qris.png" alt="QRIS Nande Nihon" fill className="object-contain p-2" />
                        </div>
                        <p className="mt-4 max-w-sm text-xs text-neutral-50">Lakukan pembayaran melalui QRIS di atas menggunakan e-wallet atau m-banking apa pun, lalu unggah bukti pembayarannya di bawah ini.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                    <label className="block text-sm font-semibold text-neutral-70">Jumlah pembayaran (Rp)
                        <input required type="number" min={1} className="mt-2 w-full rounded-xl border border-neutral-20 p-3" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </label>
                    <label className="block text-sm font-semibold text-neutral-70">Bukti pembayaran (JPG/PNG/PDF, maks 5MB)
                        <input required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="mt-2 w-full text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                    </label>
                    <button disabled={submitting} className="btn w-full">{submitting ? "Mengunggah..." : "Kirim bukti pembayaran"}</button>
                    </form>
                </div>
            ) : (
                <div className="portal-card p-8 text-center">
                    <p className="text-neutral-50">Belum ada tes yang lolos dan menunggu pembayaran.</p>
                    <Link href="/dashboard/class-catalog" className="btn mt-4 inline-block">Pilih kelas &amp; mulai tes</Link>
                </div>
            )}

            {payments.length > 0 && (
                <section className="space-y-3">
                    <h2 className="font-bold text-neutral-80">Riwayat pembayaran</h2>
                    {payments.map((payment) => {
                        const status = STATUS_LABEL[payment.status];
                        return (
                            <article key={payment.id} className="portal-card flex items-center justify-between gap-4 p-4">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-primary-base">{payment.class_code} · {payment.class_name}</p>
                                    <p className="text-sm font-semibold text-neutral-70">Rp {Number(payment.amount).toLocaleString("id-ID")}</p>
                                    {payment.rejection_reason && <p className="mt-1 text-xs text-error-base">{payment.rejection_reason}</p>}
                                </div>
                                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
                            </article>
                        );
                    })}
                </section>
            )}
        </div>
    );
}
