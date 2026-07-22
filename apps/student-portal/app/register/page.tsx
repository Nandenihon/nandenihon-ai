"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<"form" | "otp">("form");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
        return () => window.clearInterval(timer);
    }, [cooldown]);

    async function requestOtp(event?: React.FormEvent) {
        event?.preventDefault();
        setError("");
        setMessage("");
        if (password !== confirmPassword) {
            setError("Konfirmasi password tidak sama");
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/register/request-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Gagal mengirim OTP");
            setEmail(data.email);
            setStep("otp");
            setCooldown(60);
            setMessage("Kode verifikasi telah dikirim ke email Anda.");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Gagal mengirim OTP");
        } finally {
            setIsLoading(false);
        }
    }

    async function verifyOtp(event: React.FormEvent) {
        event.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/register/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Verifikasi gagal");
            router.push("/dashboard");
            router.refresh();
        } catch (verifyError) {
            setError(verifyError instanceof Error ? verifyError.message : "Verifikasi gagal");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-10 via-white to-secondary-10 p-4 py-10">
            <div className="fixed top-0 left-0 w-72 h-72 bg-primary-20/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-80 h-80 bg-secondary-20/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="relative w-full max-w-md">
                <div className="card p-8">
                    <div className="text-center mb-7">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-base mb-4 shadow-lg shadow-primary-base/30">
                            <span className="text-white text-2xl font-black jp-text">日</span>
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-90">Daftar Akun Siswa</h1>
                        <p className="text-sm text-neutral-50 mt-1">
                            {step === "form" ? "Mulai perjalanan belajar Bahasa Jepang Anda" : "Verifikasi email Anda"}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 mb-6" aria-label={`Langkah ${step === "form" ? 1 : 2} dari 2`}>
                        <div className="h-1.5 flex-1 rounded-full bg-primary-base" />
                        <div className={`h-1.5 flex-1 rounded-full ${step === "otp" ? "bg-primary-base" : "bg-neutral-20"}`} />
                    </div>

                    {error && <div role="alert" className="mb-5 p-3.5 rounded-xl bg-error-10 border border-error-20 text-error-base text-sm">{error}</div>}
                    {message && <div className="mb-5 p-3.5 rounded-xl bg-primary-10 border border-primary-20 text-primary-base text-sm">{message}</div>}

                    {step === "form" ? (
                        <form onSubmit={requestOtp} className="space-y-4">
                            <Field label="Nama lengkap" id="register-name">
                                <input id="register-name" autoComplete="name" required minLength={2} maxLength={255} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama lengkap Anda" className="form-control" />
                            </Field>
                            <Field label="Email" id="register-email">
                                <input id="register-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" className="form-control" />
                            </Field>
                            <Field label="Password" id="register-password">
                                <input id="register-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimal 8 karakter" className="form-control" />
                            </Field>
                            <Field label="Konfirmasi password" id="register-confirm-password">
                                <input id="register-confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Ulangi password" className="form-control" />
                            </Field>
                            <button type="submit" disabled={isLoading} className="btn w-full mt-2">
                                {isLoading ? "Mengirim kode..." : "Daftar & Kirim OTP"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={verifyOtp} className="space-y-5">
                            <div className="text-center text-sm text-neutral-60">
                                Kode 6 angka dikirim ke <strong className="text-neutral-80">{email}</strong>
                            </div>
                            <Field label="Kode OTP" id="register-otp">
                                <input id="register-otp" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="form-control text-center text-2xl font-bold tracking-[0.35em]" autoFocus />
                            </Field>
                            <button type="submit" disabled={isLoading || otp.length !== 6} className="btn w-full">
                                {isLoading ? "Memverifikasi..." : "Verifikasi & Masuk"}
                            </button>
                            <div className="flex items-center justify-between text-sm">
                                <button type="button" onClick={() => { setStep("form"); setOtp(""); setError(""); setMessage(""); }} className="text-neutral-50 hover:text-primary-base">Ubah email</button>
                                <button type="button" onClick={() => requestOtp()} disabled={cooldown > 0 || isLoading} className="font-semibold text-primary-base disabled:text-neutral-30">
                                    {cooldown > 0 ? `Kirim ulang (${cooldown})` : "Kirim ulang OTP"}
                                </button>
                            </div>
                        </form>
                    )}

                    <p className="mt-6 text-center text-xs text-neutral-40">
                        Sudah punya akun? <Link href="/login" className="font-semibold text-primary-base hover:underline">Login</Link>
                    </p>
                </div>
                <p className="text-center text-xs text-neutral-40 mt-4 jp-text">日本語を楽しく学ぼう！</p>
            </div>
        </main>
    );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
    return <div><label className="block text-sm font-medium text-neutral-70 mb-1.5" htmlFor={id}>{label}</label>{children}</div>;
}
