import { headers } from "next/headers";
import {
    getDailyQuizQuestionCount,
    getDailyQuizQuestionsForDate,
    findTodayDailyQuizAttempt,
    type DailyQuizQuestion,
} from "@repo/database";
import DailyQuizStarter from "../../components/DailyQuizStarter";
import type { QuizQuestion } from "../../components/QuizComponent";
import { getLatestDailyQuizAttemptSafe } from "../dashboard-data";

export const dynamic = "force-dynamic";

const DAILY_QUIZ_QUESTION_COUNT = 2;
const DAILY_QUIZ_TIME_LIMIT_SECONDS = 15;

function toQuizQuestion(question: DailyQuizQuestion): QuizQuestion {
    return {
        id: String(question.id),
        question: question.question,
        options: question.options,
        correctIndex: question.correctIndex,
        explanation: question.explanation ?? undefined,
    };
}

async function loadDailyQuiz(studentId: number) {
    try {
        const [questions, totalQuestions, latestAttempt, todayAttempt] = await Promise.all([
            getDailyQuizQuestionsForDate(DAILY_QUIZ_QUESTION_COUNT, new Date(), String(studentId)),
            getDailyQuizQuestionCount(),
            getLatestDailyQuizAttemptSafe(studentId),
            findTodayDailyQuizAttempt(studentId),
        ]);

        return {
            questions: questions.map(toQuizQuestion),
            totalQuestions,
            latestAttempt: todayAttempt ?? latestAttempt,
            isCompletedToday: Boolean(todayAttempt),
            hasError: false,
        };
    } catch {
        return {
            questions: [],
            totalQuestions: 0,
            latestAttempt: null,
            isCompletedToday: false,
            hasError: true,
        };
    }
}

export default async function DailyQuizPage() {
    const headersList = await headers();
    const studentId = Number(headersList.get("x-user-id") ?? "0");
    const { questions, totalQuestions, latestAttempt, isCompletedToday, hasError } = await loadDailyQuiz(studentId);

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-40">Daily Quiz</p>
                    <h1 className="text-2xl font-bold text-neutral-90">Latihan Harian</h1>
                </div>
                <a href="/dashboard/daily-quiz/leaderboard" className="rounded-lg bg-primary-base px-4 py-2 text-sm font-semibold text-white">
                    Leaderboard
                </a>
            </div>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_.6fr]">
                <div className="card min-h-[700px] overflow-hidden">
                    {hasError ? (
                        <div className="flex min-h-[700px] items-center justify-center p-6 text-center">
                            <div>
                                <p className="text-sm font-bold text-neutral-90">Daily quiz belum bisa dimuat</p>
                                <p className="mt-2 text-sm text-neutral-50">
                                    Pastikan tabel dan seed daily quiz sudah dijalankan.
                                </p>
                            </div>
                        </div>
                    ) : isCompletedToday ? (
                        <div className="flex min-h-[700px] items-center justify-center p-6 text-center">
                            <div className="max-w-md">
                                <p className="text-sm font-bold text-neutral-90">
                                    Kamu sudah menyelesaikan tantangan hari ini. Kembali lagi besok!
                                </p>
                                <p className="mt-2 text-sm text-neutral-50">
                                    Skor terbaik hari ini sudah masuk ke leaderboard harian.
                                </p>
                            </div>
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="flex min-h-[700px] items-center justify-center p-6 text-center">
                            <div>
                                <p className="text-sm font-bold text-neutral-90">Belum ada soal daily quiz</p>
                                <p className="mt-2 text-sm text-neutral-50">
                                    Jalankan setup daily quiz untuk mengisi bank soal.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <DailyQuizStarter
                            questions={questions}
                            submitUrl="/api/daily-quiz/attempts"
                            timeLimitSeconds={DAILY_QUIZ_TIME_LIMIT_SECONDS}
                        />
                    )}
                </div>

                <div className="space-y-5">
                    <div className="card p-6">
                        <p className="text-sm font-bold text-neutral-90">Skor terakhir</p>
                        <p className="mt-5 text-5xl font-bold text-primary-base">
                            {latestAttempt ? latestAttempt.score : "-"}
                        </p>
                        <p className="mt-2 text-xs text-neutral-50">
                            {latestAttempt
                                ? `${latestAttempt.correctAnswers}/${latestAttempt.totalQuestions} benar · streak ${latestAttempt.currentStreak} hari`
                                : "Belum ada skor daily quiz"}
                        </p>
                    </div>

                    <div className="card p-6">
                        <p className="text-sm font-bold text-neutral-90">Quiz hari ini</p>
                        <p className="mt-1 text-xs text-neutral-50">
                            Soal singkat yang berganti setiap hari.
                        </p>
                        <dl className="mt-5 space-y-4 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <dt className="text-neutral-50">Jumlah soal</dt>
                                <dd className="font-semibold text-neutral-90">{questions.length}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <dt className="text-neutral-50">Waktu per soal</dt>
                                <dd className="font-semibold text-neutral-90">{DAILY_QUIZ_TIME_LIMIT_SECONDS} detik</dd>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <dt className="text-neutral-50">Bank soal aktif</dt>
                                <dd className="font-semibold text-neutral-90">{totalQuestions}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <dt className="text-neutral-50">Skor leaderboard</dt>
                                <dd className="font-semibold text-neutral-90">Skor terbaik hari ini</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </section>
        </div>
    );
}
