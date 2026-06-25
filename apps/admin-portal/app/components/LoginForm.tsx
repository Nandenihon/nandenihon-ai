"use client";

import { useState } from "react";
import { NandeNihonLogo } from "@repo/ui";

interface LoginFormProps {
    onLogin: (email: string, password: string) => void;
    externalError?: string;
}


export default function LoginForm({ onLogin, externalError }: LoginFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const displayError = externalError || error;


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Email dan password wajib diisi.");
            return;
        }

        setIsLoading(true);
        try {
            await onLogin(email, password);
        } catch {
            setError("Login gagal. Periksa email dan password Anda.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary-base flex-col items-center justify-center relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-primary-80 opacity-40" />
                    <div className="absolute bottom-[-80px] right-[-80px] w-[300px] h-[300px] rounded-full bg-primary-70 opacity-30" />
                    <div className="absolute top-1/2 right-[-60px] w-[200px] h-[200px] rounded-full bg-primary-90 opacity-20" />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-8 px-12 text-center">
                    <NandeNihonLogo
                        variant="favicon"
                        colorMode="white"
                        className="w-20 h-20"
                    />

                    <div className="flex flex-col gap-4">
                        <h1 className="text-3xl font-bold text-absolute-white leading-tight">
                            Nande Nihon
                        </h1>
                        <p className="text-xl font-medium text-primary-20 leading-relaxed">
                            Admin Portal
                        </p>
                        <p className="text-base text-primary-30 max-w-sm leading-relaxed">
                            Platform manajemen pembelajaran bahasa Jepang terpadu untuk
                            mengoptimalkan pengalaman belajar siswa.
                        </p>
                    </div>

                    {/* Feature highlights */}
                    <div className="flex flex-col gap-3 mt-4 w-full max-w-xs">
                        {[
                            { icon: "📚", text: "Manajemen Kelas & Materi" },
                            { icon: "👥", text: "Data Siswa Terpusat" },
                            { icon: "📊", text: "Laporan & Analitik" },
                            { icon: "🎯", text: "Manajemen Seminar" },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 bg-primary-80 bg-opacity-40 rounded-xl px-4 py-3"
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-sm font-medium text-primary-10">
                                    {item.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center bg-absolute-bg px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="flex items-center gap-3">
                            <NandeNihonLogo
                                variant="favicon"
                                colorMode="white"
                                className="w-12 h-12"
                            />
                            <span className="text-xl font-bold text-primary-base">
                                Nande Nihon
                            </span>
                        </div>
                    </div>

                    <div className="bg-absolute-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
                        {/* Header */}
                        <div className="flex flex-col gap-2">
                            <h2 className="text-2xl font-bold text-neutral-90">
                                Selamat datang kembali 👋
                            </h2>
                            <p className="text-sm text-neutral-50">
                                Masuk ke Admin Portal Nande Nihon
                            </p>
                        </div>

                        {/* Error message */}
                        {displayError && (
                            <div className="bg-error-10 border border-error-base rounded-lg px-4 py-3 flex items-center gap-2">

                                <svg
                                    className="w-4 h-4 text-error-base flex-shrink-0"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="text-sm text-error-base">{displayError}</span>

                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {/* Email */}
                            <div className="flex flex-col gap-1">
                                <label
                                    htmlFor="email"
                                    className="text-sm font-semibold text-neutral-70"
                                >
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-40">
                                        <svg
                                            className="w-5 h-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@nandenihon.com"
                                        className="w-full bg-neutral-0 border border-neutral-30 rounded-lg py-3 pl-10 pr-4 text-base font-medium text-neutral-90 placeholder:text-neutral-40 outline-none focus:border-primary-base focus:border-2 transition-all"
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="flex flex-col gap-1">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-semibold text-neutral-70"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-40">
                                        <svg
                                            className="w-5 h-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Masukkan password"
                                        className="w-full bg-neutral-0 border border-neutral-30 rounded-lg py-3 pl-10 pr-12 text-base font-medium text-neutral-90 placeholder:text-neutral-40 outline-none focus:border-primary-base focus:border-2 transition-all"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-40 hover:text-neutral-70 transition-colors"
                                        aria-label={
                                            showPassword
                                                ? "Sembunyikan password"
                                                : "Tampilkan password"
                                        }
                                    >
                                        {showPassword ? (
                                            <svg
                                                className="w-5 h-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                                                    clipRule="evenodd"
                                                />
                                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="w-5 h-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path
                                                    fillRule="evenodd"
                                                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot password */}
                            <div className="flex justify-end -mt-2">
                                <button
                                    type="button"
                                    className="text-sm font-medium text-primary-base hover:text-primary-80 transition-colors"
                                >
                                    Lupa password?
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                id="btn-login"
                                className="w-full bg-primary-base text-absolute-white font-semibold text-base py-3 px-6 rounded-xl hover:bg-primary-80 active:bg-primary-100 disabled:bg-neutral-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <svg
                                            className="animate-spin w-5 h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                        <span>Memuat...</span>
                                    </>
                                ) : (
                                    "Masuk"
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-neutral-40 mt-6">
                        © {new Date().getFullYear()} Nande Nihon. Hak cipta dilindungi.
                    </p>
                </div>
            </div>
        </div>
    );
}
