"use client";

import { useEffect, useState } from "react";

type Profile = { id: number; name: string; email: string; phone: string | null; bio: string | null; avatar_url: string | null; created_at: string };

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [form, setForm] = useState({ name: "", phone: "", bio: "" });
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        fetch("/api/profile").then(async (response) => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setProfile(data.profile);
            setForm({ name: data.profile.name ?? "", phone: data.profile.phone ?? "", bio: data.profile.bio ?? "" });
        }).catch(() => setNotice({ type: "error", text: "Profil tidak dapat dimuat." })).finally(() => setLoading(false));
    }, []);

    async function saveProfile(event: React.FormEvent) {
        event.preventDefault(); setSaving(true); setNotice(null);
        try {
            const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setProfile((current) => current ? { ...current, ...form } : current);
            setEditing(false); setNotice({ type: "success", text: data.message });
            window.dispatchEvent(new Event("profile-updated"));
        } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Gagal menyimpan profil" }); }
        finally { setSaving(false); }
    }

    async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploadingAvatar(true); setNotice(null);
        try {
            const formData = new FormData(); formData.append("file", file);
            const response = await fetch("/api/profile/avatar", { method: "POST", body: formData });
            const data = await response.json(); if (!response.ok) throw new Error(data.error);
            setProfile((current) => current ? { ...current, avatar_url: data.avatarUrl } : current);
            setNotice({ type: "success", text: data.message }); window.dispatchEvent(new Event("profile-updated"));
        } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Gagal mengunggah foto" }); }
        finally { setUploadingAvatar(false); event.target.value = ""; }
    }

    async function removeAvatar() {
        setUploadingAvatar(true); setNotice(null);
        try {
            const response = await fetch("/api/profile/avatar", { method: "DELETE" });
            const data = await response.json(); if (!response.ok) throw new Error(data.error);
            setProfile((current) => current ? { ...current, avatar_url: null } : current);
            setNotice({ type: "success", text: data.message }); window.dispatchEvent(new Event("profile-updated"));
        } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Gagal menghapus foto" }); }
        finally { setUploadingAvatar(false); }
    }

    if (loading) return <div className="mx-auto max-w-5xl animate-pulse space-y-5 px-4 py-8 sm:px-8"><div className="h-32 rounded-3xl bg-primary-10" /><div className="h-80 rounded-3xl bg-white" /></div>;
    const initials = profile?.name?.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "S";

    return (
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8">
            <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#142d63] to-primary-70 p-6 text-white sm:p-8">
                <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-white/10" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="group relative">
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white/20 bg-white text-3xl font-black text-primary-base shadow-xl">
                            {profile?.avatar_url ? <img src={profile.avatar_url} alt={`Foto profil ${profile.name}`} className="h-full w-full object-cover" /> : initials}
                        </div>
                        <label className="portal-focus absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-2 border-[#142d63] bg-white text-sm text-primary-base shadow-lg" title="Ganti foto profil">
                            <span aria-hidden="true">✎</span><span className="sr-only">Pilih foto profil</span>
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadingAvatar} onChange={uploadAvatar} />
                        </label>
                    </div>
                    <div><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Pelajar Nande Nihon</span><h1 className="mt-3 text-2xl font-black sm:text-3xl">{profile?.name || "Siswa"}</h1><p className="mt-1 text-sm text-blue-100">{profile?.email}</p></div>
                    <div className="sm:ml-auto sm:text-right"><label className="portal-focus inline-flex min-h-10 cursor-pointer items-center rounded-xl bg-white px-4 text-xs font-extrabold text-primary-90 shadow-md"><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadingAvatar} onChange={uploadAvatar} />{uploadingAvatar ? "Mengunggah..." : profile?.avatar_url ? "Ganti foto" : "Tambah foto"}</label>{profile?.avatar_url && <button type="button" disabled={uploadingAvatar} onClick={removeAvatar} className="mt-2 block w-full text-xs font-semibold text-blue-100 hover:text-white">Hapus foto</button>}<p className="mt-2 text-[10px] text-blue-200">JPG, PNG, atau WebP · maks. 5 MB</p></div>
                </div>
            </section>

            {notice && <div role={notice.type === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${notice.type === "success" ? "border-success-20 bg-success-10 text-success-100" : "border-error-20 bg-error-10 text-error-100"}`}>{notice.text}</div>}

            <section className="portal-card p-5 sm:p-7">
                <div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-extrabold text-[#14213d]">Informasi profil</h2><p className="mt-1 text-sm text-neutral-50">Informasi yang digunakan di ruang belajar.</p></div>{!editing && <button onClick={() => setEditing(true)} className="btn-outline min-h-11 px-4 py-2 text-sm">Edit profil</button>}</div>
                <form onSubmit={saveProfile} className="grid gap-5 sm:grid-cols-2">
                    <ProfileField label="Nama lengkap"><input className="form-control" disabled={!editing} required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></ProfileField>
                    <ProfileField label="Email"><input className="form-control bg-neutral-0" disabled value={profile?.email ?? ""} /><span className="mt-1 block text-xs text-neutral-40">Email terverifikasi tidak dapat diubah di sini.</span></ProfileField>
                    <ProfileField label="Nomor telepon"><input className="form-control" disabled={!editing} inputMode="tel" placeholder="+62 812 3456 7890" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></ProfileField>
                    <ProfileField label="Bergabung sejak"><input className="form-control bg-neutral-0" disabled value={profile?.created_at ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(profile.created_at)) : "–"} /></ProfileField>
                    <div className="sm:col-span-2"><ProfileField label="Tentang saya"><textarea className="form-control min-h-28 resize-y" disabled={!editing} maxLength={500} placeholder="Ceritakan sedikit tentang tujuan belajarmu..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /><span className="mt-1 block text-right text-xs text-neutral-40">{form.bio.length}/500</span></ProfileField></div>
                    {editing && <div className="flex gap-3 sm:col-span-2"><button type="submit" disabled={saving} className="btn min-h-11 px-5 py-2.5 text-sm">{saving ? "Menyimpan..." : "Simpan perubahan"}</button><button type="button" onClick={() => { setEditing(false); setForm({ name: profile?.name ?? "", phone: profile?.phone ?? "", bio: profile?.bio ?? "" }); }} className="btn-outline min-h-11 px-5 py-2.5 text-sm">Batal</button></div>}
                </form>
            </section>
        </div>
    );
}

function ProfileField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-neutral-70">{label}<div className="mt-2">{children}</div></label>; }
