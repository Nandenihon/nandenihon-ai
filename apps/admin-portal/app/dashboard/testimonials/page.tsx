"use client";

import { useEffect, useState, useCallback } from "react";
import type { Testimony } from "@repo/types";
import ImageUploadField from "@/app/components/ImageUploadField";

interface TestimonyModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    testimony?: Testimony | null;
    onClose: () => void;
    onSave: (data: object) => Promise<void>;
}

function TestimonyModal({ isOpen, mode, testimony, onClose, onSave }: TestimonyModalProps) {
    const [form, setForm] = useState({ photo: "", nickname: "", email: "", age: "", testimonial_text: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (mode === "edit" && testimony) {
            setForm({
                photo: testimony.photo || "",
                nickname: testimony.nickname || "",
                email: testimony.email || "",
                age: testimony.age ? String(testimony.age) : "",
                testimonial_text: testimony.testimonial_text || "",
            });
        } else {
            setForm({ photo: "", nickname: "", email: "", age: "", testimonial_text: "" });
        }
        setError("");
    }, [mode, testimony, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!form.testimonial_text) { setError("Teks testimoni wajib diisi."); return; }
        setIsLoading(true);
        try {
            await onSave({ ...form, age: form.age ? Number(form.age) : undefined });
        } catch {
            setError("Gagal menyimpan testimoni.");
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
                    <h2 className="text-lg font-bold text-neutral-90">{mode === "create" ? "Tambah Testimoni" : "Edit Testimoni"}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-50 hover:bg-neutral-10 transition-all">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    {error && <div className="bg-error-10 border border-error-base rounded-lg px-4 py-3 text-sm text-error-base">{error}</div>}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Nama / Nickname</label>
                            <input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                                placeholder="Nama pengguna"
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Usia</label>
                            <input type="number" min="1" max="100" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
                                placeholder="Usia"
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-70">Email</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="email@contoh.com"
                            className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" />
                    </div>
                    <ImageUploadField
                        label="Foto"
                        value={form.photo}
                        folder="testimony"
                        onChange={(value) => setForm({ ...form, photo: value })}
                    />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-70">Teks Testimoni *</label>
                        <textarea value={form.testimonial_text} onChange={(e) => setForm({ ...form, testimonial_text: e.target.value })}
                            placeholder="Tulis testimoni di sini..."
                            rows={4} required
                            className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all resize-none" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-20 text-sm font-semibold text-neutral-60 hover:bg-neutral-10 transition-all">Batal</button>
                        <button type="submit" disabled={isLoading} id="btn-save-testimony"
                            className="flex-1 py-2.5 rounded-xl bg-primary-base text-absolute-white text-sm font-semibold hover:bg-primary-80 disabled:bg-neutral-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                            {isLoading ? (
                                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Menyimpan...</>
                            ) : (mode === "create" ? "Tambah Testimoni" : "Simpan Perubahan")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function TestimonialsPage() {
    const [testimonies, setTestimonies] = useState<Testimony[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingTestimony, setEditingTestimony] = useState<Testimony | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchTestimonies = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/testimony?page=${page}&limit=10`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal memuat data");
            setTestimonies(data.data || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotal(data.pagination?.total || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchTestimonies(); }, [fetchTestimonies]);

    const handleCreate = () => { setModalMode("create"); setEditingTestimony(null); setModalOpen(true); };
    const handleEdit = (t: Testimony) => { setModalMode("edit"); setEditingTestimony(t); setModalOpen(true); };

    const handleSave = async (formData: object) => {
        const url = modalMode === "create" ? "/api/testimony" : `/api/testimony/${editingTestimony?.id}`;
        const method = modalMode === "create" ? "POST" : "PUT";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Gagal menyimpan"); }
        setModalOpen(false);
        fetchTestimonies();
    };

    const handleDelete = async (id: number) => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/testimony/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Gagal menghapus");
            setDeleteConfirmId(null);
            fetchTestimonies();
        } catch { setError("Gagal menghapus testimoni."); }
        finally { setIsDeleting(false); }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-50">{total} testimoni</span>
                </div>
                <button id="btn-create-testimony" onClick={handleCreate}
                    className="flex items-center gap-2 bg-primary-base text-absolute-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-80 transition-all">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Tambah Testimoni
                </button>
            </div>

            {error && <div className="bg-error-10 border border-error-base rounded-xl px-4 py-3 text-sm text-error-base">{error}</div>}

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-absolute-white rounded-2xl border border-neutral-20 p-6 animate-pulse">
                            <div className="flex gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-neutral-10 flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-neutral-10 rounded w-1/2" />
                                    <div className="h-3 bg-neutral-10 rounded w-1/4" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 bg-neutral-10 rounded" />
                                <div className="h-3 bg-neutral-10 rounded w-5/6" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : testimonies.length === 0 ? (
                <div className="bg-absolute-white rounded-2xl border border-neutral-20 p-12 flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-neutral-10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-neutral-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-neutral-50">Belum ada testimoni</p>
                    <button onClick={handleCreate} className="text-sm font-semibold text-primary-base hover:underline">+ Tambah testimoni pertama</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testimonies.map((t) => (
                        <div key={t.id} className="bg-absolute-white rounded-2xl border border-neutral-20 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex items-center gap-3">
                                    {t.photo ? (
                                        <img src={t.photo} alt={t.nickname || ""} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-primary-20 flex items-center justify-center text-primary-base font-bold flex-shrink-0">
                                            {(t.nickname || "?").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-bold text-neutral-80">{t.nickname || "Anonim"}</p>
                                        {t.age && <span className="text-xs text-neutral-40">{t.age} tahun</span>}
                                        {t.email && <p className="text-xs text-neutral-40 truncate">{t.email}</p>}
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-neutral-60 leading-relaxed mb-4 line-clamp-3">&ldquo;{t.testimonial_text}&rdquo;</p>
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-10">
                                <button id={`btn-edit-testimony-${t.id}`} onClick={() => handleEdit(t)}
                                    className="text-xs font-semibold text-primary-base bg-primary-10 hover:bg-primary-20 px-3 py-1.5 rounded-lg transition-all">Edit</button>
                                <button id={`btn-delete-testimony-${t.id}`} onClick={() => setDeleteConfirmId(t.id)}
                                    className="text-xs font-semibold text-error-base bg-error-10 hover:bg-error-20 px-3 py-1.5 rounded-lg transition-all">Hapus</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-20 text-neutral-60 disabled:opacity-40 hover:bg-neutral-10 transition-all">← Prev</button>
                    <span className="text-sm text-neutral-50">Halaman {page} dari {totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-20 text-neutral-60 disabled:opacity-40 hover:bg-neutral-10 transition-all">Next →</button>
                </div>
            )}

            <TestimonyModal isOpen={modalOpen} mode={modalMode} testimony={editingTestimony} onClose={() => setModalOpen(false)} onSave={handleSave} />

            {deleteConfirmId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={() => setDeleteConfirmId(null)} />
                    <div className="relative bg-absolute-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <h3 className="text-base font-bold text-neutral-90 mb-2">Hapus Testimoni?</h3>
                        <p className="text-sm text-neutral-50 mb-6">Testimoni ini akan dihapus secara permanen.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-20 text-sm font-semibold text-neutral-60 hover:bg-neutral-10 transition-all">Batal</button>
                            <button id="btn-confirm-delete-testimony" onClick={() => handleDelete(deleteConfirmId)} disabled={isDeleting}
                                className="flex-1 py-2.5 rounded-xl bg-error-base text-absolute-white text-sm font-semibold hover:bg-error-100 disabled:bg-neutral-30 transition-all">
                                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
