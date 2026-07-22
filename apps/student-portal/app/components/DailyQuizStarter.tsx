"use client";

import { useState } from "react";
import QuizComponent, { type QuizQuestion } from "./QuizComponent";

interface DailyQuizStarterProps {
    questions: QuizQuestion[];
    submitUrl: string;
    timeLimitSeconds: number;
}

export default function DailyQuizStarter({
    questions,
    submitUrl,
    timeLimitSeconds,
}: DailyQuizStarterProps) {
    const [hasStarted, setHasStarted] = useState(false);

    if (hasStarted) {
        return (
            <QuizComponent
                lessonId={0}
                lessonTitle="Daily Quiz"
                questions={questions}
                submitUrl={submitUrl}
                timeLimitSeconds={timeLimitSeconds}
                scoreVariant="points"
                allowRetry={false}
                backHref="/dashboard"
                backLabel="Kembali ke Dashboard"
            />
        );
    }

    return (
        <div className="flex min-h-[700px] items-center justify-center p-6">
            <div className="w-full max-w-lg text-center">
                <span className="inline-flex rounded-full bg-primary-10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-base">
                    Tantangan singkat hari ini
                </span>
                <h2 className="mt-5 text-3xl font-bold text-neutral-90">
                    Siap mulai Daily Quiz?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-50">
                    Kamu akan mengerjakan {questions.length} soal singkat. Setiap soal punya waktu {timeLimitSeconds} detik, jadi siapkan fokus sebelum mulai.
                </p>

                <div className="mt-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
                    <div className="rounded-2xl bg-neutral-0 p-4">
                        <p className="text-xs font-semibold text-neutral-40">Jumlah soal</p>
                        <p className="mt-2 text-2xl font-bold text-neutral-90">{questions.length}</p>
                    </div>
                    <div className="rounded-2xl bg-neutral-0 p-4">
                        <p className="text-xs font-semibold text-neutral-40">Waktu per soal</p>
                        <p className="mt-2 text-2xl font-bold text-neutral-90">{timeLimitSeconds}s</p>
                    </div>
                    <div className="rounded-2xl bg-neutral-0 p-4">
                        <p className="text-xs font-semibold text-neutral-40">Kesempatan</p>
                        <p className="mt-2 text-2xl font-bold text-neutral-90">1x</p>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-primary-10 bg-primary-10/40 p-4 text-left">
                    <p className="text-sm font-bold text-neutral-90">Persiapan cepat</p>
                    <ul className="mt-3 space-y-2 text-sm text-neutral-60">
                        <li>Pastikan koneksi stabil sebelum menekan Start.</li>
                        <li>Pilih jawaban dengan tenang, timer berjalan setelah quiz dimulai.</li>
                        <li>Skor hari ini langsung masuk ke leaderboard setelah submit.</li>
                    </ul>
                </div>

                <button
                    type="button"
                    onClick={() => setHasStarted(true)}
                    className="btn mt-8 w-full justify-center py-3 text-sm sm:w-auto sm:px-10"
                >
                    Start Daily Quiz
                </button>
            </div>
        </div>
    );
}
