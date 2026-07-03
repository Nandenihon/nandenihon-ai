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

const lecturerNavItems: NavItem[] = [
    {
        id: "lecturer-dashboard",
        label: "Dashboard",
        href: "/dashboard/lecturer",
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
        id: "lecturer-courses",
        label: "Kursus Saya",
        href: "/dashboard/lecturer/courses",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
        ),
        children: [
            { label: "Daftar Kursus", href: "/dashboard/lecturer/courses" },
            { label: "Tambah Kursus", href: "/dashboard/lecturer/courses/new" },
        ],
    },
    {
        id: "lecturer-students",
        label: "Progres Siswa",
        href: "/dashboard/lecturer/students",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
        ),
    },
];

export default function LecturerSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [openMenus, setOpenMenus] = useState<string[]>([]);

    const toggleMenu = (id: string) => {
        setOpenMenus((prev) =>
            prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
        );
    };

    const isActive = (href: string) => {
        if (href === "/dashboard/lecturer") return pathname === "/dashboard/lecturer";
        return pathname.startsWith(href);
    };

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
    };

    return (
        <aside className="fixed left-0 top-0 w-[260px] min-h-screen flex flex-col bg-absolute-white border-r border-neutral-20 z-30">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-20">
                <div className="bg-secondary-base rounded-xl p-2">
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
                    <p className="text-xs text-secondary-base font-semibold">Portal Pengajar</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <p className="text-xs font-semibold text-neutral-40 uppercase tracking-wider px-6 mb-3">
                    Menu Pengajar
                </p>
                <div className="flex flex-col gap-1 px-3">
                    {lecturerNavItems.map((item) => {
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
                                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        active
                                            ? "bg-secondary-base text-absolute-white"
                                            : "text-neutral-70 hover:bg-secondary-10 hover:text-secondary-base"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={active ? "text-absolute-white" : "text-neutral-50"}>
                                            {item.icon}
                                        </span>
                                        <span>{item.label}</span>
                                    </div>
                                    {hasChildren && (
                                        <svg
                                            className={`w-4 h-4 transition-transform duration-200 ${
                                                isOpen ? "rotate-180" : ""
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

                                {hasChildren && (
                                    <div
                                        className={`overflow-hidden transition-all duration-200 ${
                                            isOpen ? "max-h-48 opacity-100 mt-1" : "max-h-0 opacity-0"
                                        }`}
                                    >
                                        <div className="ml-9 flex flex-col gap-1">
                                            {item.children!.map((child) => (
                                                <button
                                                    key={child.href}
                                                    onClick={() => router.push(child.href)}
                                                    className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${
                                                        pathname === child.href
                                                            ? "text-secondary-base font-semibold bg-secondary-10"
                                                            : "text-neutral-60 hover:text-secondary-base hover:bg-secondary-10"
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

            {/* Logout */}
            <div className="px-3 py-4 border-t border-neutral-20">
                <button
                    id="btn-lecturer-logout"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-60 hover:bg-error-10 hover:text-error-base transition-all group"
                >
                    <svg
                        className="w-5 h-5 text-neutral-40 group-hover:text-error-base"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Keluar</span>
                </button>
            </div>
        </aside>
    );
}
