"use client";

import { useEffect, useState } from "react";
import type { Seminar, CreateSeminarInput, UpdateSeminarInput } from "@repo/types";
import ImageUploadField from "@/app/components/ImageUploadField";

interface SeminarModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    seminar?: Seminar | null;
    onClose: () => void;
    onSave: (data: CreateSeminarInput | UpdateSeminarInput) => Promise<void>;
}

const STATUS_OPTIONS = ["upcoming", "ongoing", "done"];

export default function SeminarModal({ isOpen, mode, seminar, onClose, onSave }: SeminarModalProps) {
    const [form, setForm] = useState<CreateSeminarInput>({
        theme: "",
        speaker: "",
        event_date: "",
        event_time: "",
        image_banner: "",
        status: "upcoming",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (mode === "edit" && seminar) {
            const dateStr = seminar.event_date
                ? new Date(seminar.event_date).toISOString().split("T")[0]
                : "";
            setForm({
                theme: seminar.theme || "",
                speaker: seminar.speaker || "",
                event_date: dateStr,
                event_time: seminar.event_time || "",
                image_banner: seminar.image_banner || "",
                status: seminar.status || "upcoming",
            });
        } else {
            setForm({ theme: "", speaker: "", event_date: "", event_time: "", image_banner: "", status: "upcoming" });
        }
        setError("");
    }, [mode, seminar, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!form.theme || !form.speaker || !form.event_date || !form.event_time) {
            setError("Tema, pembicara, tanggal, dan waktu wajib diisi.");
            return;
        }
        setIsLoading(true);
        try {
            await onSave(form);
        } catch {
            setError("Gagal menyimpan data seminar.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={onClose} />
            <div className="relative bg-absolute-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-absolute-white rounded-t-2xl border-b border-neutral-10 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-90">
                        {mode === "create" ? "Buat Seminar Baru" : "Edit Seminar"}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-50 hover:bg-neutral-10 transition-all">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    {error && (
                        <div className="bg-error-10 border border-error-base rounded-lg px-4 py-3 text-sm text-error-base">{error}</div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-70">Tema Seminar *</label>
                        <input
                            value={form.theme}
                            onChange={(e) => setForm({ ...form, theme: e.target.value })}
                            placeholder="Contoh: Budaya Jepang Modern"
                            className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-70">Pembicara *</label>
                        <input
                            value={form.speaker}
                            onChange={(e) => setForm({ ...form, speaker: e.target.value })}
                            placeholder="Contoh: Prof. Hiroshi Nakamura"
                            className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Tanggal *</label>
                            <input
                                type="date"
                                value={form.event_date}
                                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Waktu *</label>
                            <input
                                type="time"
                                value={form.event_time}
                                onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                required
                            />
                        </div>
                    </div>

                    <ImageUploadField
                        label="Banner / Gambar"
                        value={form.image_banner}
                        folder="seminar"
                        onChange={(value) => setForm({ ...form, image_banner: value })}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-70">Status *</label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                    {s === "upcoming" ? "Upcoming" : s === "ongoing" ? "On Going" : "Selesai"}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-neutral-20 text-sm font-semibold text-neutral-60 hover:bg-neutral-10 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            id="btn-save-seminar"
                            className="flex-1 py-2.5 rounded-xl bg-primary-base text-absolute-white text-sm font-semibold hover:bg-primary-80 disabled:bg-neutral-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Menyimpan...
                                </>
                            ) : (
                                mode === "create" ? "Buat Seminar" : "Simpan Perubahan"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
