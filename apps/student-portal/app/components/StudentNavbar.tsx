"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NandeNihonLogo } from "@repo/ui";
import type { UserSession } from "@repo/types";

export default function StudentNavbar() {
    const router = useRouter();
    const [user, setUser] = useState<UserSession | null>(null);

    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((d) => { if (d.user) setUser(d.user); })
            .catch(() => {});
    }, []);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    };

    const initials = user?.name
        ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
        : "S";

    return (
        <header className="sticky top-0 z-30 bg-absolute-white/80 backdrop-blur-md border-b border-neutral-10 px-6 py-3 flex items-center justify-between">
            <a href="/dashboard" className="flex items-center gap-3">
                <div className="bg-primary-base rounded-xl p-1.5">
                    <NandeNihonLogo variant="favicon" colorMode="white" className="w-6 h-6" />
                </div>
                <span className="font-bold text-neutral-90 text-sm hidden sm:block">Nande Nihon</span>
            </a>

            <nav className="hidden md:flex items-center gap-1">
                <a
                    href="/dashboard"
                    className="px-3 py-2 text-sm text-neutral-60 hover:text-primary-base hover:bg-primary-10 rounded-lg transition-all"
                >
                    Dashboard
                </a>
            </nav>

            <div className="flex items-center gap-3">
                <div
                    className="w-8 h-8 rounded-full bg-primary-base flex items-center justify-center text-white text-sm font-bold"
                    title={user?.name}
                >
                    {initials}
                </div>
                <button
                    id="btn-student-logout"
                    onClick={handleLogout}
                    className="text-xs text-neutral-50 hover:text-error-base transition-colors hidden sm:block"
                >
                    Keluar
                </button>
            </div>
        </header>
    );
}
