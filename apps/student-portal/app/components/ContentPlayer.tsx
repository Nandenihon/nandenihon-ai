"use client";

import type { LmsLesson } from "@repo/database";

interface ContentPlayerProps {
    lesson: LmsLesson;
    isCompleted: boolean;
    onMarkComplete: () => void;
    isMarkingComplete: boolean;
}

export default function ContentPlayer({
    lesson,
    isCompleted,
    onMarkComplete,
    isMarkingComplete,
}: ContentPlayerProps) {
    return (
        <div className="flex flex-col h-full">
            {/* Lesson Header */}
            <div className="px-6 py-4 border-b border-neutral-10 flex items-center justify-between gap-4 flex-shrink-0 bg-absolute-white">
                <div>
                    <span className="text-xs text-neutral-40 uppercase tracking-wider capitalize">
                        {lesson.contentType}
                    </span>
                    <h1 className="text-lg font-bold text-neutral-90 mt-0.5 jp-text">{lesson.title}</h1>
                </div>
                {lesson.contentType !== "quiz" && (
                    <button
                        id="btn-mark-complete"
                        onClick={onMarkComplete}
                        disabled={isCompleted || isMarkingComplete}
                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            isCompleted
                                ? "bg-success-10 text-success-base cursor-default"
                                : "btn"
                        }`}
                    >
                        {isCompleted ? (
                            <>
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Selesai
                            </>
                        ) : isMarkingComplete ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12a9 9 0 00-9-9" />
                                </svg>
                                Menyimpan...
                            </>
                        ) : (
                            "Tandai Selesai"
                        )}
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {/* Video Player */}
                {lesson.contentType === "video" && lesson.videoUrl && (
                    <div className="w-full bg-black aspect-video">
                        {isYouTubeUrl(lesson.videoUrl) ? (
                            <iframe
                                src={toYouTubeEmbed(lesson.videoUrl)}
                                title={lesson.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                            />
                        ) : (
                            <video
                                controls
                                className="w-full h-full"
                                src={lesson.videoUrl}
                            />
                        )}
                    </div>
                )}

                {/* Video with no URL */}
                {lesson.contentType === "video" && !lesson.videoUrl && (
                    <div className="flex items-center justify-center h-48 bg-neutral-10 text-neutral-40">
                        <div className="text-center">
                            <svg className="w-10 h-10 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            <p className="text-sm">Video belum tersedia</p>
                        </div>
                    </div>
                )}

                {/* Japanese Text Content */}
                {lesson.bodyText && (
                    <div className="px-6 py-6">
                        <div
                            className="lesson-body max-w-3xl mx-auto"
                            /* Using dangerouslySetInnerHTML to support <ruby>/<rt> furigana tags
                             * and other HTML markup stored in body_text.
                             * Content is teacher-authored, not user input. */
                            dangerouslySetInnerHTML={{ __html: lesson.bodyText }}
                        />
                    </div>
                )}

                {/* Empty quiz placeholder (quiz has its own component) */}
                {lesson.contentType === "quiz" && !lesson.bodyText && (
                    <div className="flex items-center justify-center h-48 text-neutral-40">
                        <p className="text-sm">Memuat kuis...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function isYouTubeUrl(url: string): boolean {
    return url.includes("youtube.com") || url.includes("youtu.be");
}

function toYouTubeEmbed(url: string): string {
    // Convert watch?v= or youtu.be/ to embed URL
    const matchWatch = url.match(/[?&]v=([^&]+)/);
    const matchShort = url.match(/youtu\.be\/([^?]+)/);
    const videoId = matchWatch?.[1] ?? matchShort?.[1];
    return videoId
        ? `https://www.youtube.com/embed/${videoId}?rel=0`
        : url;
}
