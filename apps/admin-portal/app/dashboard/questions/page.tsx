"use client";

import { useCallback, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
    timeLimit: number;
    category: string | null;
    level: "N5" | "N4";
    createdAt: string;
    updatedAt: string;
}

interface QuestionFormData {
    text: string;
    options: string[];
    correctAnswer: string;
    timeLimit: number;
    category: string;
    level: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVELS = ["N5", "N4"];
const CATEGORIES = ["Vocabulary", "Grammar", "Kanji", "Reading", "Listening"];

const DEFAULT_FORM: QuestionFormData = {
    text: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    timeLimit: 30,
    category: "",
    level: "",
};

const levelColors: Record<string, string> = {
    N5: "bg-primary-10 text-primary-base",
    N4: "bg-success-10 text-success-base",
};

// ─── Modal ────────────────────────────────────────────────────────────────────

interface QuestionModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    question?: Question | null;
    onClose: () => void;
    onSave: (data: QuestionFormData) => Promise<void>;
}

function QuestionModal({ isOpen, mode, question, onClose, onSave }: QuestionModalProps) {
    const [form, setForm] = useState<QuestionFormData>(DEFAULT_FORM);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (mode === "edit" && question) {
            setForm({
                text: question.text,
                options: question.options.length >= 2 ? [...question.options] : ["", "", "", ""],
                correctAnswer: question.correctAnswer,
                timeLimit: question.timeLimit,
                category: question.category ?? "",
                level: question.level,
            });
        } else {
            setForm(DEFAULT_FORM);
        }
        setError("");
    }, [mode, question, isOpen]);

    const setOption = (index: number, value: string) => {
        const next = [...form.options];
        next[index] = value;
        // If user edited the option that was the correct answer, clear correctAnswer
        const newCorrect = next[index] !== form.options[index] && form.correctAnswer === form.options[index]
            ? ""
            : form.correctAnswer;
        setForm({ ...form, options: next, correctAnswer: newCorrect });
    };

    const addOption = () => {
        if (form.options.length < 6) setForm({ ...form, options: [...form.options, ""] });
    };

    const removeOption = (index: number) => {
        if (form.options.length <= 2) return;
        const next = form.options.filter((_, i) => i !== index);
        setForm({
            ...form,
            options: next,
            correctAnswer: form.correctAnswer === form.options[index] ? "" : form.correctAnswer,
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");

        const filledOptions = form.options.map((o) => o.trim()).filter(Boolean);
        if (!form.text.trim()) { setError("Teks soal wajib diisi."); return; }
        if (filledOptions.length < 2) { setError("Minimal 2 pilihan jawaban."); return; }
        if (!form.correctAnswer) { setError("Pilih jawaban yang benar."); return; }
        if (!form.level) { setError("Pilih level soal."); return; }

        setIsLoading(true);
        try {
            await onSave({ ...form, options: filledOptions });
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan soal.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={onClose} />
            <div className="relative bg-absolute-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-absolute-white rounded-t-2xl border-b border-neutral-10 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-90">
                        {mode === "create" ? "Tambah Soal" : "Edit Soal"}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-50 hover:bg-neutral-10 transition-all">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    {error && <div className="bg-error-10 border border-error-base rounded-lg px-4 py-3 text-sm text-error-base">{error}</div>}

                    {/* Text */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-70">Teks Soal *</label>
                        <textarea
                            value={form.text}
                            onChange={(e) => setForm({ ...form, text: e.target.value })}
                            placeholder="Tulis pertanyaan di sini..."
                            rows={3}
                            className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all resize-none"
                            required
                        />
                    </div>

                    {/* Level & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Level *</label>
                            <select
                                value={form.level}
                                onChange={(e) => setForm({ ...form, level: e.target.value })}
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                required
                            >
                                <option value="">Pilih Level</option>
                                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Kategori</label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                            >
                                <option value="">Tidak ada</option>
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Waktu (detik) *</label>
                            <input
                                type="number"
                                min="5"
                                max="300"
                                value={form.timeLimit}
                                onChange={(e) => setForm({ ...form, timeLimit: Number(e.target.value) })}
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Options */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-neutral-70">Pilihan Jawaban *</label>
                            <button
                                type="button"
                                onClick={addOption}
                                disabled={form.options.length >= 6}
                                className="text-xs font-semibold text-primary-base hover:underline disabled:text-neutral-40 disabled:no-underline"
                            >
                                + Tambah pilihan
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {form.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        checked={form.correctAnswer === opt && opt.trim() !== ""}
                                        onChange={() => { if (opt.trim()) setForm({ ...form, correctAnswer: opt }); }}
                                        className="accent-primary-base w-4 h-4 flex-shrink-0"
                                        title="Tandai sebagai jawaban benar"
                                    />
                                    <input
                                        value={opt}
                                        onChange={(e) => setOption(i, e.target.value)}
                                        placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                                        className="flex-1 bg-neutral-0 border border-neutral-20 rounded-xl py-2 px-3 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                    />
                                    {form.options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(i)}
                                            className="p-1.5 rounded-lg text-error-base hover:bg-error-10 transition-all flex-shrink-0"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {form.correctAnswer && (
                            <p className="text-xs text-success-base font-medium">
                                ✓ Jawaban benar: <span className="font-semibold">{form.correctAnswer}</span>
                            </p>
                        )}
                    </div>

                    {/* Footer */}
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
                            id="btn-save-question"
                            className="flex-1 py-2.5 rounded-xl bg-primary-base text-absolute-white text-sm font-semibold hover:bg-primary-80 disabled:bg-neutral-30 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? "Menyimpan..." : mode === "create" ? "Tambah Soal" : "Simpan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ page: String(page), limit: "12" });
            if (search) params.set("search", search);
            if (levelFilter) params.set("level", levelFilter);
            if (categoryFilter) params.set("category", categoryFilter);

            const response = await fetch(`/api/question?${params}`);
            const data = await response.json() as { data?: Question[]; pagination?: { total: number; totalPages: number }; error?: string };

            if (!response.ok) throw new Error(data.error ?? "Gagal memuat data soal");

            setQuestions(data.data ?? []);
            setTotal(data.pagination?.total ?? 0);
            setTotalPages(data.pagination?.totalPages ?? 1);
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    }, [page, search, levelFilter, categoryFilter]);

    useEffect(() => { void fetchQuestions(); }, [fetchQuestions]);

    const handleCreate = () => {
        setModalMode("create");
        setEditingQuestion(null);
        setModalOpen(true);
    };

    const handleEdit = (q: Question) => {
        setModalMode("edit");
        setEditingQuestion(q);
        setModalOpen(true);
    };

    const handleSave = async (formData: QuestionFormData) => {
        const url = modalMode === "create" ? "/api/question" : `/api/question/${editingQuestion?.id}`;
        const method = modalMode === "create" ? "POST" : "PUT";

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        const data = await response.json() as { error?: string; details?: string };

        if (!response.ok) throw new Error(data.details ?? data.error ?? "Gagal menyimpan soal");

        setModalOpen(false);
        await fetchQuestions();
    };

    const handleDelete = async (id: number) => {
        setIsDeleting(true);
        setError("");
        try {
            const response = await fetch(`/api/question/${id}`, { method: "DELETE" });
            const data = await response.json() as { error?: string };
            if (!response.ok) throw new Error(data.error ?? "Gagal menghapus soal");
            setDeleteConfirmId(null);
            await fetchQuestions();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus soal");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-40">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <input
                            type="search"
                            placeholder="Cari soal..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-56 bg-absolute-white border border-neutral-20 rounded-xl py-2 pl-9 pr-4 text-sm text-neutral-70 placeholder:text-neutral-40 outline-none focus:border-primary-base transition-all"
                        />
                    </div>

                    {/* Level filter */}
                    <select
                        value={levelFilter}
                        onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
                        className="bg-absolute-white border border-neutral-20 rounded-xl py-2 px-3 text-sm text-neutral-70 outline-none focus:border-primary-base transition-all"
                    >
                        <option value="">Semua Level</option>
                        {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>

                    {/* Category filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                        className="bg-absolute-white border border-neutral-20 rounded-xl py-2 px-3 text-sm text-neutral-70 outline-none focus:border-primary-base transition-all"
                    >
                        <option value="">Semua Kategori</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <span className="text-sm text-neutral-50">{total} soal</span>
                </div>

                <button
                    id="btn-create-question"
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-primary-base text-absolute-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-80 transition-all"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Tambah Soal
                </button>
            </div>

            {error && <div className="bg-error-10 border border-error-base rounded-xl px-4 py-3 text-sm text-error-base">{error}</div>}

            {/* Table */}
            <div className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-neutral-0 border-b border-neutral-20">
                        <tr>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-6 py-3.5">Soal</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Level</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Kategori</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Pilihan</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Waktu</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-10">
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 bg-neutral-10 rounded w-3/4" /></td>
                                    <td className="px-4 py-4"><div className="h-5 bg-neutral-10 rounded-full w-10" /></td>
                                    <td className="px-4 py-4"><div className="h-4 bg-neutral-10 rounded w-16" /></td>
                                    <td className="px-4 py-4"><div className="h-4 bg-neutral-10 rounded w-8" /></td>
                                    <td className="px-4 py-4"><div className="h-4 bg-neutral-10 rounded w-12" /></td>
                                    <td className="px-4 py-4"><div className="h-7 bg-neutral-10 rounded w-16" /></td>
                                </tr>
                            ))
                        ) : questions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <p className="text-sm font-medium text-neutral-50">Belum ada soal ditemukan</p>
                                    <button onClick={handleCreate} className="mt-2 text-sm font-semibold text-primary-base hover:underline">
                                        + Tambah soal pertama
                                    </button>
                                </td>
                            </tr>
                        ) : (
                            questions.map((q) => (
                                <tr key={q.id} className="hover:bg-neutral-0 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-neutral-80 max-w-xs truncate">{q.text}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${levelColors[q.level] ?? "bg-neutral-10 text-neutral-60"}`}>
                                            {q.level}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {q.category ? (
                                            <span className="bg-neutral-10 text-neutral-60 text-xs font-medium px-2.5 py-1 rounded-full">{q.category}</span>
                                        ) : (
                                            <span className="text-neutral-30 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-neutral-60">{q.options.length} pilihan</td>
                                    <td className="px-4 py-4 text-sm text-neutral-60">{q.timeLimit}s</td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                id={`btn-edit-question-${q.id}`}
                                                onClick={() => handleEdit(q)}
                                                className="p-1.5 rounded-lg text-primary-base hover:bg-primary-10 transition-all"
                                                title="Edit soal"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button
                                                id={`btn-delete-question-${q.id}`}
                                                onClick={() => setDeleteConfirmId(q.id)}
                                                className="p-1.5 rounded-lg text-error-base hover:bg-error-10 transition-all"
                                                title="Hapus soal"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-20 text-neutral-60 disabled:opacity-40 hover:bg-neutral-10 transition-all"
                    >
                        Prev
                    </button>
                    <span className="text-sm text-neutral-50">Halaman {page} dari {totalPages}</span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-20 text-neutral-60 disabled:opacity-40 hover:bg-neutral-10 transition-all"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Create / Edit Modal */}
            <QuestionModal
                isOpen={modalOpen}
                mode={modalMode}
                question={editingQuestion}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
            />

            {/* Delete Confirm */}
            {deleteConfirmId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={() => setDeleteConfirmId(null)} />
                    <div className="relative bg-absolute-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <h3 className="text-base font-bold text-neutral-90 mb-2">Hapus Soal?</h3>
                        <p className="text-sm text-neutral-50 mb-6">Data soal ini akan dihapus secara permanen dan tidak dapat dikembalikan.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-2.5 rounded-xl border border-neutral-20 text-sm font-semibold text-neutral-60 hover:bg-neutral-10 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                id="btn-confirm-delete-question"
                                onClick={() => void handleDelete(deleteConfirmId)}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 rounded-xl bg-error-base text-absolute-white text-sm font-semibold hover:bg-error-100 disabled:bg-neutral-30 transition-all"
                            >
                                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
