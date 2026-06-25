"use client";

import { useEffect, useState, useCallback } from "react";
import type { Team } from "@repo/types";
import TeamModal from "./TeamModal";

export default function TeamPage() {
    const [team, setTeam] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingMember, setEditingMember] = useState<Team | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchTeam = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ page: String(page), limit: "12" });
            if (search) params.set("search", search);
            const res = await fetch(`/api/team?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal memuat data");
            setTeam(data.data || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotal(data.pagination?.total || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchTeam(); }, [fetchTeam]);

    const handleCreate = () => { setModalMode("create"); setEditingMember(null); setModalOpen(true); };
    const handleEdit = (m: Team) => { setModalMode("edit"); setEditingMember(m); setModalOpen(true); };

    const handleSave = async (formData: object) => {
        const url = modalMode === "create" ? "/api/team" : `/api/team/${editingMember?.id}`;
        const method = modalMode === "create" ? "POST" : "PUT";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Gagal menyimpan"); }
        setModalOpen(false);
        fetchTeam();
    };

    const handleDelete = async (id: number) => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Gagal menghapus");
            setDeleteConfirmId(null);
            fetchTeam();
        } catch { setError("Gagal menghapus anggota tim."); }
        finally { setIsDeleting(false); }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-40">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <input type="search" placeholder="Cari anggota tim..." value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-60 bg-absolute-white border border-neutral-20 rounded-xl py-2 pl-9 pr-4 text-sm text-neutral-70 placeholder:text-neutral-40 outline-none focus:border-primary-base transition-all" />
                    </div>
                    <span className="text-sm text-neutral-50">{total} anggota</span>
                </div>
                <button id="btn-create-team" onClick={handleCreate}
                    className="flex items-center gap-2 bg-primary-base text-absolute-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-80 transition-all">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Tambah Anggota Tim
                </button>
            </div>

            {error && <div className="bg-error-10 border border-error-base rounded-xl px-4 py-3 text-sm text-error-base">{error}</div>}

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-absolute-white rounded-2xl border border-neutral-20 p-6 animate-pulse flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-neutral-10" />
                            <div className="h-4 bg-neutral-10 rounded w-3/4" />
                            <div className="h-3 bg-neutral-10 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : team.length === 0 ? (
                <div className="bg-absolute-white rounded-2xl border border-neutral-20 p-12 flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-neutral-10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-neutral-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-neutral-50">Belum ada anggota tim</p>
                    <button onClick={handleCreate} className="text-sm font-semibold text-primary-base hover:underline">+ Tambah anggota pertama</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {team.map((member) => (
                        <div key={member.id} className="bg-absolute-white rounded-2xl border border-neutral-20 p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center gap-4">
                            {member.photo ? (
                                <img src={member.photo} alt={member.full_name || ""} className="w-16 h-16 rounded-full object-cover" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-base to-primary-70 flex items-center justify-center text-absolute-white text-2xl font-bold">
                                    {(member.full_name || "?").charAt(0)}
                                </div>
                            )}
                            <div>
                                <h3 className="text-base font-bold text-neutral-90">{member.full_name || "-"}</h3>
                                {member.nickname && <p className="text-xs text-neutral-40 mt-0.5">({member.nickname})</p>}
                                <p className="text-sm text-primary-base font-medium mt-0.5">{member.division || "-"}</p>
                            </div>
                            <div className="w-full flex flex-col gap-2 text-sm text-neutral-60">
                                {member.jlpt_level && (
                                    <span className="self-center text-xs bg-primary-10 text-primary-base px-2.5 py-1 rounded-full font-medium">{member.jlpt_level}</span>
                                )}
                                {member.email && (
                                    <div className="flex items-center gap-2 justify-center">
                                        <svg className="w-4 h-4 text-neutral-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                                        </svg>
                                        <span className="truncate text-xs">{member.email}</span>
                                    </div>
                                )}
                                {member.domicile && (
                                    <div className="flex items-center gap-2 justify-center">
                                        <svg className="w-4 h-4 text-neutral-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <span className="text-xs">{member.domicile}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 w-full pt-2 border-t border-neutral-10 mt-auto">
                                <button id={`btn-edit-team-${member.id}`} onClick={() => handleEdit(member)}
                                    className="flex-1 text-sm font-medium text-primary-base bg-primary-10 hover:bg-primary-20 py-2 rounded-lg transition-all">Edit</button>
                                <button id={`btn-delete-team-${member.id}`} onClick={() => setDeleteConfirmId(member.id)}
                                    className="flex-1 text-sm font-medium text-error-base bg-error-10 hover:bg-error-20 py-2 rounded-lg transition-all">Hapus</button>
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

            <TeamModal isOpen={modalOpen} mode={modalMode} member={editingMember} onClose={() => setModalOpen(false)} onSave={handleSave} />

            {deleteConfirmId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={() => setDeleteConfirmId(null)} />
                    <div className="relative bg-absolute-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <h3 className="text-base font-bold text-neutral-90 mb-2">Hapus Anggota Tim?</h3>
                        <p className="text-sm text-neutral-50 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-2.5 rounded-xl border border-neutral-20 text-sm font-semibold text-neutral-60 hover:bg-neutral-10 transition-all">Batal</button>
                            <button id="btn-confirm-delete-team" onClick={() => handleDelete(deleteConfirmId)} disabled={isDeleting}
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
