"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NandeNihonLogo } from "@repo/ui";

interface NavItem {
    id: string;
    label: string;
    href: string;
    icon: React.ReactNode;
    children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
    {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        id: "students",
        label: "Siswa",
        href: "/dashboard/students",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
        ),
        children: [
            { label: "Daftar Siswa", href: "/dashboard/students" },
            { label: "Tambah Siswa", href: "/dashboard/students/add" },
        ],
    },
    {
        id: "classes",
        label: "Kelas",
        href: "/dashboard/classes",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
        ),
        children: [
            { label: "Daftar Kelas", href: "/dashboard/classes" },
            { label: "Tambah Kelas", href: "/dashboard/classes/add" },
        ],
    },
    {
        id: "seminars",
        label: "Seminar",
        href: "/dashboard/seminars",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
        ),
        children: [
            { label: "Daftar Seminar", href: "/dashboard/seminars" },
            { label: "Pendaftaran", href: "/dashboard/seminars/registrations" },
        ],
    },
    {
        id: "counseling",
        label: "Konseling",
        href: "/dashboard/counseling",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
        ),
    },
    {
        id: "questions",
        label: "Soal & Ujian",
        href: "/dashboard/questions",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeWidth="3" />
            </svg>
        ),
    },
    {
        id: "testimonials",
        label: "Testimoni",
        href: "/dashboard/testimonials",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
        ),
    },
    {
        id: "team",
        label: "Tim",
        href: "/dashboard/team",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
    },
    {
        id: "news",
        label: "Berita & Artikel",
        href: "/dashboard/news",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        ),
    },
    {
        id: "settings",
        label: "Pengaturan",
        href: "/dashboard/settings",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
        ),
    },
    {
        id: "users",
        label: "Manajemen User",
        href: "/dashboard/users",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
        ),
    },
];


export default function DashboardSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [openMenus, setOpenMenus] = useState<string[]>([]);

    const toggleMenu = (id: string) => {
        setOpenMenus((prev) =>
            prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
        );
    };

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    return (
        <aside className="fixed left-0 top-0 w-[260px] min-h-screen flex flex-col bg-absolute-white border-r border-neutral-20 z-30">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-20">
                <div className="bg-primary-base rounded-xl p-2">
                    <NandeNihonLogo
                        variant="favicon"
                        colorMode="white"
                        className="w-8 h-8"
                    />
                </div>
                <div>
                    <p className="text-base font-bold text-neutral-90 leading-tight">
                        Nande Nihon
                    </p>
                    <p className="text-xs text-neutral-50">Admin Portal</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <p className="text-xs font-semibold text-neutral-40 uppercase tracking-wider px-6 mb-3">
                    Menu Utama
                </p>
                <div className="flex flex-col gap-1 px-3">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        const isOpen = openMenus.includes(item.id);
                        const hasChildren = item.children && item.children.length > 0;

                        return (
                            <div key={item.id}>
                                <button
                                    onClick={() => {
                                        if (hasChildren) {
                                            toggleMenu(item.id);
                                            if (!isOpen) router.push(item.href);
                                        } else {
                                            router.push(item.href);
                                        }
                                    }}
                                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active
                                            ? "bg-primary-base text-absolute-white"
                                            : "text-neutral-70 hover:bg-primary-10 hover:text-primary-base"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={
                                                active ? "text-absolute-white" : "text-neutral-50"
                                            }
                                        >
                                            {item.icon}
                                        </span>
                                        <span>{item.label}</span>
                                    </div>
                                    {hasChildren && (
                                        <svg
                                            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                                                } ${active ? "text-absolute-white" : "text-neutral-40"}`}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    )}
                                </button>

                                {/* Submenu */}
                                {hasChildren && (
                                    <div
                                        className={`overflow-hidden transition-all duration-200 ${isOpen
                                                ? "max-h-48 opacity-100 mt-1"
                                                : "max-h-0 opacity-0"
                                            }`}
                                    >
                                        <div className="ml-9 flex flex-col gap-1">
                                            {item.children!.map((child) => (
                                                <button
                                                    key={child.href}
                                                    onClick={() => router.push(child.href)}
                                                    className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${pathname === child.href
                                                            ? "text-primary-base font-semibold bg-primary-10"
                                                            : "text-neutral-60 hover:text-primary-base hover:bg-primary-10"
                                                        }`}
                                                >
                                                    {child.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </nav>


        </aside>
    );
}
