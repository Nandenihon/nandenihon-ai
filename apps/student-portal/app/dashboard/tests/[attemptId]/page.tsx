"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Question = { id: number; text: string; options: string[]; selectedValue: string | null };
type Attempt = {
    id: number; status: "in_progress" | "completed"; score: number;
    passStatus: "pending" | "passed" | "failed"; startedAt: string;
    className: string; passScore: number; timeLimitMinutes: number;
};

const OPTION_LETTERS = ["A", "B", "C", "D"];

function formatClock(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function TestRunnerPage() {
    const params = useParams<{ attemptId: string }>();
    const attemptId = Number(params.attemptId);
    const router = useRouter();
    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [finishing, setFinishing] = useState(false);
    const [result, setResult] = useState<{ score: number; passStatus: string } | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const finishingRef = useRef(false);

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

    const finish = useCallback(async (auto = false) => {
        if (finishingRef.current) return;
        if (!auto && !window.confirm("Selesaikan tes sekarang? Jawaban tidak dapat diubah setelah ini.")) return;
        finishingRef.current = true;
        setFinishing(true);
        const response = await fetch(`/api/tests/attempts/${attemptId}/finish`, { method: "POST" });
        const data = await response.json();
        setFinishing(false);
        if (!response.ok) {
            finishingRef.current = false;
            setError(data.error || "Gagal menyelesaikan tes");
            return;
        }
        setResult(data);
    }, [attemptId]);

    // Countdown timer, based on the class's configured time limit — auto-submits when it hits zero.
    useEffect(() => {
        if (!attempt || attempt.status !== "in_progress") return;
        const deadline = new Date(attempt.startedAt).getTime() + attempt.timeLimitMinutes * 60_000;

        const tick = () => {
            const secs = Math.max(0, Math.round((deadline - Date.now()) / 1000));
            setRemainingSeconds(secs);
            if (secs <= 0) void finish(true);
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [attempt, finish]);

    async function selectAnswer(questionId: number, value: string) {
        setQuestions((current) => current.map((q) => (q.id === questionId ? { ...q, selectedValue: value } : q)));
        await fetch(`/api/tests/attempts/${attemptId}/answer`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId, selectedValue: value }),
        });
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

    const question = questions[currentIndex];
    const answeredCount = questions.filter((q) => q.selectedValue).length;
    const isLast = currentIndex === questions.length - 1;
    const lowTime = remainingSeconds !== null && remainingSeconds <= 60;

    return (
        <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:px-8">
            <section className="portal-card p-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-black text-[#14213d]">Tes Penempatan {attempt.className}</h1>
                        <p className="mt-0.5 text-xs text-neutral-50">Soal {currentIndex + 1} dari {questions.length} · {answeredCount} terjawab</p>
                    </div>
                    {remainingSeconds !== null && (
                        <div
                            className={`shrink-0 rounded-xl px-4 py-2 text-center font-mono text-lg font-black ${lowTime ? "bg-error-10 text-error-base" : "bg-primary-10 text-primary-base"}`}
                            role="timer"
                            aria-live="polite"
                            aria-label={`Sisa waktu ${formatClock(remainingSeconds)}`}
                        >
                            {formatClock(remainingSeconds)}
                        </div>
                    )}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-10">
                    <div className="h-full rounded-full bg-primary-base transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                </div>
            </section>

            {/* Quick question nav */}
            <div className="flex flex-wrap gap-1.5">
                {questions.map((q, index) => (
                    <button
                        key={q.id}
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`Soal ${index + 1}${q.selectedValue ? " (terjawab)" : ""}`}
                        aria-current={index === currentIndex ? "step" : undefined}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                            index === currentIndex
                                ? "bg-primary-base text-white"
                                : q.selectedValue
                                ? "bg-success-10 text-success-100"
                                : "bg-neutral-10 text-neutral-50"
                        }`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>

            {error && <div role="alert" className="rounded-xl bg-error-10 p-4 text-error-base">{error}</div>}

            {question && (
                <article className="portal-card p-6">
                    <p className="font-bold text-neutral-80">{question.text}</p>
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
            )}

            <div className="flex gap-3">
                <button
                    onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                    disabled={currentIndex === 0}
                    className="rounded-xl border border-neutral-20 px-5 py-3 text-sm font-bold text-neutral-70 disabled:opacity-40"
                >
                    ← Sebelumnya
                </button>
                {isLast ? (
                    <button onClick={() => finish()} disabled={finishing} className="btn flex-1">{finishing ? "Menyimpan..." : "Selesaikan tes"}</button>
                ) : (
                    <button onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))} className="btn flex-1">
                        Selanjutnya →
                    </button>
                )}
            </div>
        </div>
    );
}
