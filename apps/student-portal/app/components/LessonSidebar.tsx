"use client";

import type { LmsLesson } from "@repo/database";

interface LessonWithProgress extends LmsLesson {
    isCompleted: boolean;
}

interface LessonSidebarProps {
    courseTitle: string;
    lessons: LessonWithProgress[];
    activeLessonId: number | null;
    onSelectLesson: (lesson: LessonWithProgress) => void;
}

const contentTypeIcon = (type: string, isActive: boolean, isCompleted: boolean) => {
    const color = isActive ? "text-white" : isCompleted ? "text-success-base" : "text-neutral-40";
    if (type === "video")
        return (
            <svg className={`w-4 h-4 flex-shrink-0 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
        );
    if (type === "quiz")
        return (
            <svg className={`w-4 h-4 flex-shrink-0 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeWidth="3" />
            </svg>
        );
    return (
        <svg className={`w-4 h-4 flex-shrink-0 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    );
};

export default function LessonSidebar({
    courseTitle,
    lessons,
    activeLessonId,
    onSelectLesson,
}: LessonSidebarProps) {
    const completedCount = lessons.filter((l) => l.isCompleted).length;
    const totalCount = lessons.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <aside className="flex flex-col h-full bg-absolute-white border-r border-neutral-20">
            {/* Header */}
            <div className="p-4 border-b border-neutral-10">
                <p className="text-xs text-neutral-40 uppercase tracking-wider font-semibold mb-1">Kurikulum</p>
                <h2 className="text-sm font-bold text-neutral-90 leading-snug line-clamp-2">{courseTitle}</h2>
                {/* Mini progress */}
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-neutral-50 mb-1">
                        <span>{completedCount}/{totalCount} selesai</span>
                        <span className="text-primary-base font-semibold">{progress}%</span>
                    </div>
                    <div className="h-1 bg-neutral-10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-base rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Lessons */}
            <nav className="flex-1 overflow-y-auto py-2">
                {lessons.map((lesson, idx) => {
                    const isActive = lesson.id === activeLessonId;
                    return (
                        <button
                            key={lesson.id}
                            id={`lesson-item-${lesson.id}`}
                            onClick={() => onSelectLesson(lesson)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                                isActive
                                    ? "bg-primary-base"
                                    : "hover:bg-primary-10"
                            }`}
                        >
                            {/* Completion badge */}
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border ${
                                    isActive
                                        ? "bg-white/20 border-white/30 text-white"
                                        : lesson.isCompleted
                                        ? "bg-success-10 border-success-base text-success-base"
                                        : "bg-neutral-10 border-neutral-20 text-neutral-40"
                                }`}
                            >
                                {lesson.isCompleted && !isActive ? (
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    idx + 1
                                )}
                            </div>

                            {/* Content type icon */}
                            {contentTypeIcon(lesson.contentType, isActive, lesson.isCompleted)}

                            {/* Title */}
                            <span
                                className={`text-xs font-medium leading-snug line-clamp-2 flex-1 ${
                                    isActive ? "text-white" : "text-neutral-70"
                                }`}
                            >
                                {lesson.title}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
