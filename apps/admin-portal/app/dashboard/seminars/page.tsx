"use client";

import { useEffect, useState, useCallback } from "react";
import type { Seminar } from "@repo/types";
import SeminarModal from "./SeminarModal";

const STATUS_COLORS: Record<string, string> = {
    upcoming: "bg-primary-10 text-primary-base",
    ongoing: "bg-success-10 text-success-base",
    done: "bg-neutral-10 text-neutral-50",
};

const STATUS_LABELS: Record<string, string> = {
    upcoming: "Upcoming",
    ongoing: "On Going",
    done: "Selesai",
};

function formatDate(d: Date | string | null): string {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function SeminarsPage() {
    const [seminars, setSeminars] = useState<Seminar[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingSeminar, setEditingSeminar] = useState<Seminar | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchSeminars = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ page: String(page), limit: "10" });
            if (search) params.set("search", search);
            if (filterStatus) params.set("status", filterStatus);

            const res = await fetch(`/api/seminar?${params}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Gagal memuat data");
            setSeminars(data.data || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotal(data.pagination?.total || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    }, [page, search, filterStatus]);

    useEffect(() => {
        fetchSeminars();
    }, [fetchSeminars]);

    const handleCreate = () => {
        setModalMode("create");
        setEditingSeminar(null);
        setModalOpen(true);
    };

    const handleEdit = (seminar: Seminar) => {
        setModalMode("edit");
        setEditingSeminar(seminar);
        setModalOpen(true);
    };

    const handleSave = async (formData: object) => {
        const url = modalMode === "create" ? "/api/seminar" : `/api/seminar/${editingSeminar?.id}`;
        const method = modalMode === "create" ? "POST" : "PUT";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Gagal menyimpan");
        }

        setModalOpen(false);
        fetchSeminars();
    };

    const handleDelete = async (id: number) => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/seminar/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Gagal menghapus");
            setDeleteConfirmId(null);
            fetchSeminars();
        } catch {
            setError("Gagal menghapus seminar.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-40">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <input
                            type="search"
                            placeholder="Cari seminar..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-64 bg-absolute-white border border-neutral-20 rounded-xl py-2 pl-9 pr-4 text-sm text-neutral-70 placeholder:text-neutral-40 outline-none focus:border-primary-base transition-all"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                        className="bg-absolute-white border border-neutral-20 rounded-xl py-2 px-3 text-sm text-neutral-70 outline-none focus:border-primary-base transition-all"
                    >
                        <option value="">Semua Status</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">On Going</option>
                        <option value="done">Selesai</option>
                    </select>
                    <span className="text-sm text-neutral-50">{total} seminar</span>
                </div>
                <button
                    id="btn-create-seminar"
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-primary-base text-absolute-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-80 transition-all"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Buat Seminar
                </button>
            </div>

            {error && (
                <div className="bg-error-10 border border-error-base rounded-xl px-4 py-3 text-sm text-error-base">{error}</div>
            )}

            {/* Seminar List */}
            {isLoading ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-absolute-white rounded-2xl border border-neutral-20 p-6 animate-pulse">
                            <div className="h-5 bg-neutral-10 rounded w-1/3 mb-3" />
                            <div className="h-4 bg-neutral-10 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : seminars.length === 0 ? (
                <div className="bg-absolute-white rounded-2xl border border-neutral-20 p-12 flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-neutral-10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-neutral-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-neutral-50">Belum ada seminar</p>
                    <button onClick={handleCreate} className="text-sm font-semibold text-primary-base hover:underline">
                        + Buat seminar pertama
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {seminars.map((seminar) => (
                        <div key={seminar.id} className="bg-absolute-white rounded-2xl border border-neutral-20 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <h3 className="text-base font-bold text-neutral-90">{seminar.theme}</h3>
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[seminar.status] || "bg-neutral-10 text-neutral-50"}`}>
                                            {STATUS_LABELS[seminar.status] || seminar.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                        <div className="flex items-center gap-2 text-sm text-neutral-60">
                                            <svg className="w-4 h-4 text-neutral-40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            <span>{formatDate(seminar.event_date)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-neutral-60">
                                            <svg className="w-4 h-4 text-neutral-40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            <span>{seminar.event_time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-neutral-60">
                                            <svg className="w-4 h-4 text-neutral-40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                                            </svg>
                                            <span>{seminar.speaker}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 flex-shrink-0">
                                    <a
                                        href="/dashboard/seminars/registrations"
                                        className="text-sm font-medium text-primary-base bg-primary-10 hover:bg-primary-20 px-4 py-2 rounded-xl transition-all text-center whitespace-nowrap"
                                    >
                                        Lihat Pendaftar
                                    </a>
                                    <button
                                        id={`btn-edit-seminar-${seminar.id}`}
                                        onClick={() => handleEdit(seminar)}
                                        className="text-sm font-medium text-neutral-60 bg-neutral-10 hover:bg-neutral-20 px-4 py-2 rounded-xl transition-all"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        id={`btn-delete-seminar-${seminar.id}`}
                                        onClick={() => setDeleteConfirmId(seminar.id)}
                                        className="text-sm font-medium text-error-base bg-error-10 hover:bg-error-20 px-4 py-2 rounded-xl transition-all"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-20 text-neutral-60 disabled:opacity-40 hover:bg-neutral-10 transition-all"
                    >
                        ← Prev
                    </button>
                    <span className="text-sm text-neutral-50">Halaman {page} dari {totalPages}</span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-20 text-neutral-60 disabled:opacity-40 hover:bg-neutral-10 transition-all"
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Seminar Modal */}
            <SeminarModal
                isOpen={modalOpen}
                mode={modalMode}
                seminar={editingSeminar}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
            />

            {/* Delete Confirmation */}
            {deleteConfirmId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={() => setDeleteConfirmId(null)} />
                    <div className="relative bg-absolute-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <h3 className="text-base font-bold text-neutral-90 mb-2">Hapus Seminar?</h3>
                        <p className="text-sm text-neutral-50 mb-6">Tindakan ini tidak dapat dibatalkan. Seminar akan dihapus secara permanen.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-2.5 rounded-xl border border-neutral-20 text-sm font-semibold text-neutral-60 hover:bg-neutral-10 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                id="btn-confirm-delete"
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
