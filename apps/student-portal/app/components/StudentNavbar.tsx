"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import type { UserSession } from "@repo/types";
import Link from "next/link";
import Image from "next/image";

type NavbarUser = UserSession & { avatarUrl?: string | null };

export default function StudentNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<NavbarUser | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadUser = () => fetch("/api/profile")
            .then((r) => r.json())
            .then((data) => {
                if (data.profile) setUser({ id: data.profile.id, name: data.profile.nickname || data.profile.name, email: data.profile.email, role: "student", avatarUrl: data.profile.avatar_url });
            })
            .catch(() => {});
        void loadUser();
        window.addEventListener("profile-updated", loadUser);
        return () => window.removeEventListener("profile-updated", loadUser);
    }, []);

    useEffect(() => {
        const closeMenu = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", closeMenu);
        return () => document.removeEventListener("mousedown", closeMenu);
    }, []);

    useEffect(() => setMenuOpen(false), [pathname]);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    };

    const initials = user?.name
        ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
        : "S";

    const pageTitle = pathname.includes("daily-quiz/leaderboard") ? "Leaderboard"
        : pathname.includes("daily-quiz") ? "Daily Quiz"
        : pathname.includes("attendance") ? "Absensi"
        : pathname.includes("grades") ? "Nilai"
        : pathname.includes("schedule") ? "Jadwal"
        : pathname.includes("ebooks") ? "E-Book"
        : pathname.includes("forum") ? "Forum Diskusi"
        : pathname.includes("profile") ? "Profil Pelajar"
        : pathname.includes("settings") ? "Pengaturan"
        : "Beranda Belajar";

    return (
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-white/70 bg-white/75 px-4 backdrop-blur-xl sm:px-8">
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-base">Student Portal</p>
                <p className="text-base font-bold text-[#14213d]">{pageTitle}</p>
            </div>

            <div ref={menuRef} className="relative flex items-center gap-3">
                <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold text-neutral-80">{user?.name ?? "Siswa"}</p>
                    <p className="text-xs text-neutral-40">{user?.email ?? "student"}</p>
                </div>
                <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    className="portal-focus flex h-11 items-center gap-2 rounded-xl border border-white bg-white/90 p-1 pr-2 shadow-sm transition-shadow hover:shadow-md"
                    aria-label="Buka menu akun"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                >
                    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary-base to-primary-80 text-sm font-bold text-white shadow-md shadow-primary-base/20">
                        {user?.avatarUrl ? <Image src={user.avatarUrl} alt="" width={36} height={36} className="h-full w-full object-cover" /> : initials}
                    </span>
                    <ChevronDownIcon className={`h-4 w-4 text-neutral-40 transition-transform ${menuOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>

                {menuOpen && (
                    <div role="menu" className="absolute right-0 top-14 w-64 overflow-hidden rounded-2xl border border-neutral-10 bg-white p-2 shadow-[0_20px_55px_rgba(15,23,42,0.18)]">
                        <div className="border-b border-neutral-10 px-3 py-3 sm:hidden"><p className="truncate text-sm font-bold text-neutral-80">{user?.name ?? "Siswa"}</p><p className="truncate text-xs text-neutral-40">{user?.email}</p></div>
                        <Link role="menuitem" href="/dashboard/profile" className="portal-focus flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-neutral-70 hover:bg-primary-10 hover:text-primary-base"><span aria-hidden="true">👤</span><span><span className="block">Profil Pelajar</span><span className="block text-[10px] font-normal text-neutral-40">Lihat dan edit profil</span></span></Link>
                        <Link role="menuitem" href="/dashboard/settings" className="portal-focus flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-neutral-70 hover:bg-primary-10 hover:text-primary-base"><span aria-hidden="true">⚙️</span><span><span className="block">Pengaturan</span><span className="block text-[10px] font-normal text-neutral-40">Password dan keamanan</span></span></Link>
                        <div className="my-2 border-t border-neutral-10" />
                        <button role="menuitem" id="btn-student-logout" onClick={handleLogout} className="portal-focus flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-error-base hover:bg-error-10"><span aria-hidden="true">↪</span>Keluar</button>
                    </div>
                )}
            </div>
        </header>
    );
}
