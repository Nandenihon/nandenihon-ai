"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ClassOption = { id: number; code: string; name: string };

export default function StudentRowActions({
    studentId,
    status,
    currentClassId,
    classes,
}: {
    studentId: number;
    status: "active" | "inactive";
    currentClassId: number | null;
    classes: ClassOption[];
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);
    const [targetClassId, setTargetClassId] = useState("");
    const [error, setError] = useState("");

    async function toggleStatus() {
        const nextStatus = status === "active" ? "inactive" : "active";
        const confirmed = window.confirm(
            nextStatus === "inactive" ? "Nonaktifkan siswa ini?" : "Aktifkan kembali siswa ini?"
        );
        if (!confirmed) return;
        setBusy(true);
        setError("");
        const response = await fetch(`/api/students/${studentId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: nextStatus }),
        });
        const data = await response.json();
        setBusy(false);
        if (!response.ok) { setError(data.error || "Gagal memperbarui status"); return; }
        router.refresh();
    }

    async function submitTransfer() {
        if (!targetClassId) return;
        setBusy(true);
        setError("");
        const response = await fetch(`/api/students/${studentId}/transfer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ classId: Number(targetClassId) }),
        });
        const data = await response.json();
        setBusy(false);
        if (!response.ok) { setError(data.error || "Gagal memindahkan siswa"); return; }
        setTransferOpen(false);
        setTargetClassId("");
        router.refresh();
    }

    return (
        <div className="flex flex-col items-start gap-1.5">
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={toggleStatus}
                    disabled={busy}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all disabled:opacity-50 ${
                        status === "active"
                            ? "border-error-20 text-error-base hover:bg-error-10"
                            : "border-success-20 text-success-base hover:bg-success-10"
                    }`}
                >
                    {status === "active" ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button
                    onClick={() => setTransferOpen((value) => !value)}
                    disabled={busy}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-primary-20 text-primary-base hover:bg-primary-10 transition-all disabled:opacity-50"
                >
                    Transfer kelas
                </button>
            </div>
            {transferOpen && (
                <div className="flex items-center gap-2">
                    <select
                        value={targetClassId}
                        onChange={(event) => setTargetClassId(event.target.value)}
                        className="text-xs bg-absolute-white border border-neutral-20 rounded-lg py-1.5 px-2 outline-none focus:border-primary-base"
                    >
                        <option value="">Pilih kelas tujuan</option>
                        {classes
                            .filter((option) => option.id !== currentClassId)
                            .map((option) => (
                                <option key={option.id} value={option.id}>{option.code} — {option.name}</option>
                            ))}
                    </select>
                    <button
                        onClick={submitTransfer}
                        disabled={busy || !targetClassId}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-primary-base text-absolute-white disabled:opacity-50"
                    >
                        Pindahkan
                    </button>
                </div>
            )}
            {error && <p className="text-xs text-error-base">{error}</p>}
        </div>
    );
}
