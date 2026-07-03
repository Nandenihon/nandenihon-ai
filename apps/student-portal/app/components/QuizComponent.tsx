"use client";

import { useState } from "react";

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
}

interface QuizComponentProps {
    lessonId: number;
    lessonTitle: string;
    questions: QuizQuestion[];
    onFinish: (score: number) => void;
}

type Phase = "quiz" | "results";

export default function QuizComponent({
    lessonId,
    lessonTitle,
    questions,
    onFinish,
}: QuizComponentProps) {
    const [phase, setPhase] = useState<Phase>("quiz");
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
        Array(questions.length).fill(null)
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [error, setError] = useState("");

    const current = questions[currentIdx];
    const selected = selectedAnswers[currentIdx];
    const isLast = currentIdx === questions.length - 1;
    const answeredCount = selectedAnswers.filter((a) => a !== null).length;

    const handleSelect = (optionIdx: number) => {
        if (phase === "results") return;
        setSelectedAnswers((prev) => {
            const next = [...prev];
            next[currentIdx] = optionIdx;
            return next;
        });
    };

    const handleSubmit = async () => {
        const correct = selectedAnswers.filter(
            (answer, i) => answer === questions[i].correctIndex
        ).length;
        const score = Math.round((correct / questions.length) * 100);
        setFinalScore(score);
        setIsSubmitting(true);

        try {
            await fetch(`/api/lessons/${lessonId}/quiz`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score }),
            });
        } catch {
            // Non-blocking — results still shown
        } finally {
            setIsSubmitting(false);
        }

        setPhase("results");
        onFinish(score);
    };

    const handleRetry = () => {
        setPhase("quiz");
        setCurrentIdx(0);
        setSelectedAnswers(Array(questions.length).fill(null));
        setFinalScore(0);
    };

    if (questions.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-neutral-40">
                <p className="text-sm">Tidak ada soal untuk kuis ini.</p>
            </div>
        );
    }

    // ── Results Screen ─────────────────────────────────────────────────────────
    if (phase === "results") {
        const correct = selectedAnswers.filter((a, i) => a === questions[i].correctIndex).length;
        const passed = finalScore >= 70;

        return (
            <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
                {/* Score circle */}
                <div
                    className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 text-white font-black text-3xl shadow-2xl ${
                        passed
                            ? "bg-gradient-to-br from-success-base to-success-100 shadow-success-base/30"
                            : "bg-gradient-to-br from-warning-base to-warning-100 shadow-warning-base/30"
                    }`}
                >
                    {finalScore}
                    <span className="text-lg">%</span>
                </div>

                <h2 className="text-2xl font-bold text-neutral-90 mb-1">
                    {passed ? "Lulus! 🎉" : "Belum Lulus"}
                </h2>
                <p className="text-neutral-50 text-sm mb-2">
                    Kamu menjawab {correct} dari {questions.length} soal dengan benar
                </p>
                {!passed && (
                    <p className="text-xs text-neutral-40 mb-6">Nilai minimum lulus: 70%. Kamu bisa mencoba lagi!</p>
                )}

                {/* Answer review */}
                <div className="w-full max-w-lg text-left mt-4 space-y-3">
                    <p className="text-xs font-semibold text-neutral-40 uppercase tracking-wider">Review Jawaban</p>
                    {questions.map((q, i) => {
                        const userAnswer = selectedAnswers[i];
                        const isCorrect = userAnswer === q.correctIndex;
                        return (
                            <div
                                key={q.id}
                                className={`p-4 rounded-xl border text-sm ${
                                    isCorrect ? "border-success-20 bg-success-10" : "border-error-20 bg-error-10"
                                }`}
                            >
                                <p className="font-medium text-neutral-80 jp-text mb-2">{i + 1}. {q.question}</p>
                                <p className={`text-xs ${isCorrect ? "text-success-base" : "text-error-base"} font-semibold`}>
                                    {isCorrect ? "✓ Benar" : `✗ Jawaban kamu: ${userAnswer !== null ? q.options[userAnswer] : "—"}`}
                                </p>
                                {!isCorrect && (
                                    <p className="text-xs text-success-base mt-0.5">
                                        Jawaban benar: {q.options[q.correctIndex]}
                                    </p>
                                )}
                                {q.explanation && (
                                    <p className="text-xs text-neutral-50 mt-1 jp-text">{q.explanation}</p>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        id="btn-quiz-retry"
                        onClick={handleRetry}
                        className="btn-outline text-sm px-6 py-2.5"
                    >
                        Coba Lagi
                    </button>
                    <a href="./" className="btn text-sm px-6 py-2.5">
                        Kembali ke Kursus
                    </a>
                </div>
            </div>
        );
    }

    // ── Quiz Screen ────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full">
            {/* Progress bar */}
            <div className="px-6 pt-4 flex-shrink-0">
                <div className="flex items-center justify-between text-xs text-neutral-50 mb-2">
                    <span>Soal {currentIdx + 1} dari {questions.length}</span>
                    <span>{answeredCount} dijawab</span>
                </div>
                <div className="h-1.5 bg-neutral-10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary-base rounded-full transition-all duration-300"
                        style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="flex-1 px-6 py-6 overflow-y-auto">
                <p className="text-base font-semibold text-neutral-90 jp-text mb-6 leading-relaxed">
                    {current.question}
                </p>

                {/* Options */}
                <div className="space-y-3">
                    {current.options.map((option, optIdx) => (
                        <button
                            key={optIdx}
                            id={`quiz-option-${optIdx}`}
                            onClick={() => handleSelect(optIdx)}
                            className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left text-sm transition-all ${
                                selected === optIdx
                                    ? "border-primary-base bg-primary-10 text-primary-base font-semibold"
                                    : "border-neutral-20 hover:border-primary-base hover:bg-primary-10 text-neutral-70"
                            }`}
                        >
                            <span
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    selected === optIdx
                                        ? "bg-primary-base text-white"
                                        : "bg-neutral-10 text-neutral-50"
                                }`}
                            >
                                {["A", "B", "C", "D"][optIdx]}
                            </span>
                            <span className="jp-text">{option}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Navigation */}
            <div className="px-6 py-4 border-t border-neutral-10 flex items-center justify-between flex-shrink-0 bg-absolute-white">
                <button
                    onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    disabled={currentIdx === 0}
                    className="btn-outline text-sm px-4 py-2.5 disabled:opacity-40"
                >
                    ← Sebelumnya
                </button>

                {isLast ? (
                    <button
                        id="btn-quiz-submit"
                        onClick={handleSubmit}
                        disabled={answeredCount < questions.length || isSubmitting}
                        className="btn text-sm px-6 py-2.5 disabled:opacity-50"
                    >
                        {isSubmitting ? "Menyimpan..." : "Selesai & Lihat Nilai"}
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                        className="btn text-sm px-4 py-2.5"
                    >
                        Berikutnya →
                    </button>
                )}
            </div>

            {error && (
                <p className="text-xs text-error-base text-center pb-2">{error}</p>
            )}
        </div>
    );
}
