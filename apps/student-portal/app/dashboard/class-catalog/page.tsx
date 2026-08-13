"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";

type ClassItem = {
    id: number; code: string; name: string; description: string; level: string; program: string;
    schedule: string; capacity: number; occupied_seats: number; available_seats: number;
    enrollment_close_at: string; start_at: string; end_at: string; teacher_name: string | null;
};

export default function ClassCatalogPage() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search);
    const [level, setLevel] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (level) params.set("level", level);
        try {
            const response = await fetch(`/api/enrollment/classes?${params}`, { signal });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setClasses(data.data ?? []);
        } catch (loadError) {
            if (loadError instanceof DOMException && loadError.name === "AbortError") return;
            setError(loadError instanceof Error ? loadError.message : "Gagal memuat katalog");
        } finally { if (!signal?.aborted) setLoading(false); }
    }, [level, debouncedSearch]);
    useEffect(() => {
        const controller = new AbortController();
        void load(controller.signal);
        return () => controller.abort();
    }, [load]);

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8">
            <section className="rounded-[1.75rem] bg-gradient-to-br from-[#142d63] to-primary-70 p-7 text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Tes Penempatan</p>
                <h1 className="mt-2 text-3xl font-black">Pilih kelasmu</h1>
                <p className="mt-2 max-w-2xl text-sm text-blue-100">Pilih kelas yang kamu minati, lalu kerjakan tes penempatannya. Lolos tes → lanjut ke pembayaran.</p>
            </section>
            {error && <div role="alert" className="rounded-xl bg-error-10 p-4 text-error-base">{error}</div>}
            <div className="flex gap-3"><input aria-label="Cari kelas" className="flex-1 rounded-xl border border-neutral-20 bg-white px-4 py-3" placeholder="Cari kelas..." value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Level" className="rounded-xl border border-neutral-20 bg-white px-4" value={level} onChange={(event) => setLevel(event.target.value)}><option value="">Semua level</option>{["N5", "N4", "N3", "N2", "N1"].map((value) => <option key={value}>{value}</option>)}</select></div>
            {loading ? <p className="py-10 text-center">Memuat kelas...</p> : classes.length === 0 ? <p className="portal-card p-10 text-center text-neutral-50">Belum ada kelas yang membuka enrollment.</p> : <div className="grid gap-5 md:grid-cols-2">{classes.map((item) => <article key={item.id} className="portal-card overflow-hidden"><div className="h-2 bg-primary-base" /><div className="p-6"><div className="flex justify-between"><div><p className="text-xs font-bold text-primary-base">{item.code} · {item.level}</p><h2 className="mt-1 text-xl font-black">{item.name}</h2></div><span className="h-fit rounded-full bg-success-10 px-3 py-1 text-xs font-bold text-success-100">{item.available_seats} seat</span></div><p className="mt-3 line-clamp-3 text-sm text-neutral-60">{item.description}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-neutral-40">Program</dt><dd className="font-semibold">{item.program}</dd></div><div><dt className="text-neutral-40">Teacher</dt><dd className="font-semibold">{item.teacher_name || "Nande Nihon"}</dd></div><div><dt className="text-neutral-40">Jadwal</dt><dd className="font-semibold">{item.schedule}</dd></div><div><dt className="text-neutral-40">Mulai</dt><dd className="font-semibold">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(item.start_at))}</dd></div></dl><Link href={`/dashboard/tests/class/${item.id}`} className="btn mt-5 block w-full text-center">Mulai Test →</Link></div></article>)}</div>}
        </div>
    );
}
