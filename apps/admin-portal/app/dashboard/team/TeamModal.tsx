"use client";

import { useEffect, useState } from "react";
import type { Team, CreateTeamInput, UpdateTeamInput } from "@repo/types";
import ImageUploadField from "@/app/components/ImageUploadField";

interface TeamModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    member?: Team | null;
    onClose: () => void;
    onSave: (data: CreateTeamInput | UpdateTeamInput) => Promise<void>;
}

const DIVISIONS = ["Founder & Co Founder", "Teacher", "Research & Jurnalist", "Communication", "IT Development", "Media & Relations", "Admin & Data"];
const JLPT_LEVELS = ["N1", "N2", "N3", "N4", "N5", "Belum JLPT"];

export default function TeamModal({ isOpen, mode, member, onClose, onSave }: TeamModalProps) {
    const [form, setForm] = useState<CreateTeamInput>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (mode === "edit" && member) {
            setForm({
                photo: member.photo || "",
                full_name: member.full_name || "",
                nickname: member.nickname || "",
                email: member.email || "",
                phone_number: member.phone_number || "",
                team_group: member.team_group || "",
                division: member.division || "",
                jlpt_level: member.jlpt_level || "",
                domicile: member.domicile || "",
                instagram: member.instagram || "",
                motto: member.motto || "",
                fun_fact: member.fun_fact || "",
                favorites: member.favorites || "",
                birth_date: member.birth_date ? new Date(member.birth_date).toISOString().split("T")[0] : "",
                place_of_birth: member.place_of_birth || "",
                join_date: member.join_date ? new Date(member.join_date).toISOString().split("T")[0] : "",
            });
        } else {
            setForm({});
        }
        setError("");
    }, [mode, member, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!form.full_name) { setError("Nama lengkap wajib diisi."); return; }
        setIsLoading(true);
        try {
            await onSave(form);
        } catch {
            setError("Gagal menyimpan data tim.");
        } finally {
            setIsLoading(false);
        }
    };

    const set = (key: keyof CreateTeamInput, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={onClose} />
            <div className="relative bg-absolute-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-absolute-white rounded-t-2xl border-b border-neutral-10 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-90">
                        {mode === "create" ? "Tambah Anggota Tim" : "Edit Anggota Tim"}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-50 hover:bg-neutral-10 transition-all">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    {error && <div className="bg-error-10 border border-error-base rounded-lg px-4 py-3 text-sm text-error-base">{error}</div>}

                    <p className="text-xs font-semibold text-neutral-40 uppercase tracking-wider">Informasi Pribadi</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Nama Lengkap *</label>
                            <input value={form.full_name || ""} onChange={(e) => set("full_name", e.target.value)}
                                placeholder="Masukkan nama lengkap"
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" required />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Nama Panggilan</label>
                            <input value={form.nickname || ""} onChange={(e) => set("nickname", e.target.value)}
                                placeholder="Nama panggilan"
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Email</label>
                            <input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)}
                                placeholder="email@contoh.com"
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">No. Handphone</label>
                            <input type="tel" value={form.phone_number || ""} onChange={(e) => set("phone_number", e.target.value)}
                                placeholder="08xxxxxxxxxx"
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Tempat Lahir</label>
                            <input value={form.place_of_birth || ""} onChange={(e) => set("place_of_birth", e.target.value)}
                                placeholder="Kota kelahiran"
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Tanggal Lahir</label>
                            <input type="date" value={form.birth_date || ""} onChange={(e) => set("birth_date", e.target.value)}
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Domisili</label>
                            <input value={form.domicile || ""} onChange={(e) => set("domicile", e.target.value)}
                                placeholder="Kota tinggal"
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Instagram</label>
                            <input value={form.instagram || ""} onChange={(e) => set("instagram", e.target.value)}
                                placeholder="@username"
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" />
                        </div>
                    </div>

                    <p className="text-xs font-semibold text-neutral-40 uppercase tracking-wider mt-2">Informasi Tim</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Divisi</label>
                            <select value={form.division || ""} onChange={(e) => set("division", e.target.value)}
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all">
                                <option value="">Pilih Divisi</option>
                                {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Level JLPT</label>
                            <select value={form.jlpt_level || ""} onChange={(e) => set("jlpt_level", e.target.value)}
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all">
                                <option value="">Pilih Level</option>
                                {JLPT_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Grup Tim</label>
                            <input value={form.team_group || ""} onChange={(e) => set("team_group", e.target.value)}
                                placeholder="Contoh: Batch 2024"
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Tanggal Bergabung</label>
                            <input type="date" value={form.join_date || ""} onChange={(e) => set("join_date", e.target.value)}
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-70">Motto</label>
                        <input value={form.motto || ""} onChange={(e) => set("motto", e.target.value)}
                            placeholder="Motto hidup"
                            className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-70">Fun Fact</label>
                        <textarea value={form.fun_fact || ""} onChange={(e) => set("fun_fact", e.target.value)}
                            placeholder="Fakta menarik tentang Anda"
                            rows={2}
                            className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all resize-none" />
                    </div>

                    <ImageUploadField
                        label="Foto"
                        value={form.photo || ""}
                        folder="team"
                        onChange={(value) => set("photo", value)}
                    />

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-neutral-20 text-sm font-semibold text-neutral-60 hover:bg-neutral-10 transition-all">
                            Batal
                        </button>
                        <button type="submit" disabled={isLoading} id="btn-save-team"
                            className="flex-1 py-2.5 rounded-xl bg-primary-base text-absolute-white text-sm font-semibold hover:bg-primary-80 disabled:bg-neutral-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Menyimpan...
                                </>
                            ) : (mode === "create" ? "Tambah Anggota" : "Simpan Perubahan")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
