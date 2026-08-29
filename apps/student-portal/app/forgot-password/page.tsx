"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import Image from "next/image";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("email");
    const [form, setForm] = useState({ email: "", otp: "", password: "", passwordConfirmation: "" });
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
        return () => window.clearInterval(timer);
    }, [cooldown]);

    function update(field: keyof typeof form, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    async function requestOtp(event?: React.FormEvent) {
        event?.preventDefault();
        setError("");
        setMessage("");
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/forgot-password/request-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Gagal mengirim OTP");
            update("email", data.email);
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
            const response = await fetch("/api/auth/forgot-password/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email, otp: form.otp }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Verifikasi gagal");
            setStep("password");
            setMessage("Kode terverifikasi. Buat password baru Anda.");
        } catch (verifyError) {
            setError(verifyError instanceof Error ? verifyError.message : "Verifikasi gagal");
        } finally {
            setIsLoading(false);
        }
    }

    async function resetPassword(event: React.FormEvent) {
        event.preventDefault();
        setError("");
        if (form.password !== form.passwordConfirmation) {
            setError("Konfirmasi password tidak sama");
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/forgot-password/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: form.password, passwordConfirmation: form.passwordConfirmation }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Gagal mereset password");
            router.push("/login");
            router.refresh();
        } catch (resetError) {
            setError(resetError instanceof Error ? resetError.message : "Gagal mereset password");
        } finally {
            setIsLoading(false);
        }
    }

    const currentStep = step === "email" ? 1 : step === "otp" ? 2 : 3;

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-10 via-white to-secondary-10 p-4">
            <div className="fixed top-0 left-0 w-72 h-72 bg-primary-20/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-80 h-80 bg-secondary-20/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="relative w-full max-w-md">
                <div className="card p-8">
                    <div className="text-center mb-7">
                        <div className="flex items-center justify-center w-full h-full mb-4">
                            <Image src="/images/logo-icon.svg" alt="Nande Nihon" width={80} height={80} />
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-90">Lupa Password</h1>
                        <p className="text-sm text-neutral-50 mt-1">
                            {step === "email" ? "Masukkan email akun siswa Anda" : step === "otp" ? "Verifikasi kode OTP" : "Buat password baru"}
                        </p>
                    </div>

                    <div className="flex gap-2 mb-6" aria-label={`Langkah ${currentStep} dari 3`}>
                        {[1, 2, 3].map((value) => <div key={value} className={`h-1.5 flex-1 rounded-full ${currentStep >= value ? "bg-primary-base" : "bg-neutral-20"}`} />)}
                    </div>

                    {error && <div role="alert" className="mb-5 p-3.5 rounded-xl bg-error-10 border border-error-20 text-error-base text-sm">{error}</div>}
                    {message && <div className="mb-5 p-3.5 rounded-xl bg-primary-10 border border-primary-20 text-primary-base text-sm">{message}</div>}

                    {step === "email" && (
                        <form onSubmit={requestOtp} className="space-y-4">
                            <Field label="Email" id="forgot-email">
                                <input
                                    id="forgot-email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={form.email}
                                    onChange={(event) => update("email", event.target.value)}
                                    placeholder="nama@email.com"
                                    className="form-control"
                                />
                            </Field>
                            <button type="submit" disabled={isLoading} className="btn w-full">{isLoading ? "Mengirim kode..." : "Kirim Kode OTP"}</button>
                        </form>
                    )}

                    {step === "otp" && (
                        <form onSubmit={verifyOtp} className="space-y-5">
                            <p className="text-center text-sm text-neutral-60">Kode 6 angka dikirim ke <strong>{form.email}</strong></p>
                            <Field label="Kode OTP" id="forgot-otp">
                                <input
                                    id="forgot-otp"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    required
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                    value={form.otp}
                                    onChange={(event) => update("otp", event.target.value.replace(/\D/g, "").slice(0, 6))}
                                    className="form-control text-center text-2xl font-bold tracking-[0.35em]"
                                    autoFocus
                                />
                            </Field>
                            <button type="submit" disabled={isLoading || form.otp.length !== 6} className="btn w-full">{isLoading ? "Memverifikasi..." : "Verifikasi Kode"}</button>
                            <div className="flex justify-between text-sm">
                                <button type="button" onClick={() => { setStep("email"); setError(""); setMessage(""); update("otp", ""); }} className="text-neutral-50 hover:text-primary-base">Ubah email</button>
                                <button type="button" onClick={() => requestOtp()} disabled={cooldown > 0 || isLoading} className="font-semibold text-primary-base disabled:text-neutral-30">{cooldown > 0 ? `Kirim ulang (${cooldown})` : "Kirim ulang OTP"}</button>
                            </div>
                        </form>
                    )}

                    {step === "password" && (
                        <form onSubmit={resetPassword} className="space-y-4">
                            <PasswordField label="Password baru" id="forgot-password" value={form.password} visible={showPassword} onChange={(value) => update("password", value)} onToggle={() => setShowPassword((value) => !value)} />
                            <PasswordField label="Konfirmasi password baru" id="forgot-password-confirmation" value={form.passwordConfirmation} visible={showPasswordConfirmation} onChange={(value) => update("passwordConfirmation", value)} onToggle={() => setShowPasswordConfirmation((value) => !value)} />
                            <button type="submit" disabled={isLoading} className="btn w-full">{isLoading ? "Menyimpan..." : "Reset Password"}</button>
                        </form>
                    )}

                    <p className="mt-6 text-center text-xs text-neutral-40">
                        Ingat password Anda?{" "}
                        <Link href="/login" className="font-semibold text-primary-base hover:underline">Kembali ke Login</Link>
                    </p>
                </div>
            </div>
        </main>
    );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
    return <div><label className="block text-sm font-medium text-neutral-70 mb-1.5" htmlFor={id}>{label}</label>{children}</div>;
}

function PasswordField({ label, id, value, visible, onChange, onToggle }: {
    label: string;
    id: string;
    value: string;
    visible: boolean;
    onChange: (value: string) => void;
    onToggle: () => void;
}) {
    const VisibilityIcon = visible ? EyeClosedIcon : EyeOpenIcon;
    return (
        <Field label={label} id={id}>
            <div className="relative">
                <input id={id} type={visible ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={128} value={value} onChange={(event) => onChange(event.target.value)} className="form-control pr-11" />
                <button type="button" onClick={onToggle} aria-label={visible ? `Sembunyikan ${label.toLowerCase()}` : `Tampilkan ${label.toLowerCase()}`} aria-pressed={visible} className="portal-focus absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-40 transition hover:bg-primary-10 hover:text-primary-base">
                    <VisibilityIcon className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </Field>
    );
}
