"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Question = { id: number; text: string; options: string[]; selectedValue: string | null };
type Attempt = {
    id: number; status: "in_progress" | "completed"; score: number;
    passStatus: "pending" | "passed" | "failed"; startedAt: string;
    testTitle: string; passScore: number; timeLimitMinutes: number;
};

const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function TestRunnerPage() {
    const params = useParams<{ attemptId: string }>();
    const attemptId = Number(params.attemptId);
    const router = useRouter();
    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [finishing, setFinishing] = useState(false);
    const [result, setResult] = useState<{ score: number; passStatus: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/tests/attempts/${attemptId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setAttempt(data.data.attempt);
            setQuestions(data.data.questions);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Gagal memuat tes");
        } finally { setLoading(false); }
    }, [attemptId]);
    useEffect(() => { void load(); }, [load]);

    async function selectAnswer(questionId: number, value: string) {
        setQuestions((current) => current.map((q) => (q.id === questionId ? { ...q, selectedValue: value } : q)));
        await fetch(`/api/tests/attempts/${attemptId}/answer`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId, selectedValue: value }),
        });
    }

    async function finish() {
        if (!window.confirm("Selesaikan tes sekarang? Jawaban tidak dapat diubah setelah ini.")) return;
        setFinishing(true);
        const response = await fetch(`/api/tests/attempts/${attemptId}/finish`, { method: "POST" });
        const data = await response.json();
        setFinishing(false);
        if (!response.ok) { setError(data.error || "Gagal menyelesaikan tes"); return; }
        setResult(data);
    }

    if (loading) return <p className="py-16 text-center">Memuat tes...</p>;
    if (error && !attempt) return <div className="mx-auto max-w-2xl px-4 py-10"><div role="alert" className="rounded-xl bg-error-10 p-4 text-error-base">{error}</div></div>;
    if (!attempt) return null;

    const passed = result ? result.passStatus === "passed" : attempt.passStatus === "passed";
    const showResult = result || attempt.status === "completed";

    if (showResult) {
        const score = result?.score ?? attempt.score;
        return (
            <div className="mx-auto max-w-xl space-y-6 px-4 py-10 text-center">
                <div className={`portal-card p-10 ${passed ? "bg-success-10" : "bg-error-10"}`}>
                    <p className="text-5xl" aria-hidden="true">{passed ? "🎉" : "😔"}</p>
                    <h1 className="mt-4 text-2xl font-black">{passed ? "Selamat, kamu lolos!" : "Belum lolos"}</h1>
                    <p className="mt-2 text-lg font-bold">{score}% <span className="text-sm font-normal text-neutral-50">(minimal {attempt.passScore}%)</span></p>
                    <p className="mt-4 text-sm text-neutral-60">
                        {passed
                            ? "Lanjutkan ke halaman pembayaran untuk mengaktifkan kelasmu."
                            : "Jangan menyerah — kamu bisa mencoba tes kelas lain kapan saja."}
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        {passed
                            ? <Link href="/dashboard/payment" className="btn">Lanjut ke pembayaran</Link>
                            : <Link href="/dashboard" className="btn">Kembali ke dashboard</Link>}
                        <Link href={passed ? "/dashboard/tests/history" : "/dashboard/class-catalog"} className="rounded-xl border border-neutral-20 px-5 py-3 text-sm font-bold text-neutral-70">
                            {passed ? "Lihat riwayat tes" : "Coba tes kelas lain"}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const answeredCount = questions.filter((q) => q.selectedValue).length;

    return (
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-8">
            <section className="portal-card p-6">
                <h1 className="text-xl font-black text-[#14213d]">{attempt.testTitle}</h1>
                <p className="mt-1 text-sm text-neutral-50">{answeredCount}/{questions.length} soal terjawab · batas waktu {attempt.timeLimitMinutes} menit</p>
            </section>
            {error && <div role="alert" className="rounded-xl bg-error-10 p-4 text-error-base">{error}</div>}
            <div className="space-y-4">
                {questions.map((question, index) => (
                    <article key={question.id} className="portal-card p-6">
                        <p className="font-bold text-neutral-80">{index + 1}. {question.text}</p>
                        <div className="mt-4 space-y-2">
                            {question.options.map((option, optionIndex) => {
                                const letter = OPTION_LETTERS[optionIndex];
                                const active = question.selectedValue === letter;
                                return (
                                    <label key={letter} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${active ? "border-primary-base bg-primary-10 font-bold text-primary-base" : "border-neutral-20"}`}>
                                        <input type="radio" name={`question-${question.id}`} className="sr-only" checked={active} onChange={() => selectAnswer(question.id, letter)} />
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">{letter}</span>
                                        {option}
                                    </label>
                                );
                            })}
                        </div>
                    </article>
                ))}
            </div>
            <button onClick={finish} disabled={finishing} className="btn w-full">{finishing ? "Menyimpan..." : "Selesaikan tes"}</button>
        </div>
    );
}
