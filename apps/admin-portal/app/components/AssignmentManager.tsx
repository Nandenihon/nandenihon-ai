"use client";
import { useCallback, useEffect, useState } from "react";
import { datetimeLocalToJakartaUtc } from "@repo/utils/jakarta-time";

type ClassItem = { id: number; code: string; name: string };
type Assignment = { id: number; class_code: string; title: string; subject: string; deadline_at: string; max_score: number; status: string; submission_count: number };
type Submission = { student_id: number; student_name: string; email: string; submission_id: number | null; original_filename: string | null; status: string | null; score: number | null; feedback: string | null };

export default function AssignmentManager({ classId }: { classId?: number }) {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [items, setItems] = useState<Assignment[]>([]);
    const [selected, setSelected] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [message, setMessage] = useState("");
    const [form, setForm] = useState({ classId: classId ? String(classId) : "", title: "", description: "", subject: "", deadlineAt: "", maxScore: 100, allowResubmission: false });
    const load = useCallback(async () => {
        const [a, b] = await Promise.all([fetch("/api/enrollment/classes"), fetch(`/api/enrollment/assignments${classId ? `?classId=${classId}` : ""}`)]);
        const [classesData, assignmentData] = await Promise.all([a.json(), b.json()]);
        if (a.ok) setClasses(classesData.data ?? []); if (b.ok) setItems(assignmentData.data ?? []);
    }, []);
    useEffect(() => { void load(); }, [load]);
    async function create(event: React.FormEvent) {
        event.preventDefault();
        const response = await fetch("/api/enrollment/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, classId: Number(classId || form.classId), deadlineAt: datetimeLocalToJakartaUtc(form.deadlineAt) }) });
        const data = await response.json(); setMessage(data.error || "Draft tugas berhasil dibuat."); if (response.ok) await load();
    }
    async function transition(id: number, action: string) {
        const response = await fetch(`/api/enrollment/assignments/${id}/transition`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
        const data = await response.json(); setMessage(data.error || data.message); if (response.ok) await load();
    }
    async function showSubmissions(item: Assignment) {
        const response = await fetch(`/api/enrollment/assignments/${item.id}/submissions`); const data = await response.json();
        setMessage(data.error || ""); if (response.ok) { setSelected(item); setSubmissions(data.data ?? []); }
    }
    async function grade(item: Submission) {
        if (!item.submission_id || !selected) return;
        const score = window.prompt(`Nilai 0–${selected.max_score}`, String(item.score ?? "")); if (score === null) return;
        const feedback = window.prompt("Feedback", item.feedback ?? "") ?? "";
        const response = await fetch(`/api/enrollment/submissions/${item.submission_id}/grade`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score: Number(score), feedback }) });
        const data = await response.json(); setMessage(data.error || "Nilai berhasil dipublikasikan."); if (response.ok) await showSubmissions(selected);
    }
    return <div className="space-y-6"><header className="rounded-2xl bg-white p-6 shadow-sm"><h1 className="text-2xl font-bold">Tugas & Penilaian</h1><p className="text-sm text-neutral-50">Kelola tugas, submission, nilai, dan feedback.</p></header>{message && <div className="rounded-xl bg-primary-10 p-4 text-primary-base">{message}</div>}<form onSubmit={create} className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2"><Field label="Kelas"><select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}><option value="">Pilih kelas</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}</select></Field><Field label="Mata pelajaran"><input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field><Field label="Judul"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field><Field label="Deadline"><input required type="datetime-local" value={form.deadlineAt} onChange={(e) => setForm({ ...form, deadlineAt: e.target.value })} /></Field><Field label="Nilai maksimal"><input required type="number" min={1} value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })} /></Field><label className="flex items-center gap-2"><input type="checkbox" checked={form.allowResubmission} onChange={(e) => setForm({ ...form, allowResubmission: e.target.checked })} />Izinkan resubmission</label><label className="md:col-span-2 font-semibold">Deskripsi<textarea required className="mt-2 min-h-24 w-full rounded-xl border p-3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><button className="md:col-span-2 rounded-xl bg-primary-base p-3 font-bold text-white">Simpan draft</button></form><div className="grid gap-4 md:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs font-bold text-primary-base">{item.class_code} · {item.subject}</p><h2 className="text-lg font-bold">{item.title}</h2><p className="mt-2 text-sm">{new Date(item.deadline_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} · {item.submission_count} submission · {item.status}</p><div className="mt-4 flex gap-2">{item.status === "draft" && <Button onClick={() => transition(item.id, "publish")}>Publish</Button>}{item.status === "published" && <Button onClick={() => transition(item.id, "close")}>Tutup</Button>}<Button onClick={() => showSubmissions(item)}>Submission</Button></div></article>)}</div>{selected && <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="font-bold">Submission — {selected.title}</h2><div className="mt-4 space-y-2">{submissions.map((s) => <div key={s.student_id} className="flex items-center justify-between rounded-xl border p-3"><div><b>{s.student_name}</b><p className="text-xs text-neutral-50">{s.status || "Belum mengumpulkan"} · {s.original_filename || "–"} · Nilai {s.score ?? "–"}</p></div>{s.submission_id && <Button onClick={() => grade(s)}>Nilai</Button>}</div>)}</div></section>}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="font-semibold">{label}<div className="[&>*]:mt-2 [&>*]:w-full [&>*]:rounded-xl [&>*]:border [&>*]:p-3">{children}</div></label>; }
function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) { return <button type="button" onClick={onClick} className="rounded-lg bg-primary-10 px-3 py-2 text-xs font-bold text-primary-base">{children}</button>; }
