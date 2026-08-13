"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type ClassItem = {
    id: number; code: string; name: string; description: string; level: string; program: string;
    schedule: string; capacity: number; occupied_seats: number; available_seats: number;
    enrollment_open_at: string; enrollment_close_at: string; start_at: string; end_at: string;
    status: string; enrollment_closed: number; owner_teacher_id: number; teacher_name: string | null;
    test_pass_score: number;
};
type TeacherOption = { id: number; name: string; email: string };

const TEST_LEVELS = ["N5 Basic", "N5 Menengah", "N5 Lanjutan", "N4"];

const EMPTY = {
    code: "", name: "", description: "", level: TEST_LEVELS[0], program: "", schedule: "", capacity: 20,
    enrollmentOpenAt: "", enrollmentCloseAt: "", startAt: "", endAt: "", ownerTeacherId: "", testPassScore: 60,
};

export default function EnrollmentClassManager({ teacherMode = false }: { teacherMode?: boolean }) {
    const [items, setItems] = useState<ClassItem[]>([]);
    const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
    const [form, setForm] = useState(EMPTY);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        try {
            const [response, teacherResponse] = await Promise.all([
                fetch(`/api/enrollment/classes?${params}`),
                teacherMode ? Promise.resolve(null) : fetch("/api/enrollment/teachers"),
            ]);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setItems(data.data ?? []);
            if (teacherResponse) {
                const teacherData = await teacherResponse.json();
                if (teacherResponse.ok) setTeacherOptions(teacherData.data ?? []);
            }
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Gagal memuat kelas");
        } finally {
            setLoading(false);
        }
    }, [search, status]);

    useEffect(() => { void load(); }, [load]);

    async function create(event: React.FormEvent) {
        event.preventDefault(); setSaving(true); setError(""); setNotice("");
        try {
            const response = await fetch("/api/enrollment/classes", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    capacity: Number(form.capacity),
                    ownerTeacherId: Number(form.ownerTeacherId) || undefined,
                    testPassScore: Number(form.testPassScore),
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setForm(EMPTY); setShowForm(false); setNotice("Kelas draft berhasil dibuat."); await load();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Gagal membuat kelas");
        } finally { setSaving(false); }
    }

    async function transition(id: number, action: string) {
        setError(""); setNotice("");
        const response = await fetch(`/api/enrollment/classes/${id}/transition`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
        });
        const data = await response.json();
        if (!response.ok) { setError(data.error || "Gagal mengubah status"); return; }
        setNotice("Status kelas berhasil diperbarui."); await load();
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div><h1 className="text-2xl font-bold text-neutral-90">Portal Kelas</h1><p className="text-sm text-neutral-50">Kelola lifecycle kelas, kuota, dan enrollment.</p></div>
                <button className="rounded-xl bg-primary-base px-5 py-3 text-sm font-semibold text-white" onClick={() => setShowForm((value) => !value)}>{showForm ? "Tutup form" : "Buat kelas"}</button>
            </div>
            {error && <div role="alert" className="rounded-xl bg-error-10 p-4 text-sm text-error-base">{error}</div>}
            {notice && <div role="status" className="rounded-xl bg-success-10 p-4 text-sm text-success-100">{notice}</div>}
            {showForm && (
                <form onSubmit={create} className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
                    <Input label="Kode unik" value={form.code} onChange={(value) => setForm({ ...form, code: value })} />
                    <Input label="Nama kelas" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                    <label className="text-sm font-semibold text-neutral-70">Level soal test<select required className="mt-2 w-full rounded-xl border border-neutral-20 px-4 py-3" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}>{TEST_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}</select></label>
                    <Input label="Program" value={form.program} onChange={(value) => setForm({ ...form, program: value })} />
                    <Input label="Kapasitas" type="number" value={String(form.capacity)} onChange={(value) => setForm({ ...form, capacity: Number(value) })} />
                    <Input label="Nilai kelulusan (%)" type="number" value={String(form.testPassScore)} onChange={(value) => setForm({ ...form, testPassScore: Number(value) })} />
                    {!teacherMode && <label className="text-sm font-semibold text-neutral-70">Owner teacher<select required className="mt-2 w-full rounded-xl border border-neutral-20 px-4 py-3" value={form.ownerTeacherId} onChange={(event) => setForm({ ...form, ownerTeacherId: event.target.value })}><option value="">Pilih pengajar</option>{teacherOptions.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} — {teacher.email}</option>)}</select></label>}
                    <Input label="Enrollment dibuka" type="datetime-local" value={form.enrollmentOpenAt} onChange={(value) => setForm({ ...form, enrollmentOpenAt: value })} />
                    <Input label="Enrollment ditutup" type="datetime-local" value={form.enrollmentCloseAt} onChange={(value) => setForm({ ...form, enrollmentCloseAt: value })} />
                    <Input label="Kelas dimulai" type="datetime-local" value={form.startAt} onChange={(value) => setForm({ ...form, startAt: value })} />
                    <Input label="Kelas selesai" type="datetime-local" value={form.endAt} onChange={(value) => setForm({ ...form, endAt: value })} />
                    <label className="md:col-span-2 text-sm font-semibold text-neutral-70">Jadwal<textarea required rows={2} className="mt-2 w-full rounded-xl border border-neutral-20 p-3" value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value })} /></label>
                    <label className="md:col-span-2 text-sm font-semibold text-neutral-70">Deskripsi<textarea required rows={4} className="mt-2 w-full rounded-xl border border-neutral-20 p-3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
                    <button disabled={saving} className="md:col-span-2 rounded-xl bg-primary-base p-3 font-semibold text-white">{saving ? "Menyimpan..." : "Simpan sebagai draft"}</button>
                </form>
            )}
            <div className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <input aria-label="Cari kelas" placeholder="Cari nama atau kode..." className="flex-1 rounded-xl border border-neutral-20 px-4 py-2" value={search} onChange={(event) => setSearch(event.target.value)} />
                <select aria-label="Filter status" className="rounded-xl border border-neutral-20 px-4 py-2" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Semua status</option>{["draft", "published", "closed", "archived"].map((value) => <option key={value}>{value}</option>)}</select>
            </div>
            {loading ? <p className="p-8 text-center text-neutral-50">Memuat kelas...</p> : items.length === 0 ? <p className="rounded-2xl bg-white p-10 text-center text-neutral-50">Belum ada kelas.</p> : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {items.map((item) => (
                        <article key={item.id} className="rounded-2xl bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-primary-base">{item.code} · {item.level}</p><h2 className="mt-1 text-lg font-bold text-neutral-90">{item.name}</h2></div><span className="rounded-full bg-neutral-10 px-3 py-1 text-xs font-semibold">{item.status}</span></div>
                            <p className="mt-3 line-clamp-2 text-sm text-neutral-60">{item.description}</p>
                            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-neutral-40">Teacher</dt><dd className="font-semibold">{item.teacher_name || `#${item.owner_teacher_id}`}</dd></div><div><dt className="text-neutral-40">Seat</dt><dd className="font-semibold">{item.occupied_seats}/{item.capacity}</dd></div><div><dt className="text-neutral-40">Jadwal</dt><dd className="font-semibold">{item.schedule}</dd></div><div><dt className="text-neutral-40">Enrollment</dt><dd className="font-semibold">{item.enrollment_closed ? "Ditutup" : "Dibuka"}</dd></div><div><dt className="text-neutral-40">Nilai kelulusan</dt><dd className="font-semibold">{item.test_pass_score}%</dd></div></dl>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <Link className="rounded-lg bg-primary-base px-3 py-2 text-xs font-semibold text-white" href={teacherMode ? `/dashboard/lecturer/classes/${item.id}` : `/dashboard/enrollment-classes/${item.id}`}>Buka workspace</Link>
                                {item.status === "draft" && <Action onClick={() => transition(item.id, "publish")}>Publish</Action>}
                                {item.status === "published" && !item.enrollment_closed && <Action onClick={() => transition(item.id, "close-enrollment")}>Tutup enrollment</Action>}
                                {item.status === "published" && <Action onClick={() => transition(item.id, "close")}>Tutup kelas</Action>}
                                {item.status === "closed" && <Action onClick={() => transition(item.id, "archive")}>Archive</Action>}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
    return <label className="text-sm font-semibold text-neutral-70">{label}<input required type={type} className="mt-2 w-full rounded-xl border border-neutral-20 px-4 py-3" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
function Action({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return <button onClick={onClick} className="rounded-lg border border-primary-20 px-3 py-2 text-xs font-semibold text-primary-base hover:bg-primary-10">{children}</button>;
}
