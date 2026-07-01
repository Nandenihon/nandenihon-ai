export const dynamic = "force-dynamic";

import { queryMySQL, type RowDataPacket } from "@repo/database";

interface DashboardStats {
    totalStudents: number;
    totalClasses: number;
    activeSeminars: number;
    totalTestimonies: number;
}

interface RecentStudent {
    id: number;
    name: string;
    email: string;
    level: string | null;
    status: string;
}

interface UpcomingClass {
    id: number;
    name: string;
    time: string;
    level: string;
    date: string;
}

async function getDashboardStats(): Promise<DashboardStats> {
    try {
        const [studentsRow, classesRow, seminarsRow, testimoniesRow] =
            await Promise.all([
                queryMySQL<RowDataPacket[]>("SELECT COUNT(*) as total FROM students"),
                queryMySQL<RowDataPacket[]>("SELECT COUNT(*) as total FROM `class`"),
                queryMySQL<RowDataPacket[]>(
                    "SELECT COUNT(*) as total FROM seminar WHERE status = 'ongoing' OR status = 'upcoming'"
                ),
                queryMySQL<RowDataPacket[]>("SELECT COUNT(*) as total FROM testimony"),
            ]);

        return {
            totalStudents: Number(studentsRow[0]?.total ?? 0),
            totalClasses: Number(classesRow[0]?.total ?? 0),
            activeSeminars: Number(seminarsRow[0]?.total ?? 0),
            totalTestimonies: Number(testimoniesRow[0]?.total ?? 0),
        };
    } catch {
        return { totalStudents: 0, totalClasses: 0, activeSeminars: 0, totalTestimonies: 0 };
    }
}

async function getRecentStudents(): Promise<RecentStudent[]> {
    try {
        const rows = await queryMySQL<RowDataPacket[]>(
            `SELECT id, full_name, email, level, test_status
             FROM students
             ORDER BY created_at DESC
             LIMIT 5`
        );
        return rows.map((row) => ({
            id: Number(row.id),
            name: String(row.full_name),
            email: String(row.email),
            level: row.level ? String(row.level) : "-",
            status: row.test_status === "completed" ? "Selesai" : "Aktif",
        }));
    } catch {
        return [];
    }
}

async function getUpcomingClasses(): Promise<UpcomingClass[]> {
    try {
        const rows = await queryMySQL<RowDataPacket[]>(
            `SELECT id, class_name, register_start, register_end, level
             FROM \`class\`
             WHERE status = 'active'
             ORDER BY register_start ASC
             LIMIT 4`
        );

        const now = new Date();
        const todayStr = now.toDateString();
        const tomorrowStr = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1
        ).toDateString();

        return rows.map((row) => {
            const start = new Date(row.register_start);
            const end = new Date(row.register_end);
            const startStr = start.toDateString();

            let dateLabel: string;
            if (startStr === todayStr) {
                dateLabel = "Hari ini";
            } else if (startStr === tomorrowStr) {
                dateLabel = "Besok";
            } else {
                dateLabel = start.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                });
            }

            const fmt = (d: Date) =>
                d.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                });

            return {
                id: Number(row.id),
                name: String(row.class_name),
                time: `${fmt(start)} - ${fmt(end)}`,
                level: row.level ? String(row.level) : "-",
                date: dateLabel,
            };
        });
    } catch {
        return [];
    }
}

function formatNumber(n: number): string {
    return new Intl.NumberFormat("id-ID").format(n);
}

