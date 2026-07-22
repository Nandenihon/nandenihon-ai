"use client";

import { useState } from "react";

export default function SettingsPage() {
    const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [show, setShow] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

    async function updatePassword(event: React.FormEvent) {
        event.preventDefault(); setNotice(null);
        if (form.newPassword !== form.confirmPassword) return setNotice({ type: "error", text: "Konfirmasi password baru tidak sama." });
        setSaving(true);
        try {
            const response = await fetch("/api/profile/password", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            const data = await response.json(); if (!response.ok) throw new Error(data.error);
            setForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); setNotice({ type: "success", text: data.message });
        } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Gagal memperbarui password" }); }
        finally { setSaving(false); }
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-8">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-base">Akun</p><h1 className="mt-1 text-2xl font-black text-[#14213d]">Pengaturan</h1><p className="mt-2 text-sm text-neutral-50">Kelola keamanan dan preferensi akun belajarmu.</p></div>
            {notice && <div role={notice.type === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${notice.type === "success" ? "border-success-20 bg-success-10 text-success-100" : "border-error-20 bg-error-10 text-error-100"}`}>{notice.text}</div>}
            <section className="portal-card p-5 sm:p-7"><div className="mb-6 flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-10 text-xl" aria-hidden="true">🔐</div><div><h2 className="font-extrabold text-[#14213d]">Ubah password</h2><p className="mt-1 text-sm text-neutral-50">Gunakan minimal 8 karakter dan jangan gunakan password yang sama.</p></div></div>
                <form onSubmit={updatePassword} className="max-w-xl space-y-5">
                    {[{ key: "currentPassword", label: "Password saat ini", auto: "current-password" }, { key: "newPassword", label: "Password baru", auto: "new-password" }, { key: "confirmPassword", label: "Konfirmasi password baru", auto: "new-password" }].map((field) => <label key={field.key} className="block text-sm font-semibold text-neutral-70">{field.label}<input type={show ? "text" : "password"} autoComplete={field.auto} required minLength={field.key === "currentPassword" ? undefined : 8} className="form-control mt-2" value={form[field.key as keyof typeof form]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} /></label>)}
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-60"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-4 w-4 accent-primary-base" />Tampilkan password</label>
                    <button type="submit" disabled={saving} className="btn min-h-11 px-5 py-2.5 text-sm">{saving ? "Menyimpan..." : "Perbarui password"}</button>
                </form>
            </section>
            <section className="portal-card p-5 sm:p-7"><h2 className="font-extrabold text-[#14213d]">Email akun</h2><p className="mt-2 text-sm text-neutral-50">Perubahan email membutuhkan verifikasi OTP untuk menjaga keamanan akun. Hubungi admin jika perlu mengganti email.</p></section>
        </div>
    );
}
