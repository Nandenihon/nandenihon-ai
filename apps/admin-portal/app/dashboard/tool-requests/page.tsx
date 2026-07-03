"use client";

import { useEffect, useState, useCallback } from "react";
import type { UserSession } from "@repo/types";

interface ToolRequest {
    id: number;
    requester_id: number;
    tool_name: string;
    quantity: number;
    notes: string | null;
    status: "pending" | "approved" | "rejected";
    responder_id: number | null;
    response_notes: string | null;
    category: string;
    provided_link: string | null;
    created_at: string;
    updated_at: string;
    requester_name: string;
    requester_email: string;
    responder_name: string | null;
}

const statusColors: Record<string, string> = {
    pending: "bg-warning-10 text-warning-100",
    approved: "bg-success-10 text-success-base",
    rejected: "bg-error-10 text-error-base",
};

const statusLabels: Record<string, string> = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
};

const CATEGORIES = ["Zoom Link", "Alat Pembelajaran", "Lainnya"];

export default function ToolRequestsPage() {
    const [requests, setRequests] = useState<ToolRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [session, setSession] = useState<UserSession | null>(null);

    // Modal state for Class Admin (Create/Edit)
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [requestForm, setRequestForm] = useState({ tool_name: "", quantity: 1, notes: "", category: "Alat Pembelajaran" });
    const [editingRequest, setEditingRequest] = useState<ToolRequest | null>(null);
    const [isSavingRequest, setIsSavingRequest] = useState(false);

    // Modal state for Helpdesk (Respond)
    const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ToolRequest | null>(null);
    const [responseForm, setResponseForm] = useState({ status: "approved" as "approved" | "rejected", response_notes: "", provided_link: "" });
    const [isSavingResponse, setIsSavingResponse] = useState(false);

    // Modal state for Detail View
    const [detailsRequest, setDetailsRequest] = useState<ToolRequest | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ page: String(page), limit: "10" });
            const res = await fetch(`/api/tool-requests?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal memuat data");
            setRequests(data.data || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotal(data.pagination?.total || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    }, [page]);

    useEffect(() => {
        // Fetch session
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (data.user) setSession(data.user);
            })
            .catch(() => {});

        fetchRequests();
    }, [page, fetchRequests]);

    const handleCreateRequest = () => {
        setEditingRequest(null);
        setRequestForm({ tool_name: "", quantity: 1, notes: "", category: "Alat Pembelajaran" });
        setIsRequestModalOpen(true);
    };

    const handleEditRequest = (req: ToolRequest) => {
        setEditingRequest(req);
        setRequestForm({
            tool_name: req.tool_name,
            quantity: req.quantity,
            notes: req.notes || "",
            category: req.category || "Alat Pembelajaran",
        });
        setIsRequestModalOpen(true);
    };

    const handleSaveRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSavingRequest(true);
        try {
            const url = editingRequest ? `/api/tool-requests/${editingRequest.id}` : "/api/tool-requests";
            const method = editingRequest ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal mengirim request");
            
            setIsRequestModalOpen(false);
            fetchRequests();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsSavingRequest(false);
        }
    };

    const handleDeleteRequest = async (id: number) => {
        if (!confirm("Apakah Anda yakin ingin menghapus request ini?")) return;
        setError("");
        try {
            const res = await fetch(`/api/tool-requests/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal menghapus");
            fetchRequests();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal menghapus request");
        }
    };

    const handleRespondClick = (req: ToolRequest) => {
        setSelectedRequest(req);
        setResponseForm({ status: "approved", response_notes: "", provided_link: req.provided_link || "" });
        setIsRespondModalOpen(true);
    };

    const handleSaveResponse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;
        setError("");
        setIsSavingResponse(true);
        try {
            const res = await fetch(`/api/tool-requests/${selectedRequest.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(responseForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal menyimpan respon");
            
            setIsRespondModalOpen(false);
            fetchRequests();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsSavingResponse(false);
        }
    };

    const isClassAdmin = session?.role === "admin-class" || session?.role === "admin" || session?.role === "super_admin";
    const isHelpdesk = session?.role === "helpdesk" || session?.role === "admin" || session?.role === "super_admin";

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-xl font-bold text-neutral-90">Request Tool Pembelajaran</h2>
                    <p className="text-sm text-neutral-50">Kebutuhan alat bantu/fasilitas pembelajaran kelas</p>
                </div>
                {isClassAdmin && (
                    <button
                        onClick={handleCreateRequest}
                        className="flex items-center gap-2 bg-primary-base text-absolute-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-80 transition-all"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Buat Request Baru
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-error-10 border border-error-base rounded-xl px-4 py-3 text-sm text-error-base">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
                    <table className="w-full table-fixed min-w-[800px] lg:min-w-0">
                        <thead className="bg-neutral-0 border-b border-neutral-20 sticky top-0 z-10">
                            <tr>
                                <th className="w-[18%] text-left px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Requester</th>
                                <th className="w-[18%] text-left px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Nama Alat</th>
                                <th className="w-[8%] text-left px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Jumlah</th>
                                <th className="w-[20%] text-left px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Catatan Pengaju</th>
                                <th className="w-[12%] text-left px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Status</th>
                                <th className="w-[20%] text-left px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Respon Helpdesk</th>
                                <th className="w-[8%] text-right px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-10">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-24" /></td>
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-32" /></td>
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-12" /></td>
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-40" /></td>
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-16" /></td>
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-32" /></td>
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-16 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-8 text-center text-sm text-neutral-40">Belum ada request tool pembelajaran</td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr
                                        key={req.id}
                                        onClick={() => setDetailsRequest(req)}
                                        className="hover:bg-neutral-0 transition-colors cursor-pointer"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-semibold text-neutral-80 truncate" title={req.requester_name}>{req.requester_name}</span>
                                                <span className="text-xs text-neutral-40 truncate" title={req.requester_email}>{req.requester_email}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <span className="text-sm font-semibold text-neutral-80 truncate" title={req.tool_name}>{req.tool_name}</span>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded w-max truncate ${
                                                    req.category === "Zoom Link" ? "bg-info-10 text-info-base" : "bg-neutral-10 text-neutral-60"
                                                }`}>
                                                    {req.category}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-neutral-70 truncate">{req.quantity}</td>
                                        <td className="px-5 py-4">
                                            <div className="text-sm text-neutral-50 truncate" title={req.notes || ""}>
                                                {req.notes || "-"}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusColors[req.status]}`}>
                                                {statusLabels[req.status]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <span className="text-sm text-neutral-70 truncate" title={req.response_notes || ""}>{req.response_notes || "-"}</span>
                                                {req.provided_link && (
                                                    <a
                                                        href={req.provided_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-xs text-primary-base hover:underline font-semibold flex items-center gap-1 w-max"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                                                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                                                        </svg>
                                                        Buka Tautan / Zoom
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                {req.status === "pending" && isClassAdmin && req.requester_id === session?.id && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditRequest(req)}
                                                            className="text-xs font-semibold text-primary-base bg-primary-10 hover:bg-primary-20 px-2.5 py-1.5 rounded-lg transition-all"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRequest(req.id)}
                                                            className="text-xs font-semibold text-error-base bg-error-10 hover:bg-error-20 px-2.5 py-1.5 rounded-lg transition-all"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </>
                                                )}
                                                {req.status === "pending" && isHelpdesk && (
                                                    <button
                                                        onClick={() => handleRespondClick(req)}
                                                        className="text-xs font-semibold text-success-base bg-success-10 hover:bg-success-20 px-3 py-1.5 rounded-lg transition-all"
                                                    >
                                                        Respon
                                                    </button>
                                                )}
                                                {req.status !== "pending" && (
                                                    <span className="text-xs text-neutral-40">Selesai</span>
                                                )}
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

            {/* Modal: Create/Edit Request */}
            {isRequestModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={() => setIsRequestModalOpen(false)} />
                    <div className="relative bg-absolute-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="border-b border-neutral-10 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-neutral-90">
                                {editingRequest ? "Edit Request Tool" : "Request Tool Baru"}
                            </h2>
                            <button
                                onClick={() => setIsRequestModalOpen(false)}
                                className="p-1.5 rounded-lg text-neutral-50 hover:bg-neutral-10 transition-all"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSaveRequest} className="p-6 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-70">Kategori *</label>
                                <select
                                    value={requestForm.category}
                                    onChange={(e) => {
                                        const cat = e.target.value;
                                        setRequestForm({
                                            ...requestForm,
                                            category: cat,
                                            tool_name: cat === "Zoom Link" ? "Zoom Link Kelas" : requestForm.tool_name === "Zoom Link Kelas" ? "" : requestForm.tool_name
                                        });
                                    }}
                                    className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-70">Nama Alat / Fasilitas *</label>
                                <input
                                    value={requestForm.tool_name}
                                    onChange={(e) => setRequestForm({ ...requestForm, tool_name: e.target.value })}
                                    placeholder="Contoh: Projector, Speaker, Zoom Link"
                                    className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-70">Jumlah *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={requestForm.quantity}
                                    onChange={(e) => setRequestForm({ ...requestForm, quantity: Number(e.target.value) })}
                                    className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-70">Catatan Penggunaan</label>
                                <textarea
                                    value={requestForm.notes}
                                    onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                                    placeholder="Tuliskan tujuan request tool ini..."
                                    rows={3}
                                    className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsRequestModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-neutral-20 text-sm font-semibold text-neutral-60 hover:bg-neutral-10 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingRequest}
                                    className="flex-1 py-2.5 rounded-xl bg-primary-base text-absolute-white text-sm font-semibold hover:bg-primary-80 disabled:bg-neutral-30 transition-all"
                                >
                                    {isSavingRequest ? "Mengirim..." : (editingRequest ? "Simpan Perubahan" : "Kirim Request")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Helpdesk Response */}
            {isRespondModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={() => setIsRespondModalOpen(false)} />
                    <div className="relative bg-absolute-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="border-b border-neutral-10 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-neutral-90">Respon Request Tool</h2>
                            <button
                                onClick={() => setIsRespondModalOpen(false)}
                                className="p-1.5 rounded-lg text-neutral-50 hover:bg-neutral-10 transition-all"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSaveResponse} className="p-6 flex flex-col gap-4">
                            <div className="bg-neutral-0 p-4 rounded-xl border border-neutral-20 flex flex-col gap-1.5">
                                <p className="text-xs text-neutral-40 font-semibold uppercase">Detail Request</p>
                                <p className="text-sm font-bold text-neutral-80">{selectedRequest.tool_name} ({selectedRequest.quantity} pcs)</p>
                                <p className="text-xs text-neutral-50 font-medium">Kategori: {selectedRequest.category}</p>
                                <p className="text-xs text-neutral-50">Pengaju: {selectedRequest.requester_name}</p>
                                {selectedRequest.notes && (
                                    <p className="text-xs text-neutral-50 mt-1 italic">"{selectedRequest.notes}"</p>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-70">Keputusan *</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm text-neutral-80 font-medium cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="approved"
                                            checked={responseForm.status === "approved"}
                                            onChange={() => setResponseForm({ ...responseForm, status: "approved" })}
                                            className="accent-success-base"
                                        />
                                        Setujui
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-neutral-80 font-medium cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="rejected"
                                            checked={responseForm.status === "rejected"}
                                            onChange={() => setResponseForm({ ...responseForm, status: "rejected" })}
                                            className="accent-error-base"
                                        />
                                        Tolak
                                    </label>
                                </div>
                            </div>
                            {responseForm.status === "approved" && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-neutral-70">
                                        {selectedRequest.category === "Zoom Link" ? "Link Zoom *" : "Link Zoom / Tautan Pendukung (Opsional)"}
                                    </label>
                                    <input
                                        type="url"
                                        value={responseForm.provided_link}
                                        onChange={(e) => setResponseForm({ ...responseForm, provided_link: e.target.value })}
                                        placeholder="https://zoom.us/j/... atau tautan lainnya"
                                        className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                        required={selectedRequest.category === "Zoom Link"}
                                    />
                                </div>
                            )}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-70">Catatan Tanggapan (Opsional)</label>
                                <textarea
                                    value={responseForm.response_notes}
                                    onChange={(e) => setResponseForm({ ...responseForm, response_notes: e.target.value })}
                                    placeholder="Tuliskan catatan dari helpdesk (misal: link Zoom KBM N5)"
                                    rows={3}
                                    className="w-full bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsRespondModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-neutral-20 text-sm font-semibold text-neutral-60 hover:bg-neutral-10 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingResponse}
                                    className="flex-1 py-2.5 rounded-xl bg-success-base text-absolute-white text-sm font-semibold hover:bg-success-80 disabled:bg-neutral-30 transition-all"
                                >
                                    {isSavingResponse ? "Mengirim..." : "Kirim Tanggapan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Request Details */}
            {detailsRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-neutral-90 opacity-40" onClick={() => setDetailsRequest(null)} />
                    <div className="relative bg-absolute-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="border-b border-neutral-10 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-neutral-90">Detail Request Pembelajaran</h2>
                            <button
                                onClick={() => setDetailsRequest(null)}
                                className="p-1.5 rounded-lg text-neutral-50 hover:bg-neutral-10 transition-all"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-neutral-45 font-semibold uppercase">Nama Alat / Zoom Link</p>
                                    <p className="text-sm font-bold text-neutral-80">{detailsRequest.tool_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-45 font-semibold uppercase">Kategori</p>
                                    <p className="text-sm font-bold text-neutral-80">{detailsRequest.category}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-45 font-semibold uppercase">Jumlah (Quantity)</p>
                                    <p className="text-sm text-neutral-80">{detailsRequest.quantity} pcs</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-45 font-semibold uppercase">Status</p>
                                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 mt-0.5 rounded-full ${statusColors[detailsRequest.status]}`}>
                                        {statusLabels[detailsRequest.status]}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-neutral-10 pt-3">
                                <p className="text-xs text-neutral-45 font-semibold uppercase">Diajukan Oleh</p>
                                <p className="text-sm font-medium text-neutral-80">{detailsRequest.requester_name} ({detailsRequest.requester_email})</p>
                                <p className="text-xs text-neutral-40">Pada: {new Date(detailsRequest.created_at).toLocaleString("id-ID")}</p>
                            </div>

                            <div className="border-t border-neutral-10 pt-3">
                                <p className="text-xs text-neutral-45 font-semibold uppercase">Catatan Pengaju</p>
                                <p className="text-sm text-neutral-70 bg-neutral-0 p-3 rounded-xl border border-neutral-20 whitespace-pre-wrap">
                                    {detailsRequest.notes || "-"}
                                </p>
                            </div>

                            {(detailsRequest.status !== "pending" || detailsRequest.response_notes || detailsRequest.provided_link) && (
                                <div className="border-t border-neutral-10 pt-3 flex flex-col gap-2">
                                    <p className="text-xs text-neutral-45 font-semibold uppercase">Respon Helpdesk</p>
                                    <div className="bg-neutral-0 p-3 rounded-xl border border-neutral-20 flex flex-col gap-2">
                                        <div>
                                            <p className="text-xs text-neutral-40">Catatan Tanggapan:</p>
                                            <p className="text-sm text-neutral-70 whitespace-pre-wrap">{detailsRequest.response_notes || "-"}</p>
                                        </div>
                                        {detailsRequest.provided_link && (
                                            <div>
                                                <p className="text-xs text-neutral-40">Link Zoom / Tautan:</p>
                                                <a
                                                    href={detailsRequest.provided_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-primary-base font-semibold hover:underline flex items-center gap-1.5 mt-0.5"
                                                >
                                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                                                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                                                    </svg>
                                                    {detailsRequest.provided_link}
                                                </a>
                                            </div>
                                        )}
                                        {detailsRequest.responder_name && (
                                            <p className="text-xs text-neutral-45 mt-1">Ditanggapi oleh: {detailsRequest.responder_name}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-3 border-t border-neutral-10">
                                <button
                                    onClick={() => setDetailsRequest(null)}
                                    className="py-2 px-6 rounded-xl bg-neutral-10 hover:bg-neutral-20 text-sm font-semibold text-neutral-70 transition-all"
                                >
                                    Tutup Detail
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