export default async function DashboardPage() {
    const [stats, recentStudents, upcomingClasses] = await Promise.all([
        getDashboardStats(),
        getRecentStudents(),
        getUpcomingClasses(),
    ]);

    const statCards = [
        {
            id: "total-students",
            label: "Total Siswa",
            value: formatNumber(stats.totalStudents),
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
            ),
            color: "bg-primary-10 text-primary-base",
        },
        {
            id: "total-classes",
            label: "Total Kelas",
            value: formatNumber(stats.totalClasses),
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                </svg>
            ),
            color: "bg-success-10 text-success-base",
        },
        {
            id: "total-seminars",
            label: "Seminar Aktif",
            value: formatNumber(stats.activeSeminars),
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                    <line x1="12" y1="12" x2="12" y2="16" />
                    <line x1="10" y1="14" x2="14" y2="14" />
                </svg>
            ),
            color: "bg-warning-10 text-warning-100",
        },
        {
            id: "total-testimonials",
            label: "Testimoni",
            value: formatNumber(stats.totalTestimonies),
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
            ),
            color: "bg-secondary-10 text-secondary-80",
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-primary-base to-primary-70 rounded-2xl p-6 text-absolute-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-80 rounded-full translate-x-20 -translate-y-20 opacity-30" />
                <div className="absolute bottom-0 right-32 w-32 h-32 bg-primary-90 rounded-full translate-y-10 opacity-20" />
                <div className="relative z-10">
                    <p className="text-sm font-medium text-primary-20 mb-1">
                        Selamat Datang Kembali 👋
                    </p>
                    <h2 className="text-2xl font-bold mb-2">Admin Nande Nihon</h2>
                    <p className="text-sm text-primary-20 max-w-md">
                        Platform manajemen pembelajaran bahasa Jepang. Pantau perkembangan siswa,
                        kelola kelas, dan optimalkan pengalaman belajar.
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                        <span className="bg-absolute-white bg-opacity-20 text-xs font-medium px-3 py-1.5 rounded-full">
                            📅 {new Date().toLocaleDateString("id-ID", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.id}
                        id={stat.id}
                        className="bg-absolute-white rounded-2xl p-5 flex flex-col gap-4 border border-neutral-20 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-xl ${stat.color}`}>
                                {stat.icon}
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-neutral-90">
                                {stat.value}
                            </p>
                            <p className="text-sm text-neutral-50 mt-1">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Students Table */}
                <div className="xl:col-span-2 bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-20">
                        <div>
                            <h3 className="text-base font-bold text-neutral-90">
                                Siswa Terbaru
                            </h3>
                            <p className="text-xs text-neutral-50 mt-0.5">
                                Siswa yang baru mendaftar
                            </p>
                        </div>
                        <a
                            href="/dashboard/students"
                            className="text-xs font-semibold text-primary-base hover:text-primary-80 transition-colors"
                        >
                            Lihat Semua →
                        </a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-0 border-b border-neutral-20">
                                <tr>
                                    <th className="text-left text-xs font-semibold text-neutral-50 px-6 py-3">
                                        Nama
                                    </th>
                                    <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3">
                                        Level
                                    </th>
                                    <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-10">
                                {recentStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-10 text-center text-sm text-neutral-50">
                                            Belum ada data siswa.
                                        </td>
                                    </tr>
                                ) : (
                                    recentStudents.map((student) => (
                                        <tr
                                            key={student.id}
                                            className="hover:bg-neutral-0 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary-20 flex items-center justify-center text-primary-base text-xs font-bold flex-shrink-0">
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-neutral-80">
                                                            {student.name}
                                                        </p>
                                                        <p className="text-xs text-neutral-40">
                                                            {student.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="bg-primary-10 text-primary-base text-xs font-semibold px-2.5 py-1 rounded-full">
                                                    {student.level}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                                        student.status === "Aktif"
                                                            ? "bg-success-10 text-success-base"
                                                            : "bg-neutral-10 text-neutral-50"
                                                    }`}
                                                >
                                                    {student.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Upcoming Classes */}
                <div className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-20">
                        <div>
                            <h3 className="text-base font-bold text-neutral-90">
                                Jadwal Kelas
                            </h3>
                            <p className="text-xs text-neutral-50 mt-0.5">
                                Kelas yang akan datang
                            </p>
                        </div>
                        <a
                            href="/dashboard/classes"
                            className="text-xs font-semibold text-primary-base hover:text-primary-80 transition-colors"
                        >
                            Lihat Semua →
                        </a>
                    </div>
                    <div className="flex flex-col divide-y divide-neutral-10">
                        {upcomingClasses.length === 0 ? (
                            <div className="px-6 py-10 text-center text-sm text-neutral-50">
                                Belum ada jadwal kelas aktif.
                            </div>
                        ) : (
                            upcomingClasses.map((cls) => (
                                <div
                                    key={cls.id}
                                    className="px-6 py-4 hover:bg-neutral-0 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-neutral-80 truncate">
                                                {cls.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="flex items-center gap-1 text-xs text-neutral-50">
                                                    <svg
                                                        className="w-3.5 h-3.5"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    >
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                    {cls.time}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-neutral-50">
                                                    <svg
                                                        className="w-3.5 h-3.5"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    >
                                                        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                                                        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                                                    </svg>
                                                    {cls.level}
                                                </span>
                                            </div>
                                        </div>
                                        <span
                                            className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-lg ${
                                                cls.date === "Hari ini"
                                                    ? "bg-primary-10 text-primary-base"
                                                    : cls.date === "Besok"
                                                    ? "bg-warning-10 text-warning-100"
                                                    : "bg-neutral-10 text-neutral-50"
                                            }`}
                                        >
                                            {cls.date}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-absolute-white rounded-2xl border border-neutral-20 p-6">
                <h3 className="text-base font-bold text-neutral-90 mb-4">
                    Aksi Cepat
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        {
                            label: "Tambah Siswa",
                            href: "/dashboard/students/add",
                            icon: (
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="19" y1="8" x2="19" y2="14" />
                                    <line x1="22" y1="11" x2="16" y2="11" />
                                </svg>
                            ),
                            color: "text-primary-base bg-primary-10 hover:bg-primary-20",
                        },
                        {
                            label: "Tambah Kelas",
                            href: "/dashboard/classes",
                            icon: (
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                                    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                                </svg>
                            ),
                            color: "text-success-base bg-success-10 hover:bg-success-10",
                        },
                        {
                            label: "Buat Seminar",
                            href: "/dashboard/seminars",
                            icon: (
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="7" width="20" height="14" rx="2" />
                                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                                    <line x1="12" y1="12" x2="12" y2="16" />
                                    <line x1="10" y1="14" x2="14" y2="14" />
                                </svg>
                            ),
                            color: "text-warning-100 bg-warning-10 hover:bg-warning-10",
                        },
                        {
                            label: "Lihat Testimoni",
                            href: "/dashboard/testimonials",
                            icon: (
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                </svg>
                            ),
                            color: "text-secondary-80 bg-secondary-10 hover:bg-secondary-20",
                        },
                    ].map((action) => (
                        <a
                            key={action.label}
                            href={action.href}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${action.color}`}
                        >
                            {action.icon}
                            <span className="text-sm font-medium text-center">
                                {action.label}
                            </span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
