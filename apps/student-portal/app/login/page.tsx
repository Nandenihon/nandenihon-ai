"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Login gagal");
                return;
            }
            router.push("/dashboard");
            router.refresh();
        } catch {
            setError("Tidak dapat terhubung ke server");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-10 via-white to-secondary-10 p-4">
            {/* Decorative orbs */}
            <div className="fixed top-0 left-0 w-72 h-72 bg-primary-20/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-80 h-80 bg-secondary-20/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="card p-8">
                    {/* Logo + Heading */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-base mb-4 shadow-lg shadow-primary-base/30">
                            <span className="text-white text-2xl font-black jp-text">日</span>
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-90">Nande Nihon</h1>
                        <p className="text-sm text-neutral-50 mt-1">Portal Siswa — Masuk ke akun Anda</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 flex items-center gap-3 p-3.5 rounded-xl bg-error-10 border border-error-20 text-error-base text-sm">
                            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" strokeWidth="3" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-1.5" htmlFor="student-email">
                                Email
                            </label>
                            <input
                                id="student-email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@email.com"
                                className="w-full border border-neutral-20 rounded-xl px-4 py-3 text-sm text-neutral-80 placeholder:text-neutral-30 outline-none focus:border-primary-base focus:ring-2 focus:ring-primary-base/20 transition-all bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-1.5" htmlFor="student-password">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="student-password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full border border-neutral-20 rounded-xl px-4 py-3 pr-12 text-sm text-neutral-80 placeholder:text-neutral-30 outline-none focus:border-primary-base focus:ring-2 focus:ring-primary-base/20 transition-all bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-40 hover:text-neutral-70 transition-colors p-1"
                                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                                            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            id="btn-student-login"
                            type="submit"
                            disabled={isLoading}
                            className="btn w-full mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25" />
                                        <path d="M21 12a9 9 0 00-9-9" />
                                    </svg>
                                    Masuk...
                                </>
                            ) : (
                                "Masuk"
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-neutral-40">
                            Belum punya akun?{" "}
                            <a href="https://nandenihon.com" className="text-primary-base hover:underline font-medium">
                                Daftar di nandenihon.com
                            </a>
                        </p>
                    </div>
                </div>

                {/* Tagline */}
                <p className="text-center text-xs text-neutral-40 mt-4 jp-text">
                    日本語を楽しく学ぼう！
                </p>
            </div>
        </main>
    );
}
