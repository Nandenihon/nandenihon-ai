"use client";

import { useCallback, useEffect, useState } from "react";
import type { Class, CreateClassInput, UpdateClassInput } from "@repo/types";
import ImageUploadField from "@/app/components/ImageUploadField";

const DEFAULT_FORM: CreateClassInput = {
    class_name: "",
    level: "",
    description: "",
    register_start: "",
    register_end: "",
    register_fee: 0,
    status: "active",
    image_banner: "",
};

const LEVELS = ["N5", "N4", "N3", "N2", "N1", "Conversation", "Culture", "All"];
const STATUS_OPTIONS = ["active", "draft", "closed", "finished"];

const levelColors: Record<string, string> = {
    N5: "bg-primary-10 text-primary-base",
    N4: "bg-success-10 text-success-base",
    N3: "bg-warning-10 text-warning-100",
    N2: "bg-secondary-10 text-secondary-80",
    N1: "bg-error-10 text-error-base",
    All: "bg-neutral-10 text-neutral-60",
    Conversation: "bg-info-10 text-info-base",
    Culture: "bg-tertiary-20 text-warning-100",
};

const statusLabels: Record<string, string> = {
    active: "Aktif",
    draft: "Draft",
    closed: "Ditutup",
    finished: "Selesai",
};

const statusColors: Record<string, string> = {
    active: "bg-success-base text-absolute-white",
    draft: "bg-neutral-50 text-absolute-white",
    closed: "bg-warning-base text-absolute-white",
    finished: "bg-primary-base text-absolute-white",
};

function toDateTimeLocal(value: Date | string | undefined): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function formatDate(value: Date | string): string {
    return new Date(value).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function formatCurrency(value: number | string): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
}

interface ClassModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    classItem?: Class | null;
    onClose: () => void;
    onSave: (data: CreateClassInput | UpdateClassInput) => Promise<void>;
}

