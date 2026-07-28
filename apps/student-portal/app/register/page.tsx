"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";

type Step = "identity" | "otp" | "profile";

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("identity");
    const [form, setForm] = useState({
        fullName: "", email: "", otp: "", nickname: "", phoneNumber: "",
        domicile: "", motivation: "", japaneseLevel: "", password: "", passwordConfirmation: "",
    });
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
            const response = await fetch("/api/auth/register/request-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName: form.fullName, email: form.email }),
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
            const response = await fetch("/api/auth/register/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email, otp: form.otp }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Verifikasi gagal");
            if (data.profile?.fullName) update("fullName", data.profile.fullName);
            setStep("profile");
            setMessage("Email berhasil diverifikasi. Lengkapi data diri Anda.");
        } catch (verifyError) {
            setError(verifyError instanceof Error ? verifyError.message : "Verifikasi gagal");
        } finally {
            setIsLoading(false);
        }
    }

    async function completeRegistration(event: React.FormEvent) {
        event.preventDefault();
        setError("");
        if (form.password !== form.passwordConfirmation) {
            setError("Konfirmasi password tidak sama");
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/register/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Pendaftaran gagal");
            router.push("/dashboard");
            router.refresh();
        } catch (completeError) {
            setError(completeError instanceof Error ? completeError.message : "Pendaftaran gagal");
        } finally {
            setIsLoading(false);
        }
    }

    const currentStep = step === "identity" ? 1 : step === "otp" ? 2 : 3;

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-10 via-white to-secondary-10 p-4 py-10">
            <div className="relative w-full max-w-lg">
                <div className="card p-8">
                    <div className="text-center mb-7">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-base mb-4 shadow-lg shadow-primary-base/30">
                            <span className="text-white text-2xl font-black jp-text">日</span>
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-90">Daftar Siswa</h1>
                        <p className="text-sm text-neutral-50 mt-1">
                            {step === "identity" ? "Mulai dengan nama dan email Anda" : step === "otp" ? "Verifikasi email Anda" : "Lengkapi profil Anda"}
                        </p>
                    </div>

                    <div className="flex gap-2 mb-6" aria-label={`Langkah ${currentStep} dari 3`}>
                        {[1, 2, 3].map((value) => <div key={value} className={`h-1.5 flex-1 rounded-full ${currentStep >= value ? "bg-primary-base" : "bg-neutral-20"}`} />)}
                    </div>

                    {error && <div role="alert" className="mb-5 p-3.5 rounded-xl bg-error-10 border border-error-20 text-error-base text-sm">{error}</div>}
                    {message && <div className="mb-5 p-3.5 rounded-xl bg-primary-10 border border-primary-20 text-primary-base text-sm">{message}</div>}

                    {step === "identity" && (
                        <form onSubmit={requestOtp} className="space-y-4">
                            <Field label="Nama lengkap" id="register-full-name"><input id="register-full-name" autoComplete="name" required minLength={2} maxLength={255} value={form.fullName} onChange={(event) => update("fullName", event.target.value)} className="form-control" /></Field>
                            <Field label="Email" id="register-email"><input id="register-email" type="email" autoComplete="email" required value={form.email} onChange={(event) => update("email", event.target.value)} className="form-control" /></Field>
                            <button type="submit" disabled={isLoading} className="btn w-full">{isLoading ? "Mengirim kode..." : "Verifikasi Email"}</button>
                        </form>
                    )}

                    {step === "otp" && (
                        <form onSubmit={verifyOtp} className="space-y-5">
                            <p className="text-center text-sm text-neutral-60">Kode 6 angka dikirim ke <strong>{form.email}</strong></p>
                            <Field label="Kode OTP" id="register-otp"><input id="register-otp" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} value={form.otp} onChange={(event) => update("otp", event.target.value.replace(/\D/g, "").slice(0, 6))} className="form-control text-center text-2xl font-bold tracking-[0.35em]" autoFocus /></Field>
                            <button type="submit" disabled={isLoading || form.otp.length !== 6} className="btn w-full">{isLoading ? "Memverifikasi..." : "Verifikasi Email"}</button>
                            <div className="flex justify-between text-sm">
                                <button type="button" onClick={() => { setStep("identity"); setError(""); setMessage(""); update("otp", ""); }} className="text-neutral-50 hover:text-primary-base">Ubah email</button>
                                <button type="button" onClick={() => requestOtp()} disabled={cooldown > 0 || isLoading} className="font-semibold text-primary-base disabled:text-neutral-30">{cooldown > 0 ? `Kirim ulang (${cooldown})` : "Kirim ulang OTP"}</button>
                            </div>
                        </form>
                    )}

                    {step === "profile" && (
                        <form onSubmit={completeRegistration} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Nama lengkap" id="profile-full-name"><input id="profile-full-name" required minLength={2} maxLength={255} value={form.fullName} onChange={(event) => update("fullName", event.target.value)} className="form-control" /></Field>
                            <Field label="Nama panggilan" id="profile-nickname"><input id="profile-nickname" required maxLength={100} value={form.nickname} onChange={(event) => update("nickname", event.target.value)} className="form-control" /></Field>
                            <div className="sm:col-span-2"><Field label="Email terverifikasi" id="profile-email"><input id="profile-email" value={form.email} readOnly className="form-control bg-neutral-10" /></Field></div>
                            <Field label="Nomor telepon" id="profile-phone"><input id="profile-phone" type="tel" autoComplete="tel" required minLength={7} maxLength={30} value={form.phoneNumber} onChange={(event) => update("phoneNumber", event.target.value)} className="form-control" /></Field>
                            <Field label="Domisili" id="profile-domicile"><input id="profile-domicile" required minLength={2} maxLength={255} value={form.domicile} onChange={(event) => update("domicile", event.target.value)} className="form-control" /></Field>
                            <div className="sm:col-span-2"><Field label="Level bahasa Jepang" id="profile-level"><select id="profile-level" required value={form.japaneseLevel} onChange={(event) => update("japaneseLevel", event.target.value)} className="form-control"><option value="">Pilih level</option><option value="BEGINNER">Pemula</option>{["N5", "N4", "N3", "N2", "N1"].map((level) => <option key={level} value={level}>{level}</option>)}</select></Field></div>
                            <div className="sm:col-span-2"><Field label="Motivasi belajar bahasa Jepang" id="profile-motivation"><textarea id="profile-motivation" required minLength={10} maxLength={2000} rows={4} value={form.motivation} onChange={(event) => update("motivation", event.target.value)} className="form-control" /></Field></div>
                            <PasswordField label="Password" id="profile-password" value={form.password} visible={showPassword} onChange={(value) => update("password", value)} onToggle={() => setShowPassword((value) => !value)} />
                            <PasswordField label="Konfirmasi password" id="profile-password-confirmation" value={form.passwordConfirmation} visible={showPasswordConfirmation} onChange={(value) => update("passwordConfirmation", value)} onToggle={() => setShowPasswordConfirmation((value) => !value)} />
                            <button type="submit" disabled={isLoading} className="btn w-full sm:col-span-2">{isLoading ? "Menyimpan..." : "Selesaikan Pendaftaran"}</button>
                        </form>
                    )}

                    <p className="mt-6 text-center text-xs text-neutral-40">Sudah punya akun? <Link href="/login" className="font-semibold text-primary-base hover:underline">Login</Link></p>
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
