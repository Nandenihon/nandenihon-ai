"use client";

import { useCallback, useEffect, useState } from "react";

type Application = {
    id: number; status: string; full_name: string; nickname: string; email: string;
    phone_number: string; domicile: string; japanese_level: string; class_code: string;
    class_name: string; submitted_at: string; rejection_reason: string | null;
};

export default function AdmissionsPage() {
    const [items, setItems] = useState<Application[]>([]);
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (search) params.set("search", search);
        try {
            const response = await fetch(`/api/enrollment/applications?${params}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setItems(data.data ?? []);
        } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Gagal memuat aplikasi"); }
        finally { setLoading(false); }
    }, [search, status]);
    useEffect(() => { void load(); }, [load]);

    async function decide(id: number, action: "review" | "accept" | "reject") {
        setError(""); setNotice("");
        let reason = "";
        if (action === "reject") {
            reason = window.prompt("Masukkan alasan penolakan:")?.trim() ?? "";
            if (!reason) return;
        }
        const response = await fetch(`/api/enrollment/applications/${id}/decision`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
            body: JSON.stringify({ action, reason }),
        });
        const data = await response.json();
        if (!response.ok) { setError(data.error || "Gagal memproses aplikasi"); return; }
        setNotice(data.message); await load();
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm"><h1 className="text-2xl font-bold text-neutral-90">Admission Queue</h1><p className="text-sm text-neutral-50">Review kandidat dan putuskan enrollment secara aman.</p></div>
            {error && <div role="alert" className="rounded-xl bg-error-10 p-4 text-error-base">{error}</div>}
            {notice && <div role="status" className="rounded-xl bg-success-10 p-4 text-success-100">{notice}</div>}
            <div className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm"><input aria-label="Cari aplikasi" className="flex-1 rounded-xl border border-neutral-20 px-4 py-2" placeholder="Cari kandidat atau kelas..." value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Filter status" className="rounded-xl border border-neutral-20 px-4" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Semua status</option>{["submitted", "under_review", "accepted", "rejected", "withdrawn"].map((value) => <option key={value}>{value}</option>)}</select></div>
            {loading ? <p className="p-8 text-center">Memuat...</p> : items.length === 0 ? <p className="rounded-2xl bg-white p-10 text-center text-neutral-50">Tidak ada aplikasi.</p> : (
                <div className="space-y-4">{items.map((item) => <article key={item.id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="flex-1"><div className="flex items-center gap-2"><span className="rounded-full bg-primary-10 px-3 py-1 text-xs font-bold text-primary-base">{item.status}</span><span className="text-xs text-neutral-40">{item.class_code}</span></div><h2 className="mt-2 text-lg font-bold">{item.full_name} <span className="text-sm font-normal text-neutral-50">({item.nickname})</span></h2><p className="text-sm text-neutral-50">{item.email} · {item.phone_number} · {item.domicile}</p><p className="mt-2 text-sm font-semibold">{item.class_name} · {item.japanese_level}</p>{item.rejection_reason && <p className="mt-2 text-sm text-error-base">Alasan: {item.rejection_reason}</p>}</div><div className="flex gap-2">{item.status === "submitted" && <Action onClick={() => decide(item.id, "review")}>Mulai review</Action>}{["submitted", "under_review"].includes(item.status) && <><Action onClick={() => decide(item.id, "accept")}>Terima</Action><Action danger onClick={() => decide(item.id, "reject")}>Tolak</Action></>}</div></div></article>)}</div>
            )}
        </div>
    );
}

function Action({ children, onClick, danger = false }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
    return <button onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-semibold ${danger ? "bg-error-10 text-error-base" : "bg-primary-base text-white"}`}>{children}</button>;
}
