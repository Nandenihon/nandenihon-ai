export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import {
    ensureLmsTables,
    findCourseById,
    findLessonsByCourse,
} from "@repo/database";
import type { LmsCourse, LmsLesson } from "@repo/database";

interface Props {
    params: Promise<{ id: string }>;
}

const levelBadge: Record<string, { bg: string; text: string }> = {
    N5: { bg: "bg-success-10", text: "text-success-100" },
    N4: { bg: "bg-primary-10", text: "text-primary-base" },
    N3: { bg: "bg-warning-10", text: "text-warning-100" },
};

const contentTypeIcon = (type: string) => {
    if (type === "video")
        return (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
        );
    if (type === "quiz")
        return (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeWidth="3" />
            </svg>
        );
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    );
};

export default async function LecturerCourseDetailPage({ params }: Props) {
    const { id } = await params;
    const courseId = parseInt(id, 10);
    if (isNaN(courseId)) notFound();

    await ensureLmsTables();
    const [course, lessons] = await Promise.all([
        findCourseById(courseId),
        findLessonsByCourse(courseId),
    ]);

    if (!course) notFound();

    const lvl = levelBadge[course.level] ?? levelBadge["N5"];
    const videoCount = lessons.filter((l) => l.contentType === "video").length;
    const textCount = lessons.filter((l) => l.contentType === "text").length;
    const quizCount = lessons.filter((l) => l.contentType === "quiz").length;

    return (
        <div className="space-y-6">
            {/* Back + Header */}
            <div>
                <a
                    href="/dashboard/lecturer/courses"
                    className="inline-flex items-center gap-1.5 text-sm text-neutral-50 hover:text-secondary-base transition-colors mb-4"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Kembali ke Daftar Kursus
                </a>

                <div className="card p-6 flex flex-col md:flex-row gap-6">
                    {/* Thumbnail */}
                    <div className="w-full md:w-48 h-32 rounded-xl bg-neutral-20 overflow-hidden flex-shrink-0">
                        {course.thumbnail ? (
                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-neutral-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                                    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    {/* Info */}
                    <div className="flex-1">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${lvl.bg} ${lvl.text}`}>
                            {course.level}
                        </span>
                        <h1 className="text-2xl font-bold text-neutral-90 mb-1">{course.title}</h1>
                        {course.description && (
                            <p className="text-sm text-neutral-60 mb-4">{course.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-sm text-neutral-60">
                            <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-neutral-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                {videoCount} Video
                            </span>
                            <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-neutral-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                                {textCount} Teks
                            </span>
                            <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-neutral-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                                {quizCount} Kuis
                            </span>
                        </div>
                    </div>
                    {/* Action */}
                    <div className="flex-shrink-0 flex items-start">
                        <a
                            href={`/dashboard/lecturer/courses/${course.id}/lessons/new`}
                            className="btn bg-secondary-base hover:bg-secondary-80 text-sm px-4 py-2"
                        >
                            + Tambah Pelajaran
                        </a>
                    </div>
                </div>
            </div>

            {/* Lessons List */}
            <div className="card p-6">
                <h2 className="text-lg font-bold text-neutral-90 mb-4">Kurikulum Kursus</h2>
                {lessons.length === 0 ? (
                    <div className="text-center py-12 text-neutral-40">
                        <svg className="w-12 h-12 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <p className="text-sm">Belum ada pelajaran. Tambahkan pelajaran pertama!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {lessons.map((lesson, idx) => (
                            <div
                                key={lesson.id}
                                className="flex items-center gap-4 p-4 rounded-xl border border-neutral-10 hover:border-secondary-base hover:bg-secondary-10 transition-all group"
                            >
                                {/* Index */}
                                <div className="w-8 h-8 rounded-full bg-neutral-10 flex items-center justify-center text-sm font-bold text-neutral-50 group-hover:bg-secondary-base group-hover:text-white transition-all flex-shrink-0">
                                    {idx + 1}
                                </div>
                                {/* Icon */}
                                <div className="text-neutral-40 group-hover:text-secondary-base transition-colors">
                                    {contentTypeIcon(lesson.contentType)}
                                </div>
                                {/* Title + Type */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-80 group-hover:text-secondary-base transition-colors truncate">
                                        {lesson.title}
                                    </p>
                                    <p className="text-xs text-neutral-40 capitalize">{lesson.contentType}</p>
                                </div>
                                {/* Edit link */}
                                <a
                                    href={`/dashboard/lecturer/courses/${course.id}/lessons/${lesson.id}/edit`}
                                    className="text-xs text-neutral-40 hover:text-secondary-base transition-colors px-2 py-1 rounded hover:bg-secondary-10"
                                    title="Edit pelajaran"
                                >
                                    Edit
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
