"use client";

import { usePathname } from "next/navigation";
import { NandeNihonLogo } from "@repo/ui";
import Link from "next/link";
import {
    BackpackIcon, BarChartIcon, CalendarIcon, ChatBubbleIcon, CheckCircledIcon,
    DashboardIcon, QuestionMarkCircledIcon, ReaderIcon, StarIcon,
} from "@radix-ui/react-icons";

const primaryItems = [
    { href: "/dashboard", label: "Beranda", icon: DashboardIcon },
    { href: "/dashboard/class-catalog", label: "Katalog Kelas", icon: BackpackIcon },
    { href: "/dashboard/assignments", label: "Tugas", icon: CheckCircledIcon },
    { href: "/dashboard/attendance", label: "Absensi", icon: CheckCircledIcon },
    { href: "/dashboard/grades", label: "Nilai", icon: BarChartIcon },
    { href: "/dashboard/ebooks", label: "E-Book", icon: ReaderIcon, mobile: false },
    { href: "/dashboard/schedule", label: "Jadwal", icon: CalendarIcon },
];

const activityItems = [
    { href: "/dashboard/daily-quiz", label: "Quiz", icon: QuestionMarkCircledIcon },
    { href: "/dashboard/daily-quiz/leaderboard", label: "Leaderboard", icon: StarIcon, mobile: false },
    { href: "/dashboard/forum", label: "Forum Diskusi", icon: ChatBubbleIcon, mobile: false },
];

function MenuIcon({ name }: { name: string | React.ComponentType<{ className?: string }> }) {
    const common = "w-4 h-4";
    if (typeof name !== "string") {
        const Icon = name;
        return <Icon className={common} aria-hidden="true" />;
    }

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

function SidebarLink({ item }: { item: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; mobile?: boolean } }) {
    const pathname = usePathname();
    const isActive = item.href === "/dashboard" || item.href === "/dashboard/daily-quiz"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
        <Link
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`${item.mobile === false ? "hidden lg:flex" : "flex"} portal-focus h-12 flex-col items-center justify-center gap-1 rounded-xl px-3 text-[10px] font-semibold transition-all lg:h-11 lg:flex-row lg:justify-start lg:gap-3 lg:text-sm ${
                isActive
                    ? "bg-primary-base text-white shadow-lg shadow-primary-base/20"
                    : "text-neutral-50 hover:bg-primary-10 hover:text-primary-base"
            }`}
        >
            <MenuIcon name={item.icon} />
            <span>{item.label}</span>
        </Link>
    );
}

export default function StudentSidebar() {
    return (
        <aside className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-shrink-0 lg:flex-col lg:border-r lg:border-white/80 lg:bg-white/80 lg:backdrop-blur-xl">
            <div className="hidden h-16 items-center gap-3 border-b border-neutral-10 px-5 lg:flex">
                <div className="rounded-xl bg-primary-base p-1.5">
                    <NandeNihonLogo variant="favicon" colorMode="white" className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-bold text-neutral-90">Student Portal</p>
                    <p className="text-xs text-neutral-40 jp-text">学習ダッシュボード</p>
                </div>
            </div>

            <div className="fixed inset-x-3 bottom-3 z-50 flex justify-around rounded-2xl border border-white/80 bg-white/90 p-2 shadow-[0_16px_45px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:static lg:flex-1 lg:block lg:space-y-6 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-4 lg:shadow-none">
                <nav aria-label="Navigasi utama" className="contents lg:block lg:space-y-1">
                    {primaryItems.map((item) => (
                        <SidebarLink key={item.href} item={item} />
                    ))}
                </nav>

                <div className="hidden lg:block">
                    <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-40">
                        Aktivitas
                    </p>
                    <nav aria-label="Aktivitas belajar" className="space-y-1">
                        {activityItems.map((item) => (
                            <SidebarLink key={item.href} item={item} />
                        ))}
                    </nav>
                </div>

                <nav aria-label="Aktivitas belajar" className="contents lg:hidden">
                    {activityItems.map((item) => (
                        <SidebarLink key={item.href} item={item} />
                    ))}
                </nav>
            </div>

            <div className="hidden border-t border-neutral-10 px-5 py-4 text-xs leading-relaxed text-neutral-40 lg:block">Belajar konsisten, sedikit demi sedikit.<br /><span className="jp-text text-primary-base">毎日少しずつ！</span></div>
        </aside>
    );
}