function ClassModal({ isOpen, mode, classItem, onClose, onSave }: ClassModalProps) {
    const [form, setForm] = useState<CreateClassInput>(DEFAULT_FORM);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (mode === "edit" && classItem) {
            setForm({
                class_name: classItem.class_name || "",
                level: classItem.level || "",
                description: classItem.description || "",
                register_start: toDateTimeLocal(classItem.register_start),
                register_end: toDateTimeLocal(classItem.register_end),
                register_fee: Number(classItem.register_fee) || 0,
                status: classItem.status || "active",
                image_banner: classItem.image_banner || "",
            });
        } else {
            setForm(DEFAULT_FORM);
        }
        setError("");
    }, [mode, classItem, isOpen]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");

        if (!form.class_name || !form.level || !form.description || !form.register_start || !form.register_end || !form.image_banner) {
            setError("Nama kelas, level, deskripsi, periode pendaftaran, dan banner wajib diisi.");
            return;
        }

        if (Number(form.register_fee) < 0) {
            setError("Biaya pendaftaran tidak valid.");
            return;
        }

        setIsLoading(true);
        try {
            await onSave({
                ...form,
                register_fee: Number(form.register_fee),
            });
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan kelas.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={onClose} />
            <div className="relative bg-absolute-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-absolute-white rounded-t-2xl border-b border-neutral-10 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-90">
                        {mode === "create" ? "Tambah Kelas" : "Edit Kelas"}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-50 hover:bg-neutral-10 transition-all">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    {error && <div className="bg-error-10 border border-error-base rounded-lg px-4 py-3 text-sm text-error-base">{error}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Nama Kelas *</label>
                            <input
                                value={form.class_name}
                                onChange={(event) => setForm({ ...form, class_name: event.target.value })}
                                placeholder="Contoh: JLPT N5 Batch 12"
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Level *</label>
                            <select
                                value={form.level}
                                onChange={(event) => setForm({ ...form, level: event.target.value })}
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                required
                            >
                                <option value="">Pilih Level</option>
                                {LEVELS.map((level) => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-70">Deskripsi *</label>
                        <textarea
                            value={form.description}
                            onChange={(event) => setForm({ ...form, description: event.target.value })}
                            placeholder="Deskripsi singkat kelas"
                            rows={4}
                            className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all resize-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Pendaftaran Dibuka *</label>
                            <input
                                type="datetime-local"
                                value={form.register_start}
                                onChange={(event) => setForm({ ...form, register_start: event.target.value })}
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Pendaftaran Ditutup *</label>
                            <input
                                type="datetime-local"
                                value={form.register_end}
                                onChange={(event) => setForm({ ...form, register_end: event.target.value })}
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Biaya Pendaftaran *</label>
                            <input
                                type="number"
                                min="0"
                                value={form.register_fee}
                                onChange={(event) => setForm({ ...form, register_fee: Number(event.target.value) })}
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Status *</label>
                            <select
                                value={form.status}
                                onChange={(event) => setForm({ ...form, status: event.target.value })}
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                required
                            >
                                {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>{statusLabels[status]}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <ImageUploadField
                        label="Banner Kelas *"
                        value={form.image_banner}
                        folder="class"
                        onChange={(value) => setForm({ ...form, image_banner: value })}
                    />

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
                            id="btn-save-class"
                            className="flex-1 py-2.5 rounded-xl bg-primary-base text-absolute-white text-sm font-semibold hover:bg-primary-80 disabled:bg-neutral-30 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? "Menyimpan..." : mode === "create" ? "Tambah Kelas" : "Simpan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ClassesPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingClass, setEditingClass] = useState<Class | null>(null);
    const [detailClass, setDetailClass] = useState<Class | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchClasses = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({ page: String(page), limit: "12" });
            if (search) params.set("search", search);
            const response = await fetch(`/api/class?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal memuat data kelas");
            }

            const classData = (data.data || []) as Class[];
            setClasses(classData);
            setTotal(data.pagination?.total || classData.length);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        void fetchClasses();
    }, [fetchClasses]);

    const handleCreate = () => {
        setModalMode("create");
        setEditingClass(null);
        setModalOpen(true);
    };

    const handleEdit = (classItem: Class) => {
        setModalMode("edit");
        setEditingClass(classItem);
        setModalOpen(true);
    };

    const handleSave = async (formData: CreateClassInput | UpdateClassInput) => {
        const url = modalMode === "create" ? "/api/class" : `/api/class/${editingClass?.id}`;
        const method = modalMode === "create" ? "POST" : "PUT";
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.details || data.error || "Gagal menyimpan kelas");
        }

        setModalOpen(false);
        await fetchClasses();
    };

    const handleDelete = async (id: number) => {
        setIsDeleting(true);
        setError("");

        try {
            const response = await fetch(`/api/class/${id}`, { method: "DELETE" });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal menghapus kelas");
            }

            setDeleteConfirmId(null);
            await fetchClasses();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus kelas");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-40">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <input
                            type="search"
                            placeholder="Cari kelas..."
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            className="w-64 bg-absolute-white border border-neutral-20 rounded-xl py-2 pl-9 pr-4 text-sm text-neutral-70 placeholder:text-neutral-40 outline-none focus:border-primary-base transition-all"
                        />
                    </div>
                    <span className="text-sm text-neutral-50">{total} kelas</span>
                </div>
                <button
                    id="btn-create-class"
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-primary-base text-absolute-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-80 transition-all"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Tambah Kelas
                </button>
            </div>

            {error && <div className="bg-error-10 border border-error-base rounded-xl px-4 py-3 text-sm text-error-base">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden animate-pulse">
                            <div className="h-36 bg-neutral-10" />
                            <div className="p-5 space-y-3">
                                <div className="h-4 bg-neutral-10 rounded w-3/4" />
                                <div className="h-3 bg-neutral-10 rounded" />
                                <div className="h-3 bg-neutral-10 rounded w-1/2" />
                            </div>
                        </div>
                    ))
                ) : classes.length === 0 ? (
                    <div className="col-span-full bg-absolute-white rounded-2xl border border-neutral-20 p-12 text-center">
                        <p className="text-sm font-medium text-neutral-50">Belum ada kelas ditemukan</p>
                        <button onClick={handleCreate} className="mt-3 text-sm font-semibold text-primary-base hover:underline">
                            + Tambah kelas pertama
                        </button>
                    </div>
                ) : (
                    classes.map((classItem) => (
                        <div key={classItem.id} className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="relative h-36 bg-gradient-to-r from-primary-base to-primary-70">
                                {classItem.image_banner && (
                                    <img src={classItem.image_banner} alt={classItem.class_name} className="h-full w-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-90/70 to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4 flex items-start justify-between gap-2">
                                    <h3 className="text-base font-bold text-absolute-white leading-tight">{classItem.class_name}</h3>
                                    <span className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${statusColors[classItem.status] || "bg-neutral-50 text-absolute-white"}`}>
                                        {statusLabels[classItem.status] || classItem.status}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5 flex flex-col gap-3">
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${levelColors[classItem.level] ?? "bg-neutral-10 text-neutral-60"}`}>
                                        Level {classItem.level}
                                    </span>
                                    <span className="text-sm font-bold text-primary-base">{formatCurrency(classItem.register_fee)}</span>
                                </div>
                                <p className="text-sm text-neutral-60 line-clamp-2">{classItem.description}</p>
                                <div className="flex items-center gap-2 text-sm text-neutral-60">
                                    <svg className="w-4 h-4 text-neutral-40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    <span>{formatDate(classItem.register_start)} - {formatDate(classItem.register_end)}</span>
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t border-neutral-10 mt-1">
                                    <button
                                        onClick={() => setDetailClass(classItem)}
                                        className="flex-1 text-sm font-medium text-primary-base bg-primary-10 hover:bg-primary-20 py-2 rounded-lg transition-all"
                                    >
                                        Detail
                                    </button>
                                    <button
                                        id={`btn-edit-class-${classItem.id}`}
                                        onClick={() => handleEdit(classItem)}
                                        className="flex-1 text-sm font-medium text-neutral-60 bg-neutral-10 hover:bg-neutral-20 py-2 rounded-lg transition-all"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        id={`btn-delete-class-${classItem.id}`}
                                        onClick={() => setDeleteConfirmId(classItem.id)}
                                        className="flex-1 text-sm font-medium text-error-base bg-error-10 hover:bg-error-20 py-2 rounded-lg transition-all"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-20 text-neutral-60 disabled:opacity-40 hover:bg-neutral-10 transition-all"
                    >
                        Prev
                    </button>
                    <span className="text-sm text-neutral-50">Halaman {page} dari {totalPages}</span>
                    <button
                        onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-20 text-neutral-60 disabled:opacity-40 hover:bg-neutral-10 transition-all"
                    >
                        Next
                    </button>
                </div>
            )}

            <ClassModal
                isOpen={modalOpen}
                mode={modalMode}
                classItem={editingClass}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
            />

            {detailClass && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={() => setDetailClass(null)} />
                    <div className="relative bg-absolute-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-bold text-neutral-90 mb-2">{detailClass.class_name}</h3>
                        <p className="text-sm text-neutral-60 mb-4">{detailClass.description}</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-neutral-40">Level</span><p className="font-semibold text-neutral-80">{detailClass.level}</p></div>
                            <div><span className="text-neutral-40">Status</span><p className="font-semibold text-neutral-80">{statusLabels[detailClass.status] || detailClass.status}</p></div>
                            <div><span className="text-neutral-40">Biaya</span><p className="font-semibold text-neutral-80">{formatCurrency(detailClass.register_fee)}</p></div>
                            <div><span className="text-neutral-40">Mulai</span><p className="font-semibold text-neutral-80">{formatDate(detailClass.register_start)}</p></div>
                            <div className="col-span-2"><span className="text-neutral-40">Berakhir</span><p className="font-semibold text-neutral-80">{formatDate(detailClass.register_end)}</p></div>
                        </div>
                        <button
                            onClick={() => setDetailClass(null)}
                            className="mt-6 w-full py-2.5 rounded-xl bg-primary-base text-absolute-white text-sm font-semibold hover:bg-primary-80 transition-all"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            {deleteConfirmId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={() => setDeleteConfirmId(null)} />
                    <div className="relative bg-absolute-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <h3 className="text-base font-bold text-neutral-90 mb-2">Hapus Kelas?</h3>
                        <p className="text-sm text-neutral-50 mb-6">Data kelas ini akan dihapus permanen.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-2.5 rounded-xl border border-neutral-20 text-sm font-semibold text-neutral-60 hover:bg-neutral-10 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                id="btn-confirm-delete-class"
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
