"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

const PAYMENT_AMOUNT = 50000;
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,application/pdf";

function formatFileSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PaymentPage() {
    const [passedAttempt, setPassedAttempt] = useState<PassedAttempt | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [qrisZoomed, setQrisZoomed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!qrisZoomed) return;
        const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setQrisZoomed(false); };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [qrisZoomed]);

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

    function pickFile(candidate: File | undefined | null) {
        if (!candidate) return;
        setFile(candidate);
    }

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!passedAttempt || !file) return;
        setSubmitting(true);
        setError(""); setNotice("");
        const body = new FormData();
        body.append("attemptId", String(passedAttempt.id));
        body.append("amount", String(PAYMENT_AMOUNT));
        body.append("file", file);
        const response = await fetch("/api/payment", { method: "POST", body });
        const data = await response.json();
        setSubmitting(false);
        if (!response.ok) { setError(data.error || "Gagal mengunggah bukti pembayaran"); return; }
        setNotice(data.message);
        setFile(null);
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
                        <p className="mt-1 text-2xl font-black text-primary-base">Rp{PAYMENT_AMOUNT.toLocaleString("id-ID")}</p>
                        <button
                            type="button"
                            onClick={() => setQrisZoomed(true)}
                            className="portal-focus relative mt-4 aspect-square w-full max-w-xs cursor-zoom-in overflow-hidden rounded-xl bg-white"
                            aria-label="Perbesar QRIS"
                        >
                            <Image src="/images/qris.png" alt="QRIS Nande Nihon" fill className="object-contain p-2" />
                        </button>
                        <div className="mt-4 flex items-center gap-3">
                            <a href="/images/qris.png" download="qris-nandenihon.png" className="inline-flex items-center gap-2 rounded-xl border border-primary-20 px-4 py-2 text-xs font-bold text-primary-base hover:bg-primary-10">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M12 3V16M12 16L7 11M12 16L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M4 18V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Download QRIS
                            </a>
                        </div>
                        <p className="mt-4 max-w-sm text-xs text-neutral-50">Lakukan pembayaran melalui QRIS di atas menggunakan e-wallet atau m-banking apa pun, lalu unggah bukti pembayarannya di bawah ini.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <p className="mb-2 text-sm font-semibold text-neutral-70">Bukti pembayaran (JPG/PNG/PDF, maks 5MB)</p>
                            <label
                                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={(e) => {
                                    e.preventDefault(); setDragActive(false);
                                    pickFile(e.dataTransfer.files?.[0]);
                                }}
                                className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                                    dragActive ? "border-primary-base bg-primary-10" : "border-neutral-20 bg-neutral-5 hover:border-primary-40 hover:bg-primary-10/40"
                                }`}
                            >
                                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-10 text-primary-base" aria-hidden="true">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 16V4M12 4L7 9M12 4L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                {file ? (
                                    <>
                                        <p className="text-sm font-bold text-neutral-80">{file.name}</p>
                                        <p className="text-xs text-neutral-50">{formatFileSize(file.size)} · Klik untuk ganti file</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-bold text-neutral-80">Klik untuk pilih file atau tarik ke sini</p>
                                        <p className="text-xs text-neutral-50">JPG, PNG, WebP, atau PDF · maks. 5MB</p>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    required
                                    type="file"
                                    accept={ACCEPTED_TYPES}
                                    className="sr-only"
                                    onChange={(e) => pickFile(e.target.files?.[0])}
                                />
                            </label>
                            {file && (
                                <button type="button" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="mt-2 text-xs font-semibold text-neutral-50 hover:text-error-base">
                                    Hapus file
                                </button>
                            )}
                        </div>
                        <button disabled={submitting || !file} className="btn w-full">{submitting ? "Mengunggah..." : "Kirim bukti pembayaran"}</button>
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

            {qrisZoomed && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Preview QRIS"
                    onClick={() => setQrisZoomed(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
                >
                    <button
                        type="button"
                        onClick={() => setQrisZoomed(false)}
                        aria-label="Tutup preview"
                        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <div onClick={(e) => e.stopPropagation()} className="relative aspect-square w-full max-w-md overflow-hidden rounded-2xl bg-white p-4">
                        <Image src="/images/qris.png" alt="QRIS Nande Nihon diperbesar" fill className="object-contain p-4" />
                    </div>
                </div>
            )}
        </div>
    );
}
