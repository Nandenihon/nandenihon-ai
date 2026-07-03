"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LessonSidebar from "../../components/LessonSidebar";
import ContentPlayer from "../../components/ContentPlayer";
import QuizComponent, { type QuizQuestion } from "../../components/QuizComponent";
import type { LmsLesson } from "@repo/database";

interface LessonWithProgress extends LmsLesson {
    isCompleted: boolean;
}

// ── Demo quiz questions (replace with DB-stored questions per lesson) ──────────
const DEMO_QUIZ: QuizQuestion[] = [
    {
        id: "q1",
        question: "「ありがとう」の意味は何ですか？(What does 「ありがとう」 mean?)",
        options: ["Goodbye", "Thank you", "Good morning", "Excuse me"],
        correctIndex: 1,
        explanation: "「ありがとう」は英語で 'Thank you' です。",
    },
    {
        id: "q2",
        question: "「犬」の読み方はどれですか？(How do you read 「犬」?)",
        options: ["ねこ (neko)", "いぬ (inu)", "さかな (sakana)", "とり (tori)"],
        correctIndex: 1,
        explanation: "「犬」は 'inu' と読みます。意味は 'dog' です。",
    },
    {
        id: "q3",
        question: "日本語で「水」は何ですか？(What is 「水」 in English?)",
        options: ["Fire", "Earth", "Water", "Wind"],
        correctIndex: 2,
        explanation: "「水」は英語で 'Water' (水) です。",
    },
];

export default function CourseClassroomPage() {
    const { id } = useParams<{ id: string }>();
    const courseId = parseInt(id, 10);

    const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
    const [activeLesson, setActiveLesson] = useState<LessonWithProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Fetch lessons + progress
    const fetchLessons = useCallback(async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}/lessons`);
            if (!res.ok) return;
            const data = await res.json();
            setLessons(data.lessons ?? []);
            // Auto-select first incomplete lesson or first lesson
            if (data.lessons?.length > 0 && !activeLesson) {
                const firstIncomplete = data.lessons.find((l: LessonWithProgress) => !l.isCompleted);
                setActiveLesson(firstIncomplete ?? data.lessons[0]);
            }
        } catch {
            // noop
        } finally {
            setIsLoading(false);
        }
    }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchLessons();
    }, [fetchLessons]);

    const handleSelectLesson = (lesson: LessonWithProgress) => {
        setActiveLesson(lesson);
        setSidebarOpen(false);
    };

    const handleMarkComplete = async () => {
        if (!activeLesson || isMarkingComplete) return;
        setIsMarkingComplete(true);
        try {
            await fetch(`/api/lessons/${activeLesson.id}/complete`, { method: "POST" });
            // Update local state
            setLessons((prev) =>
                prev.map((l) => (l.id === activeLesson.id ? { ...l, isCompleted: true } : l))
            );
            setActiveLesson((prev) => prev ? { ...prev, isCompleted: true } : prev);
            // Auto-advance to next lesson
            const currentIdx = lessons.findIndex((l) => l.id === activeLesson.id);
            const next = lessons[currentIdx + 1];
            if (next) setTimeout(() => setActiveLesson(next), 800);
        } catch {
            // noop
        } finally {
            setIsMarkingComplete(false);
        }
    };

    const handleQuizFinish = async (score: number) => {
        if (!activeLesson) return;
        // Mark quiz lesson complete if score >= 70
        if (score >= 70) {
            await fetch(`/api/lessons/${activeLesson.id}/complete`, { method: "POST" });
            setLessons((prev) =>
                prev.map((l) => (l.id === activeLesson.id ? { ...l, isCompleted: true } : l))
            );
            setActiveLesson((prev) => prev ? { ...prev, isCompleted: true } : prev);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-57px)] text-neutral-40">
                <div className="text-center">
                    <svg className="w-8 h-8 animate-spin mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 00-9-9" />
                    </svg>
                    <p className="text-sm">Memuat kursus...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-57px)] overflow-hidden relative">
            {/* Mobile sidebar toggle */}
            <button
                className="md:hidden fixed bottom-4 left-4 z-50 bg-primary-base text-white rounded-full p-3 shadow-lg"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {sidebarOpen ? <line x1="18" y1="6" x2="6" y2="18" /> : <line x1="3" y1="12" x2="21" y2="12" />}
                    {!sidebarOpen && <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>}
                </svg>
            </button>

            {/* Left Sidebar */}
            <div
                className={`
                    w-72 flex-shrink-0 h-full overflow-hidden transition-all duration-300
                    md:block
                    ${sidebarOpen ? "block fixed inset-y-0 left-0 z-40 shadow-xl" : "hidden"}
                `}
            >
                <LessonSidebar
                    courseTitle={lessons[0] ? `Kursus #${courseId}` : "Kursus"}
                    lessons={lessons}
                    activeLessonId={activeLesson?.id ?? null}
                    onSelectLesson={handleSelectLesson}
                />
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Right Content Area */}
            <div className="flex-1 h-full overflow-hidden border-l border-neutral-10">
                {!activeLesson ? (
                    <div className="flex items-center justify-center h-full text-neutral-40">
                        <div className="text-center">
                            <svg className="w-12 h-12 mx-auto mb-3 text-neutral-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <p className="text-sm">Pilih pelajaran dari daftar di sebelah kiri</p>
                        </div>
                    </div>
                ) : activeLesson.contentType === "quiz" ? (
                    <QuizComponent
                        lessonId={activeLesson.id}
                        lessonTitle={activeLesson.title}
                        questions={DEMO_QUIZ}
                        onFinish={handleQuizFinish}
                    />
                ) : (
                    <ContentPlayer
                        lesson={activeLesson}
                        isCompleted={activeLesson.isCompleted}
                        onMarkComplete={handleMarkComplete}
                        isMarkingComplete={isMarkingComplete}
                    />
                )}
            </div>
        </div>
    );
}
