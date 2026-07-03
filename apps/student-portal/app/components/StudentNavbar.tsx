"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-10 bg-absolute-white/80 px-4 py-3 backdrop-blur-md sm:px-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-40">Nande Nihon</p>
                <p className="text-sm font-bold text-neutral-90">Student Portal</p>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold text-neutral-80">{user?.name ?? "Siswa"}</p>
                    <p className="text-xs text-neutral-40">{user?.email ?? "student"}</p>
                </div>
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
