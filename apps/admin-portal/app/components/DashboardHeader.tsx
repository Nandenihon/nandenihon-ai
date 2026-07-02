"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { UserSession } from "@repo/types";

const breadcrumbMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/students": "Siswa",
    "/dashboard/students/add": "Tambah Siswa",
    "/dashboard/classes": "Kelas",
    "/dashboard/classes/add": "Tambah Kelas",
    "/dashboard/seminars": "Seminar",
    "/dashboard/seminars/registrations": "Pendaftaran Seminar",
    "/dashboard/questions": "Soal & Ujian",
    "/dashboard/testimonials": "Testimoni",
    "/dashboard/team": "Tim",
    "/dashboard/news": "Berita & Artikel",
    "/dashboard/settings": "Pengaturan",
    "/dashboard/users": "Manajemen User",
    "/dashboard/lecturer": "Dashboard Pengajar",
    "/dashboard/lecturer/courses": "Kursus Saya",
    "/dashboard/lecturer/courses/new": "Tambah Kursus",
    "/dashboard/lecturer/students": "Progres Siswa",
};

const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    teacher: "Pengajar",
    student: "Siswa",
};

export default function DashboardHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const pageTitle = breadcrumbMap[pathname] ?? "Dashboard";
    const [user, setUser] = useState<UserSession | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Build breadcrumb segments
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = segments.map((seg, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const label = breadcrumbMap[href] ?? seg;
        const isLast = i === segments.length - 1;
        return { label, href, isLast };
    });

    // Fetch current user
    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (data.user) setUser(data.user);
            })
            .catch(() => {});
    }, []);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
    };

    const initials = user?.name
        ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
        : "A";

    return (
        <header className="sticky top-0 z-20 bg-absolute-white border-b border-neutral-20 px-6 py-4 flex items-center justify-between gap-4">
            {/* Left - Title & Breadcrumb */}
            <div className="flex flex-col gap-0.5">
                <h1 className="text-xl font-bold text-neutral-90">{pageTitle}</h1>
                <nav className="flex items-center gap-1.5 text-xs text-neutral-50">
                    {breadcrumbs.map((crumb, i) => (
                        <span key={crumb.href} className="flex items-center gap-1.5">
                            {i > 0 && (
                                <svg
                                    className="w-3 h-3 text-neutral-30"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            )}
                            <span
                                className={
                                    crumb.isLast
                                        ? "text-primary-base font-medium"
                                        : "text-neutral-40"
                                }
                            >
                                {crumb.label}
                            </span>
                        </span>
                    ))}
                </nav>
            </div>

            {/* Right - Search + Notifications + Avatar */}
            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative hidden md:block">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-40">
                        <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </div>
                    <input
                        type="search"
                        placeholder="Cari..."
                        className="w-52 bg-neutral-0 border border-neutral-20 rounded-xl py-2 pl-9 pr-4 text-sm text-neutral-70 placeholder:text-neutral-40 outline-none focus:border-primary-base transition-all"
                    />
                </div>

                {/* Notifications */}
                <button className="relative p-2 rounded-xl text-neutral-50 hover:bg-neutral-10 hover:text-neutral-80 transition-all">
                    <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 01-3.46 0" />
                    </svg>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-base rounded-full" />
                </button>

                {/* Avatar with dropdown */}
                <div className="relative">
                    <button
                        id="btn-user-menu"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-neutral-10 transition-all"
                    >
                        <div className="w-8 h-8 rounded-full bg-primary-base flex items-center justify-center text-absolute-white text-sm font-bold">
                            {initials}
                        </div>
                        <div className="hidden md:flex flex-col items-start">
                            <span className="text-sm font-semibold text-neutral-80 leading-tight">
                                {user?.name || "Admin"}
                            </span>
                            <span className="text-xs text-neutral-40 leading-tight">
                                {roleLabels[user?.role || ""] || user?.role || "Loading..."}
                            </span>
                        </div>
                        <svg className="w-4 h-4 text-neutral-40 hidden md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {/* Dropdown */}
                    {showUserMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-absolute-white rounded-xl shadow-lg border border-neutral-20 py-1 z-50">
                            <div className="px-4 py-2 border-b border-neutral-10">
                                <p className="text-sm font-semibold text-neutral-80 truncate">{user?.name}</p>
                                <p className="text-xs text-neutral-40 truncate">{user?.email}</p>
                            </div>
                            <button
                                id="btn-logout"
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-error-base hover:bg-error-10 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Keluar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
