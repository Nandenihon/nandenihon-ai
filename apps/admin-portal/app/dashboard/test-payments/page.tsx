"use client";

import { useCallback, useEffect, useState } from "react";

type Payment = {
    id: number; amount: number; proof_url: string; status: string;
    score: number; test_title: string; class_name: string; class_code: string;
    applicant_name: string; applicant_email: string; created_at: string;
};

export default function TestPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const response = await fetch("/api/enrollment/test-payments");
        const data = await response.json();
        if (response.ok) setPayments(data.data ?? []);
        else setMessage(data.error || "Gagal memuat data");
        setLoading(false);
    }, []);
    useEffect(() => { void load(); }, [load]);

    async function decide(payment: Payment, action: "verify" | "reject") {
        let reason = "";
        if (action === "reject") {
            reason = window.prompt("Alasan penolakan:")?.trim() ?? "";
            if (!reason) return;
        } else if (!window.confirm(`Verifikasi pembayaran ${payment.applicant_name} untuk kelas ${payment.class_name}? Siswa akan langsung diaktifkan.`)) {
            return;
        }
        const response = await fetch(`/api/enrollment/test-payments/${payment.id}/decision`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason }),
        });
        const data = await response.json();
        setMessage(data.error || data.message);
        if (response.ok) await load();
    }

    return (
        <div className="space-y-6">
            <header className="rounded-2xl bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-bold">Verifikasi Pembayaran</h1>
                <p className="text-sm text-neutral-50">Calon siswa yang lolos tes penempatan dan menunggu verifikasi bukti pembayaran.</p>
            </header>
            {message && <div className="rounded-xl bg-primary-10 p-4 text-primary-base">{message}</div>}
            {loading ? (
                <p className="py-10 text-center text-neutral-50">Memuat...</p>
            ) : payments.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center text-neutral-50">Tidak ada pembayaran yang menunggu verifikasi.</div>
            ) : (
                <div className="space-y-3">
                    {payments.map((payment) => (
                        <article key={payment.id} className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                            <div className="flex-1">
                                <p className="text-xs font-bold text-primary-base">{payment.class_code} · {payment.class_name}</p>
                                <h3 className="mt-1 text-lg font-bold">{payment.applicant_name}</h3>
                                <p className="text-sm text-neutral-50">{payment.applicant_email} · Skor tes {payment.score}%</p>
                                <p className="mt-1 text-sm font-semibold">Rp {Number(payment.amount).toLocaleString("id-ID")}</p>
                                <a href={payment.proof_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-primary-base underline">Lihat bukti pembayaran</a>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => decide(payment, "verify")} className="rounded-xl bg-primary-base px-4 py-2 text-sm font-bold text-white">Verifikasi</button>
                                <button onClick={() => decide(payment, "reject")} className="rounded-xl bg-error-10 px-4 py-2 text-sm font-bold text-error-base">Tolak</button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
