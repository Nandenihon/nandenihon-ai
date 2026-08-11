"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type ClassTestInfo = {
    id: number;
    code: string;
    name: string;
    level: string | null;
    status: string;
    testPassScore: number;
    testTimeLimitMinutes: number;
    testQuestionCount: number;
    availableQuestions: number;
};

export default function ClassTestInfoPage() {
    const params = useParams<{ classId: string }>();
    const classId = Number(params.classId);
    const router = useRouter();
    const [info, setInfo] = useState<ClassTestInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [starting, setStarting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/tests/class/${classId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setInfo(data.data);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Gagal memuat informasi tes");
        } finally { setLoading(false); }
    }, [classId]);
    useEffect(() => { void load(); }, [load]);

    async function start() {
        setStarting(true);
        setError("");
        const response = await fetch(`/api/tests/class/${classId}/start`, { method: "POST" });
        const data = await response.json();
        setStarting(false);
        if (!response.ok) { setError(data.error || "Tidak dapat memulai tes"); return; }
        router.push(`/dashboard/tests/${data.attemptId}`);
    }

    if (loading) return <p className="py-16 text-center">Memuat...</p>;
    if (error && !info) return <div className="mx-auto max-w-2xl px-4 py-10"><div role="alert" className="rounded-xl bg-error-10 p-4 text-error-base">{error}</div></div>;
    if (!info) return null;

    const notEnoughQuestions = info.availableQuestions < info.testQuestionCount;

    return (
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-8">
            <Link href="/dashboard/class-catalog" className="text-sm font-semibold text-primary-base">← Kembali ke katalog kelas</Link>

            <section className="rounded-[1.75rem] bg-gradient-to-br from-[#142d63] to-primary-70 p-7 text-center text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-200">{info.code} · {info.level}</p>
                <h1 className="mt-2 text-2xl font-black sm:text-3xl">Informasi &amp; Aturan Tes {info.name}</h1>
                <p className="mt-2 text-sm text-blue-100">Tes ini bertujuan untuk mengukur kemampuan dasar bahasa Jepang kamu sebelum mengikuti kelas.</p>
            </section>

            {error && <div role="alert" className="rounded-xl bg-error-10 p-4 text-error-base">{error}</div>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="portal-card p-5 text-center">
                    <p className="text-2xl">⏱️</p>
                    <p className="mt-2 text-lg font-black text-[#14213d]">{info.testTimeLimitMinutes} Menit</p>
                    <p className="text-xs text-neutral-50">Durasi Tes</p>
                </div>
                <div className="portal-card p-5 text-center">
                    <p className="text-2xl">📝</p>
                    <p className="mt-2 text-lg font-black text-[#14213d]">{info.testQuestionCount} Soal</p>
                    <p className="text-xs text-neutral-50">Pilihan Ganda</p>
                </div>
                <div className="portal-card p-5 text-center">
                    <p className="text-2xl">🎯</p>
                    <p className="mt-2 text-lg font-black text-[#14213d]">Skor ≥ {info.testPassScore}</p>
                    <p className="text-xs text-neutral-50">Syarat Lulus</p>
                </div>
            </div>

            <div className="rounded-2xl border-l-4 border-warning-base bg-warning-10 p-5">
                <p className="font-bold text-neutral-80">Komitmen &amp; Donasi</p>
                <p className="mt-1 text-sm text-neutral-60">
                    Jika kamu dinyatakan <strong>LULUS</strong>, akan dikenakan kontribusi sebagai donasi sosial dan operasional Nande Nihon.
                    Dana dikelola secara transparan untuk mendukung program edukasi dan kegiatan sosial. Nominal dapat dilihat di halaman pembayaran setelah lolos.
                </p>
            </div>

            <div className="portal-card p-6">
                <p className="font-bold text-neutral-80">Syarat &amp; Ketentuan</p>
                <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-neutral-60">
                    <li>Peserta wajib mengerjakan soal secara mandiri dan jujur.</li>
                    <li>Waktu akan berjalan otomatis saat tombol &quot;Mulai Tes&quot; ditekan.</li>
                    <li>Jawaban tersimpan otomatis setiap kamu memilih opsi.</li>
                    <li>Keputusan hasil tes tidak dapat diganggu gugat.</li>
                    <li>Kontribusi yang sudah dibayarkan tidak dapat dikembalikan.</li>
                </ul>
            </div>

            {notEnoughQuestions ? (
                <p className="rounded-xl bg-error-10 p-4 text-center text-sm text-error-base">Bank soal untuk kelas ini belum siap. Coba lagi nanti atau hubungi admin.</p>
            ) : (
                <button onClick={start} disabled={starting} className="btn w-full">
                    {starting ? "Memulai..." : "Saya Mengerti & Mulai Tes"}
                </button>
            )}
        </div>
    );
}
