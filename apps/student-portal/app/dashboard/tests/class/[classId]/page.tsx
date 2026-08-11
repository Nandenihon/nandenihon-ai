"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type TestItem = {
    id: number; title: string; instructions: string | null;
    pass_score: number; time_limit_minutes: number;
};

export default function ClassTestsPage() {
    const params = useParams<{ classId: string }>();
    const classId = Number(params.classId);
    const router = useRouter();
    const [tests, setTests] = useState<TestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [starting, setStarting] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/tests?classId=${classId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setTests(data.data ?? []);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Gagal memuat tes");
        } finally { setLoading(false); }
    }, [classId]);
    useEffect(() => { void load(); }, [load]);

    async function start(test: TestItem) {
        setStarting(test.id);
        setError("");
        const response = await fetch(`/api/tests/${test.id}/start`, { method: "POST" });
        const data = await response.json();
        setStarting(null);
        if (!response.ok) { setError(data.error || "Tidak dapat memulai tes"); return; }
        router.push(`/dashboard/tests/${data.attemptId}`);
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-8">
            <Link href="/dashboard/class-catalog" className="text-sm font-semibold text-primary-base">← Kembali ke katalog kelas</Link>
            <section className="rounded-[1.75rem] bg-gradient-to-br from-[#142d63] to-primary-70 p-7 text-white">
                <h1 className="text-2xl font-black">Tes penempatan kelas ini</h1>
                <p className="mt-2 text-sm text-blue-100">Kerjakan salah satu tes di bawah. Hasil tes akan tersimpan di riwayat, baik lolos maupun tidak.</p>
            </section>
            {error && <div role="alert" className="rounded-xl bg-error-10 p-4 text-error-base">{error}</div>}
            {loading ? <p className="py-10 text-center">Memuat tes...</p> : tests.length === 0 ? (
                <p className="portal-card p-10 text-center text-neutral-50">Belum ada tes yang dipublikasikan untuk kelas ini.</p>
            ) : (
                <div className="space-y-4">
                    {tests.map((test) => (
                        <article key={test.id} className="portal-card p-6">
                            <h2 className="text-lg font-black text-[#14213d]">{test.title}</h2>
                            {test.instructions && <p className="mt-2 text-sm text-neutral-60">{test.instructions}</p>}
                            <p className="mt-3 text-xs font-semibold text-neutral-40">Lulus ≥ {test.pass_score}% · Batas waktu {test.time_limit_minutes} menit</p>
                            <button onClick={() => start(test)} disabled={starting === test.id} className="btn mt-4 w-full">
                                {starting === test.id ? "Memulai..." : "Mulai tes"}
                            </button>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
