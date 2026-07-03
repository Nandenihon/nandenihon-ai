"use client";

import { usePathname, useRouter } from "next/navigation";
import { NandeNihonLogo } from "@repo/ui";

const primaryItems = [
    { href: "/dashboard", label: "Dashboard", icon: "grid" },
    { href: "/dashboard/attendance", label: "Absensi", icon: "check" },
    { href: "/dashboard/grades", label: "Nilai", icon: "chart" },
    { href: "/dashboard/ebooks", label: "E-Book", icon: "book" },
    { href: "/dashboard/schedule", label: "Jadwal", icon: "calendar" },
];

const activityItems = [
    { href: "/dashboard/daily-quiz", label: "Daily Quiz", icon: "question" },
    { href: "/dashboard/daily-quiz/leaderboard", label: "Leaderboard", icon: "trophy" },
    { href: "/dashboard/forum", label: "Forum Diskusi", icon: "chat" },
];

function MenuIcon({ name }: { name: string }) {
    const common = "w-4 h-4";

    if (name === "check") {
        return (
            <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
        );
    }
    if (name === "chart") {
        return (
            <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="M7 15l4-4 3 3 5-7" />
            </svg>
        );
    }
    if (name === "book") {
        return (
            <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z" />
            </svg>
        );
    }
    if (name === "calendar") {
        return (
            <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
        );
    }
    if (name === "question") {
        return (
            <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
            </svg>
        );
    }
    if (name === "trophy") {
        return (
            <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 21h8" />
                <path d="M12 17v4" />
                <path d="M7 4h10v5a5 5 0 01-10 0V4z" />
                <path d="M5 5H3v2a4 4 0 004 4" />
                <path d="M19 5h2v2a4 4 0 01-4 4" />
            </svg>
        );
    }
    if (name === "chat") {
        return (
            <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
            </svg>
        );
    }

    return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
    );
}

function SidebarLink({ item }: { item: { href: string; label: string; icon: string } }) {
    const pathname = usePathname();
    const isActive = item.href === "/dashboard"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
        <a
            href={item.href}
            className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                isActive
                    ? "bg-primary-base text-white"
                    : "text-neutral-60 hover:bg-primary-10 hover:text-primary-base"
            }`}
        >
            <MenuIcon name={item.icon} />
            <span>{item.label}</span>
        </a>
    );
}

export default function StudentSidebar() {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    };

    return (
        <aside className="w-full border-b border-neutral-20 bg-absolute-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:flex-shrink-0 lg:border-b-0 lg:border-r">
            <div className="hidden h-16 items-center gap-3 border-b border-neutral-10 px-5 lg:flex">
                <div className="rounded-xl bg-primary-base p-1.5">
                    <NandeNihonLogo variant="favicon" colorMode="white" className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-bold text-neutral-90">Student Portal</p>
                    <p className="text-xs text-neutral-40 jp-text">学習ダッシュボード</p>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto px-4 py-3 lg:block lg:space-y-6 lg:overflow-visible lg:p-4">
                <nav className="flex min-w-max gap-2 lg:block lg:min-w-0 lg:space-y-1">
                    {primaryItems.map((item) => (
                        <SidebarLink key={item.href} item={item} />
                    ))}
                </nav>

                <div className="hidden lg:block">
                    <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-40">
                        Aktivitas
                    </p>
                    <nav className="space-y-1">
                        {activityItems.map((item) => (
                            <SidebarLink key={item.href} item={item} />
                        ))}
                    </nav>
                </div>

                <nav className="flex min-w-max gap-2 lg:hidden">
                    {activityItems.map((item) => (
                        <SidebarLink key={item.href} item={item} />
                    ))}
                </nav>
            </div>

            <div className="hidden border-t border-neutral-10 p-4 lg:block">
                <button
                    onClick={handleLogout}
                    className="flex h-10 w-full items-center justify-center rounded-lg border border-neutral-20 text-sm font-medium text-neutral-60 transition-colors hover:border-error-base hover:text-error-base"
                >
                    Keluar
                </button>
            </div>
        </aside>
    );
}
