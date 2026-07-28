"use client";

import { useCallback, useEffect, useState } from "react";

type ClassItem = {
    id: number; code: string; name: string; description: string; level: string; program: string;
    schedule: string; capacity: number; occupied_seats: number; available_seats: number;
    enrollment_close_at: string; start_at: string; end_at: string; teacher_name: string | null;
};
type Application = {
    id: number; status: string; class_name: string; class_code: string;
    submitted_at: string; rejection_reason: string | null;
};

export default function ClassCatalogPage() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [search, setSearch] = useState("");
    const [level, setLevel] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [applying, setApplying] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (level) params.set("level", level);
        try {
            const [classResponse, applicationResponse] = await Promise.all([
                fetch(`/api/enrollment/classes?${params}`),
                fetch("/api/enrollment/applications"),
            ]);
            const [classData, applicationData] = await Promise.all([classResponse.json(), applicationResponse.json()]);
            if (!classResponse.ok) throw new Error(classData.error);
            if (!applicationResponse.ok) throw new Error(applicationData.error);
            setClasses(classData.data ?? []);
            setApplications(applicationData.data ?? []);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Gagal memuat katalog");
        } finally { setLoading(false); }
    }, [level, search]);
    useEffect(() => { void load(); }, [load]);

    async function apply(classItem: ClassItem) {
        if (!window.confirm(`Kirim aplikasi ke kelas ${classItem.name}? Data profil Anda saat ini akan disimpan sebagai snapshot.`)) return;
        setApplying(classItem.id); setError(""); setNotice("");
        const response = await fetch(`/api/enrollment/classes/${classItem.id}/applications`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documents: [] }),
        });
        const data = await response.json();
        setApplying(null);
        if (!response.ok) { setError(data.error || "Gagal mengirim aplikasi"); return; }
        setNotice("Aplikasi berhasil dikirim dan masuk admission queue."); await load();
    }

    async function withdraw(applicationId: number) {
        if (!window.confirm("Tarik aplikasi ini?")) return;
        const response = await fetch(`/api/enrollment/applications/${applicationId}/withdraw`, { method: "POST" });
        const data = await response.json();
        if (!response.ok) { setError(data.error); return; }
        setNotice(data.message); await load();
    }

    const activeClassIds = new Set(applications.filter((item) => !["withdrawn", "rejected"].includes(item.status)).map((item) => `${item.class_code}`));
    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8">
            <section className="rounded-[1.75rem] bg-gradient-to-br from-[#142d63] to-primary-70 p-7 text-white"><p className="text-xs font-bold uppercase tracking-widest text-blue-200">Enrollment</p><h1 className="mt-2 text-3xl font-black">Pilih kelasmu</h1><p className="mt-2 max-w-2xl text-sm text-blue-100">Pilih satu kelas yang sesuai. Tim admission akan meninjau profil dan ketersediaan seat.</p></section>
            {error && <div role="alert" className="rounded-xl bg-error-10 p-4 text-error-base">{error}</div>}
            {notice && <div role="status" className="rounded-xl bg-success-10 p-4 text-success-100">{notice}</div>}
            <section className="portal-card p-5"><h2 className="text-lg font-bold">Status aplikasi</h2>{applications.length === 0 ? <p className="mt-3 text-sm text-neutral-50">Belum ada aplikasi.</p> : <div className="mt-4 grid gap-3 md:grid-cols-2">{applications.map((item) => <div key={item.id} className="rounded-xl border border-neutral-10 p-4"><div className="flex justify-between gap-3"><div><p className="text-xs font-bold text-primary-base">{item.class_code}</p><p className="font-semibold">{item.class_name}</p></div><span className="h-fit rounded-full bg-neutral-10 px-3 py-1 text-xs font-bold">{item.status}</span></div>{item.rejection_reason && <p className="mt-2 text-sm text-error-base">{item.rejection_reason}</p>}{["draft", "submitted"].includes(item.status) && <button onClick={() => withdraw(item.id)} className="mt-3 text-xs font-semibold text-error-base">Tarik aplikasi</button>}</div>)}</div>}</section>
            <div className="flex gap-3"><input aria-label="Cari kelas" className="flex-1 rounded-xl border border-neutral-20 bg-white px-4 py-3" placeholder="Cari kelas..." value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Level" className="rounded-xl border border-neutral-20 bg-white px-4" value={level} onChange={(event) => setLevel(event.target.value)}><option value="">Semua level</option>{["N5", "N4", "N3", "N2", "N1"].map((value) => <option key={value}>{value}</option>)}</select></div>
            {loading ? <p className="py-10 text-center">Memuat kelas...</p> : classes.length === 0 ? <p className="portal-card p-10 text-center text-neutral-50">Belum ada kelas yang membuka enrollment.</p> : <div className="grid gap-5 md:grid-cols-2">{classes.map((item) => { const applied = activeClassIds.has(item.code); return <article key={item.id} className="portal-card overflow-hidden"><div className="h-2 bg-primary-base" /><div className="p-6"><div className="flex justify-between"><div><p className="text-xs font-bold text-primary-base">{item.code} · {item.level}</p><h2 className="mt-1 text-xl font-black">{item.name}</h2></div><span className="h-fit rounded-full bg-success-10 px-3 py-1 text-xs font-bold text-success-100">{item.available_seats} seat</span></div><p className="mt-3 line-clamp-3 text-sm text-neutral-60">{item.description}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-neutral-40">Program</dt><dd className="font-semibold">{item.program}</dd></div><div><dt className="text-neutral-40">Teacher</dt><dd className="font-semibold">{item.teacher_name || "Nande Nihon"}</dd></div><div><dt className="text-neutral-40">Jadwal</dt><dd className="font-semibold">{item.schedule}</dd></div><div><dt className="text-neutral-40">Mulai</dt><dd className="font-semibold">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(item.start_at))}</dd></div></dl><button disabled={applied || applying === item.id} onClick={() => apply(item)} className="btn mt-5 w-full">{applied ? "Sudah mendaftar" : applying === item.id ? "Mengirim..." : "Daftar kelas"}</button></div></article>; })}</div>}
        </div>
    );
}
