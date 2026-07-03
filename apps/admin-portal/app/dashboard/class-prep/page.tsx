"use client";

import { useEffect, useState, useCallback } from "react";

interface ClassPrep {
    class_id: number;
    class_name: string;
    level: string;
    class_status: string;
    room_ready: number | null;
    materials_ready: number | null;
    zoom_link: string | null;
    schedule_announced: number | null;
    notes: string | null;
    updated_at: string | null;
}

export default function ClassPrepPage() {
    const [classPreps, setClassPreps] = useState<ClassPrep[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPrep, setSelectedPrep] = useState<ClassPrep | null>(null);
    const [form, setForm] = useState({
        roomReady: false,
        materialsReady: false,
        scheduleAnnounced: false,
        zoomLink: "",
        notes: "",
    });
    const [isSaving, setIsSaving] = useState(false);

    const fetchClassPreps = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/class-prep");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal memuat data");
            setClassPreps(data.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClassPreps();
    }, [fetchClassPreps]);

    const handlePrepareClick = (prep: ClassPrep) => {
        setSelectedPrep(prep);
        setForm({
            roomReady: Boolean(prep.room_ready),
            materialsReady: Boolean(prep.materials_ready),
            scheduleAnnounced: Boolean(prep.schedule_announced),
            zoomLink: prep.zoom_link || "",
            notes: prep.notes || "",
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPrep) return;
        setIsSaving(true);
        setError("");
        try {
            const res = await fetch("/api/class-prep", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    classId: selectedPrep.class_id,
                    roomReady: form.roomReady,
                    materialsReady: form.materialsReady,
                    scheduleAnnounced: form.scheduleAnnounced,
                    zoomLink: form.zoomLink,
                    notes: form.notes,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal menyimpan");

            setIsModalOpen(false);
            fetchClassPreps();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsSaving(false);
        }
    };

    const getProgressInfo = (prep: ClassPrep) => {
        let count = 0;
        if (prep.room_ready) count++;
        if (prep.materials_ready) count++;
        if (prep.schedule_announced) count++;
        
        const percent = Math.round((count / 3) * 100);
        return { count, percent };
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-neutral-90">Menyiapkan Kelas</h2>
                <p className="text-sm text-neutral-50">Kelola checklist kesiapan fasilitas, materi, dan jadwal kelas</p>
            </div>

            {error && (
                <div className="bg-error-10 border border-error-base rounded-xl px-4 py-3 text-sm text-error-base">
                    {error}
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-absolute-white border border-neutral-20 rounded-2xl p-5 animate-pulse flex flex-col gap-4">
                            <div className="h-5 bg-neutral-10 rounded w-2/3" />
                            <div className="h-4 bg-neutral-10 rounded w-1/3" />
                            <div className="h-8 bg-neutral-10 rounded w-full" />
                            <div className="h-10 bg-neutral-10 rounded w-1/3 ml-auto mt-2" />
                        </div>
                    ))
                ) : classPreps.length === 0 ? (
                    <div className="col-span-full bg-absolute-white border border-neutral-20 rounded-2xl p-8 text-center text-sm text-neutral-40">
                        Tidak ada kelas terdaftar di sistem.
                    </div>
                ) : (
                    classPreps.map((prep) => {
                        const progress = getProgressInfo(prep);
                        const isFinished = progress.count === 3;

                        return (
                            <div key={prep.class_id} className="bg-absolute-white border border-neutral-20 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                                <div className="flex flex-col gap-3">
                                    {/* Class Info */}
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <h3 className="font-bold text-neutral-90 text-base">{prep.class_name}</h3>
                                            <span className="text-xs text-neutral-45">Level: {prep.level}</span>
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                            prep.class_status === "active" ? "bg-success-10 text-success-base" : "bg-neutral-10 text-neutral-50"
                                        }`}>
                                            {prep.class_status === "active" ? "Aktif" : prep.class_status}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="flex flex-col gap-1 mt-1">
                                        <div className="flex justify-between text-xs text-neutral-55 font-medium">
                                            <span>Progress Kesiapan</span>
                                            <span className="font-bold text-primary-base">{progress.count}/3 Selesai ({progress.percent}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-neutral-10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                    isFinished ? "bg-success-base" : "bg-primary-base"
                                                }`}
                                                style={{ width: `${progress.percent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Checklists Detail */}
                                    <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-neutral-10">
                                        {[
                                            { label: "Ruangan / Kelas Siap", val: prep.room_ready },
                                            { label: "Bahan & Materi Siap", val: prep.materials_ready },
                                            { label: "Jadwal Diumumkan", val: prep.schedule_announced },
                                        ].map((chk, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs">
                                                {chk.val ? (
                                                    <svg className="w-4 h-4 text-success-base" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full border border-neutral-30 flex-shrink-0" />
                                                )}
                                                <span className={chk.val ? "text-neutral-70 font-medium" : "text-neutral-45"}>{chk.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Zoom Link Info */}
                                    {prep.zoom_link && (
                                        <div className="bg-neutral-0 border border-neutral-20 p-2.5 rounded-xl text-xs text-neutral-70 flex items-center gap-2 mt-2 overflow-hidden">
                                            <svg className="w-4 h-4 text-primary-base flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                                                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                                            </svg>
                                            <a href={prep.zoom_link} target="_blank" rel="noopener noreferrer" className="text-primary-base hover:underline truncate">
                                                {prep.zoom_link}
                                            </a>
                                        </div>
                                    )}

                                    {/* Notes Info */}
                                    {prep.notes && (
                                        <div className="text-xs text-neutral-50 mt-1 italic">
                                            Catatan: {prep.notes}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end mt-5 pt-3 border-t border-neutral-10">
                                    <button
                                        onClick={() => handlePrepareClick(prep)}
                                        className="text-xs font-semibold bg-primary-base text-absolute-white hover:bg-primary-80 px-4 py-2 rounded-xl transition-all"
                                    >
                                        Siapkan Kelas
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal: Prepare Class */}
            {isModalOpen && selectedPrep && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-absolute-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="border-b border-neutral-10 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-neutral-90">Kesiapan: {selectedPrep.class_name}</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 rounded-lg text-neutral-50 hover:bg-neutral-10 transition-all"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
                            <div className="flex flex-col gap-3">
                                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-neutral-80">
                                    <input
                                        type="checkbox"
                                        checked={form.roomReady}
                                        onChange={(e) => setForm({ ...form, roomReady: e.target.checked })}
                                        className="w-4 h-4 rounded text-primary-base accent-primary-base"
                                    />
                                    Ruangan / Lokasi Kelas Siap
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-neutral-80">
                                    <input
                                        type="checkbox"
                                        checked={form.materialsReady}
                                        onChange={(e) => setForm({ ...form, materialsReady: e.target.checked })}
                                        className="w-4 h-4 rounded text-primary-base accent-primary-base"
                                    />
                                    Bahan & Materi Pembelajaran Siap
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-neutral-80">
                                    <input
                                        type="checkbox"
                                        checked={form.scheduleAnnounced}
                                        onChange={(e) => setForm({ ...form, scheduleAnnounced: e.target.checked })}
                                        className="w-4 h-4 rounded text-primary-base accent-primary-base"
                                    />
                                    Jadwal KBM Diumumkan ke Siswa
                                </label>
                            </div>

                            <div className="flex flex-col gap-1.5 mt-2">
                                <label className="text-sm font-semibold text-neutral-70">Link Video Conf / Zoom Link (Opsional)</label>
                                <input
                                    value={form.zoomLink}
                                    onChange={(e) => setForm({ ...form, zoomLink: e.target.value })}
                                    placeholder="https://zoom.us/j/..."
                                    className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-70">Catatan Persiapan Tambahan</label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Nomor ruangan, password zoom, atau catatan logistik lainnya..."
                                    rows={3}
                                    className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-neutral-20 text-sm font-semibold text-neutral-60 hover:bg-neutral-10 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-2.5 rounded-xl bg-primary-base text-absolute-white text-sm font-semibold hover:bg-primary-80 disabled:bg-neutral-30 transition-all"
                                >
                                    {isSaving ? "Menyimpan..." : "Simpan Kesiapan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
