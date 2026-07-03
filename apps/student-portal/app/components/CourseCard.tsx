import type { CourseLevel } from "@repo/database";

interface CourseCardProps {
    id: number;
    title: string;
    level: CourseLevel;
    description: string | null;
    thumbnail: string | null;
    progressPercent: number;
    completedLessons: number;
    totalLessons: number;
    enrollmentStatus: "active" | "completed";
}

const levelConfig: Record<CourseLevel, { bg: string; text: string; label: string }> = {
    N5: { bg: "bg-success-10", text: "text-success-100", label: "N5 — Beginner" },
    N4: { bg: "bg-primary-10", text: "text-primary-base", label: "N4 — Elementary" },
    N3: { bg: "bg-warning-10", text: "text-warning-100", label: "N3 — Intermediate" },
};

export default function CourseCard({
    id,
    title,
    level,
    description,
    thumbnail,
    progressPercent,
    completedLessons,
    totalLessons,
    enrollmentStatus,
}: CourseCardProps) {
    const lvl = levelConfig[level] ?? levelConfig["N5"];
    const isCompleted = enrollmentStatus === "completed" || progressPercent === 100;

    return (
        <a
            href={`/courses/${id}`}
            id={`course-card-${id}`}
            className="card group flex flex-col overflow-hidden hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-primary-base/10"
        >
            {/* Thumbnail */}
            <div className="relative w-full h-36 bg-neutral-10 overflow-hidden flex-shrink-0">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-10 to-secondary-10">
                        <span className="text-4xl jp-text text-primary-40">日</span>
                    </div>
                )}
                {/* Completed overlay badge */}
                {isCompleted && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-success-base text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Selesai
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col gap-3">
                <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1.5 ${lvl.bg} ${lvl.text}`}>
                        {lvl.label}
                    </span>
                    <h3 className="text-sm font-bold text-neutral-90 group-hover:text-primary-base transition-colors line-clamp-2 leading-snug">
                        {title}
                    </h3>
                    {description && (
                        <p className="text-xs text-neutral-50 mt-1 line-clamp-2 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>

                {/* Progress bar */}
                <div className="mt-auto">
                    <div className="flex items-center justify-between text-xs text-neutral-50 mb-1.5">
                        <span>{completedLessons} / {totalLessons} pelajaran</span>
                        <span className="font-semibold text-primary-base">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-base to-primary-50 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>
        </a>
    );
}
