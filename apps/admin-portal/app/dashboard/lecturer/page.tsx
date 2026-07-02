export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { queryMySQL, type RowDataPacket, listCourses, ensureLmsTables } from "@repo/database";
import type { LmsCourse } from "@repo/database";

interface LecturerStats {
    totalCourses: number;
    totalLessons: number;
    totalEnrolledStudents: number;
}

async function getLecturerStats(teacherId: number): Promise<LecturerStats> {
    try {
        await ensureLmsTables();
        const [courses, lessons, students] = await Promise.all([
            queryMySQL<RowDataPacket[]>("SELECT COUNT(*) as total FROM courses"),
            queryMySQL<RowDataPacket[]>("SELECT COUNT(*) as total FROM lessons"),
            queryMySQL<RowDataPacket[]>("SELECT COUNT(DISTINCT student_id) as total FROM enrollments"),
        ]);
        return {
            totalCourses: Number(courses[0]?.total ?? 0),
            totalLessons: Number(lessons[0]?.total ?? 0),
            totalEnrolledStudents: Number(students[0]?.total ?? 0),
        };
    } catch {
        return { totalCourses: 0, totalLessons: 0, totalEnrolledStudents: 0 };
    }
}

async function getRecentCourses(): Promise<LmsCourse[]> {
    try {
        await ensureLmsTables();
        return listCourses();
    } catch {
        return [];
    }
}

const levelColors: Record<string, { bg: string; text: string; label: string }> = {
    N5: { bg: "bg-success-10", text: "text-success-100", label: "N5 — Beginner" },
    N4: { bg: "bg-primary-10", text: "text-primary-base", label: "N4 — Elementary" },
    N3: { bg: "bg-warning-10", text: "text-warning-100", label: "N3 — Intermediate" },
};

export default async function LecturerDashboardPage() {
    const headersList = await headers();
    const teacherName = headersList.get("x-user-name") ?? "Pengajar";
    const teacherId = Number(headersList.get("x-user-id") ?? "0");

    const [stats, courses] = await Promise.all([
        getLecturerStats(teacherId),
        getRecentCourses(),
    ]);

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-secondary-base to-secondary-80 p-6 text-white relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
                <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full bg-white/5" />
                <div className="relative z-10">
                    <p className="text-secondary-20 text-sm font-medium mb-1">Portal Pengajar</p>
                    <h1 className="text-2xl font-bold mb-1">
                        こんにちは、{teacherName}先生！
                    </h1>
                    <p className="text-secondary-20 text-sm">
                        Kelola kursus dan pantau perkembangan siswa Anda dari sini.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    {
                        label: "Total Kursus",
                        value: stats.totalCourses,
                        icon: (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                            </svg>
                        ),
                        color: "bg-secondary-10 text-secondary-base",
                    },
                    {
                        label: "Total Pelajaran",
                        value: stats.totalLessons,
                        icon: (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                        ),
                        color: "bg-primary-10 text-primary-base",
                    },
                    {
                        label: "Siswa Terdaftar",
                        value: stats.totalEnrolledStudents,
                        icon: (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                                <path d="M16 3.13a4 4 0 010 7.75" />
                            </svg>
                        ),
                        color: "bg-success-10 text-success-100",
                    },
                ].map((stat) => (
                    <div key={stat.label} className="card p-5 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-neutral-90">{stat.value}</p>
                            <p className="text-sm text-neutral-50">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Courses List */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-neutral-90">Kursus yang Tersedia</h2>
                    <a
                        href="/dashboard/lecturer/courses/new"
                        className="btn text-sm px-4 py-2 bg-secondary-base hover:bg-secondary-80"
                    >
                        + Tambah Kursus
                    </a>
                </div>

                {courses.length === 0 ? (
                    <div className="text-center py-12 text-neutral-40">
                        <svg className="w-12 h-12 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                        </svg>
                        <p className="text-sm">Belum ada kursus. Mulai buat kursus pertama Anda!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {courses.map((course) => {
                            const lvl = levelColors[course.level] ?? levelColors["N5"];
                            return (
                                <a
                                    key={course.id}
                                    href={`/dashboard/lecturer/courses/${course.id}`}
                                    className="card-muted p-4 hover:shadow-md transition-all group cursor-pointer"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-full h-32 rounded-xl bg-neutral-20 overflow-hidden mb-3">
                                        {course.thumbnail ? (
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-10 h-10 text-neutral-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                                                    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 ${lvl.bg} ${lvl.text}`}>
                                        {lvl.label}
                                    </span>
                                    <h3 className="text-sm font-semibold text-neutral-90 group-hover:text-secondary-base transition-colors line-clamp-2">
                                        {course.title}
                                    </h3>
                                    {course.description && (
                                        <p className="text-xs text-neutral-50 mt-1 line-clamp-2">{course.description}</p>
                                    )}
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
