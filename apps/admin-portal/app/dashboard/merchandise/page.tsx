"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import ImageUploadField from "@/app/components/ImageUploadField";
import type { MerchandiseItem } from "@repo/types";

interface MerchandiseFormData {
    title: string;
    description: string;
    price: number;
    image_url: string;
}

interface MerchandiseModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    item?: MerchandiseItem | null;
    onClose: () => void;
    onSave: (data: MerchandiseFormData) => Promise<void>;
}

const DEFAULT_FORM: MerchandiseFormData = {
    title: "",
    description: "",
    price: 0,
    image_url: "",
};

function getPreviewSrc(value: string) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return "";
    }

    try {
        const parsedUrl = new URL(trimmedValue);
        if (parsedUrl.pathname.startsWith("/uploads/")) {
            return parsedUrl.pathname;
        }
    } catch {
        // Relative paths can be rendered directly.
    }

    return trimmedValue;
}

function formatCurrency(value: number | string): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
}

function MerchandiseModal({ isOpen, mode, item, onClose, onSave }: MerchandiseModalProps) {
    const [form, setForm] = useState<MerchandiseFormData>(DEFAULT_FORM);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (mode === "edit" && item) {
            setForm({
                title: item.title || "",
                description: item.description || "",
                price: Number(item.price) || 0,
                image_url: item.image_url || "",
            });
        } else {
            setForm(DEFAULT_FORM);
        }
        setError("");
    }, [mode, item, isOpen]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");

        if (!form.title.trim()) {
            setError("Nama barang wajib diisi.");
            return;
        }

        if (Number(form.price) < 0) {
            setError("Harga tidak valid.");
            return;
        }

        if (!form.image_url.trim()) {
            setError("Foto barang wajib diupload atau diisi.");
            return;
        }

        setIsLoading(true);
        try {
            await onSave({
                title: form.title.trim(),
                description: form.description.trim(),
                price: Number(form.price) || 0,
                image_url: form.image_url.trim(),
            });
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan merchandise.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={onClose} />
            <div className="relative bg-absolute-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-absolute-white rounded-t-2xl border-b border-neutral-10 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-90">
                        {mode === "create" ? "Tambah Merchandise" : "Edit Merchandise"}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-50 hover:bg-neutral-10 transition-all">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    {error && (
                        <div className="bg-error-10 border border-error-base rounded-lg px-4 py-3 text-sm text-error-base">
                            {error}
                        </div>
                    )}

                    <p className="text-xs font-semibold text-neutral-40 uppercase tracking-wider">
                        Informasi Barang
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Nama Barang *</label>
                            <input
                                value={form.title}
                                onChange={(event) => setForm({ ...form, title: event.target.value })}
                                placeholder="Contoh: Tote Bag Nande Nihon"
                                required
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-70">Harga *</label>
                            <input
                                type="number"
                                min="0"
                                value={form.price}
                                onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
                                required
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-70">Deskripsi</label>
                        <textarea
                            value={form.description}
                            onChange={(event) => setForm({ ...form, description: event.target.value })}
                            placeholder="Deskripsi singkat barang"
                            rows={4}
                            className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all resize-none"
                        />
                    </div>

                    <ImageUploadField
                        label="Upload Foto Barang *"
                        value={form.image_url}
                        folder="merchandise"
                        onChange={(value) => setForm({ ...form, image_url: value })}
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
                            className="flex-1 py-2.5 rounded-xl bg-primary-base text-absolute-white text-sm font-semibold hover:bg-primary-80 disabled:bg-neutral-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? "Menyimpan..." : mode === "create" ? "Tambah Barang" : "Simpan Perubahan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function MerchandisePage() {
    const [items, setItems] = useState<MerchandiseItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingItem, setEditingItem] = useState<MerchandiseItem | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchMerchandise = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/merchandise?page=${page}&limit=12`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal memuat merchandise");
            }

            setItems(data.data || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotal(data.pagination?.total || 0);
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    }, [page]);

    useEffect(() => {
        void fetchMerchandise();
    }, [fetchMerchandise]);

    const handleCreate = () => {
        setModalMode("create");
        setEditingItem(null);
        setModalOpen(true);
    };

    const handleEdit = (item: MerchandiseItem) => {
        setModalMode("edit");
        setEditingItem(item);
        setModalOpen(true);
    };

    const handleSave = async (formData: MerchandiseFormData) => {
        const url = modalMode === "create" ? "/api/merchandise" : `/api/merchandise/${editingItem?.id}`;
        const method = modalMode === "create" ? "POST" : "PUT";
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Gagal menyimpan merchandise");
        }

        setModalOpen(false);
        await fetchMerchandise();
    };

    const handleDelete = async (id: number) => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/merchandise/${id}`, { method: "DELETE" });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || "Gagal menghapus merchandise");
            }

            setDeleteConfirmId(null);
            await fetchMerchandise();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus merchandise.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-90">Merchandise</h1>
                    <p className="text-sm text-neutral-50 mt-1">
                        Kelola barang merchandise yang tampil di landing page.
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-primary-base text-absolute-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-80 transition-all"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Tambah Barang
                </button>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-50">{total} barang merchandise</span>
            </div>

            {error && (
                <div className="bg-error-10 border border-error-base rounded-xl px-4 py-3 text-sm text-error-base">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div key={item} className="bg-absolute-white rounded-2xl border border-neutral-20 p-4 animate-pulse">
                            <div className="aspect-square rounded-xl bg-neutral-10" />
                            <div className="h-4 bg-neutral-10 rounded w-2/3 mt-4" />
                            <div className="h-3 bg-neutral-10 rounded w-1/3 mt-3" />
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="bg-absolute-white rounded-2xl border border-neutral-20 p-12 flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary-10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary-base" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 2l1.5 4h9L18 2" />
                            <path d="M3 6h18l-2 15H5L3 6z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-neutral-50">Belum ada barang merchandise</p>
                    <button onClick={handleCreate} className="text-sm font-semibold text-primary-base hover:underline">
                        + Tambah barang pertama
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {items.map((item) => (
                        <article key={item.id} className="bg-absolute-white rounded-2xl border border-neutral-20 p-4 hover:shadow-md transition-shadow">
                            <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-10">
                                <Image
                                    src={getPreviewSrc(item.image_url)}
                                    alt={item.title}
                                    fill
                                    sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 90vw"
                                    className="object-cover"
                                />
                            </div>
                            <div className="mt-4">
                                <h2 className="text-base font-bold text-neutral-90">{item.title}</h2>
                                <p className="text-sm font-bold text-primary-base mt-1">{formatCurrency(item.price)}</p>
                                {item.description && (
                                    <p className="text-sm text-neutral-60 leading-relaxed mt-3 line-clamp-2">
                                        {item.description}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-neutral-10">
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="text-xs font-semibold text-primary-base bg-primary-10 hover:bg-primary-20 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setDeleteConfirmId(item.id)}
                                    className="text-xs font-semibold text-error-base bg-error-10 hover:bg-error-20 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    Hapus
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-20 text-neutral-60 disabled:opacity-40 hover:bg-neutral-10 transition-all"
                    >
                        Prev
                    </button>
                    <span className="text-sm text-neutral-50">
                        Halaman {page} dari {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-20 text-neutral-60 disabled:opacity-40 hover:bg-neutral-10 transition-all"
                    >
                        Next
                    </button>
                </div>
            )}

            <MerchandiseModal
                isOpen={modalOpen}
                mode={modalMode}
                item={editingItem}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
            />

            {deleteConfirmId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={() => setDeleteConfirmId(null)} />
                    <div className="relative bg-absolute-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <h3 className="text-base font-bold text-neutral-90 mb-2">Hapus Merchandise?</h3>
                        <p className="text-sm text-neutral-50 mb-6">Barang ini akan dihapus dari daftar merchandise.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-2.5 rounded-xl border border-neutral-20 text-sm font-semibold text-neutral-60 hover:bg-neutral-10 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmId)}
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
