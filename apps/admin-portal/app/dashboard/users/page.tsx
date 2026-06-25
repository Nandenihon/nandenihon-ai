"use client";

import { useEffect, useState, useCallback } from "react";
import type { User, UserRole } from "@repo/types";

const ROLES: UserRole[] = ["super_admin", "admin", "teacher", "student"];
const ROLE_LABELS: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    teacher: "Pengajar",
    student: "Siswa",
};
const ROLE_COLORS: Record<string, string> = {
    super_admin: "bg-error-10 text-error-base",
    admin: "bg-primary-10 text-primary-base",
    teacher: "bg-success-10 text-success-base",
    student: "bg-neutral-10 text-neutral-50",
};

interface UserFormData {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

function UserModal({ isOpen, mode, user, onClose, onSave }: {
    isOpen: boolean;
    mode: "create" | "edit";
    user?: User | null;
    onClose: () => void;
    onSave: (data: UserFormData) => Promise<void>;
}) {
    const [form, setForm] = useState<UserFormData>({ name: "", email: "", password: "", role: "admin" });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        if (mode === "edit" && user) {
            setForm({ name: user.name || "", email: user.email || "", password: "", role: user.role || "admin" });
        } else {
            setForm({ name: "", email: "", password: "", role: "admin" });
        }
        setError("");
    }, [mode, user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!form.name || !form.email) { setError("Nama dan email wajib diisi."); return; }
        if (mode === "create" && !form.password) { setError("Password wajib diisi untuk user baru."); return; }
        setIsLoading(true);
        try {
            await onSave(form);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal menyimpan.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={onClose} />
            <div className="relative bg-absolute-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="border-b border-neutral-10 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-90">{mode === "create" ? "Tambah User" : "Edit User"}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-50 hover:bg-neutral-10 transition-all">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    {error && <div className="bg-error-10 border border-error-base rounded-lg px-4 py-3 text-sm text-error-base">{error}</div>}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-70">Nama *</label>
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Nama lengkap"
                            className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-70">Email *</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="email@nandenihon.com"
                            className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-70">
                            Password {mode === "edit" && <span className="text-neutral-40 font-normal">(kosongkan jika tidak diubah)</span>}
                        </label>
                        <div className="relative">
                            <input type={showPass ? "text" : "password"} value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder={mode === "create" ? "Password baru" : "Biarkan kosong jika tidak diubah"}
                                className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 pl-4 pr-10 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all" />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-40 hover:text-neutral-70">
                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                    {showPass ? <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /> : <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />}
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-70">Role *</label>
                        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                            className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all">
                            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-neutral-20 text-sm font-semibold text-neutral-60 hover:bg-neutral-10 transition-all">Batal</button>
                        <button type="submit" disabled={isLoading} id="btn-save-user"
                            className="flex-1 py-2.5 rounded-xl bg-primary-base text-absolute-white text-sm font-semibold hover:bg-primary-80 disabled:bg-neutral-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                            {isLoading ? "Menyimpan..." : (mode === "create" ? "Tambah User" : "Simpan")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ page: String(page), limit: "15" });
            if (search) params.set("search", search);
            const res = await fetch(`/api/user?${params}`);
            const data = await res.json();
            if (res.status === 403) { setError("Akses ditolak. Hanya admin yang dapat melihat halaman ini."); return; }
            if (!res.ok) throw new Error(data.error || "Gagal memuat data");
            setUsers(data.data || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotal(data.pagination?.total || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleCreate = () => { setModalMode("create"); setEditingUser(null); setModalOpen(true); };
    const handleEdit = (u: User) => { setModalMode("edit"); setEditingUser(u); setModalOpen(true); };

    const handleSave = async (formData: UserFormData) => {
        const url = modalMode === "create" ? "/api/user" : `/api/user/${editingUser?.id}`;
        const method = modalMode === "create" ? "POST" : "PUT";
        const body = { ...formData };
        if (mode === "edit" && !body.password) delete (body as Partial<UserFormData>).password;
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Gagal menyimpan"); }
        setModalOpen(false);
        fetchUsers();
    };

    const handleDelete = async (id: number) => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/user/${id}`, { method: "DELETE" });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Gagal menghapus"); }
            setDeleteConfirmId(null);
            fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal menghapus user.");
        } finally {
            setIsDeleting(false);
        }
    };

    // trick to get mode in handleSave scope
    const mode = modalMode;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-40">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <input type="search" placeholder="Cari user..." value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-60 bg-absolute-white border border-neutral-20 rounded-xl py-2 pl-9 pr-4 text-sm text-neutral-70 placeholder:text-neutral-40 outline-none focus:border-primary-base transition-all" />
                    </div>
                    <span className="text-sm text-neutral-50">{total} user</span>
                </div>
                <button id="btn-create-user" onClick={handleCreate}
                    className="flex items-center gap-2 bg-primary-base text-absolute-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-80 transition-all">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Tambah User
                </button>
            </div>

            {error && (
                <div className="bg-error-10 border border-error-base rounded-xl px-4 py-3 text-sm text-error-base">{error}</div>
            )}

            {/* Table */}
            <div className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-0 border-b border-neutral-20">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-50 uppercase tracking-wider">User</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Email</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Role</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Dibuat</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-10">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-3"><div className="h-4 bg-neutral-10 rounded w-32" /></td>
                                        <td className="px-4 py-3"><div className="h-4 bg-neutral-10 rounded w-40" /></td>
                                        <td className="px-4 py-3"><div className="h-4 bg-neutral-10 rounded w-20" /></td>
                                        <td className="px-4 py-3"><div className="h-4 bg-neutral-10 rounded w-24" /></td>
                                        <td className="px-4 py-3"><div className="h-4 bg-neutral-10 rounded w-16 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-40">Tidak ada user ditemukan</td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-neutral-0 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-10 flex items-center justify-center text-primary-base text-sm font-bold flex-shrink-0">
                                                    {u.name?.charAt(0).toUpperCase() || "U"}
                                                </div>
                                                <span className="text-sm font-semibold text-neutral-80 truncate max-w-[140px]">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-neutral-60 truncate max-w-[180px]">{u.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role] || "bg-neutral-10 text-neutral-50"}`}>
                                                {ROLE_LABELS[u.role] || u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-neutral-40">
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString("id-ID") : "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button id={`btn-edit-user-${u.id}`} onClick={() => handleEdit(u)}
                                                    className="text-xs font-semibold text-primary-base bg-primary-10 hover:bg-primary-20 px-3 py-1.5 rounded-lg transition-all">Edit</button>
                                                <button id={`btn-delete-user-${u.id}`} onClick={() => setDeleteConfirmId(u.id)}
                                                    className="text-xs font-semibold text-error-base bg-error-10 hover:bg-error-20 px-3 py-1.5 rounded-lg transition-all">Hapus</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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

            <UserModal isOpen={modalOpen} mode={modalMode} user={editingUser} onClose={() => setModalOpen(false)} onSave={handleSave} />

            {deleteConfirmId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={() => setDeleteConfirmId(null)} />
                    <div className="relative bg-absolute-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <h3 className="text-base font-bold text-neutral-90 mb-2">Hapus User?</h3>
                        <p className="text-sm text-neutral-50 mb-6">User ini akan dihapus secara permanen dari sistem.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-20 text-sm font-semibold text-neutral-60 hover:bg-neutral-10 transition-all">Batal</button>
                            <button id="btn-confirm-delete-user" onClick={() => handleDelete(deleteConfirmId)} disabled={isDeleting}
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
