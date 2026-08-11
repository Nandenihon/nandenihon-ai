"use client";
import { useCallback, useEffect, useState } from "react";

type TestItem = {
    id: number; class_id: number; title: string; instructions: string | null;
    pass_score: number; time_limit_minutes: number; status: string;
    source_file_name: string | null; question_count: number; attempt_count: number;
};
type QuestionRow = { id?: number; text: string; options: string[]; correctAnswer: string; points: number };

const EMPTY_QUESTION: QuestionRow = { text: "", options: ["", "", "", ""], correctAnswer: "A", points: 1 };

export default function TestManager({ classId }: { classId: number }) {
    const [items, setItems] = useState<TestItem[]>([]);
    const [selected, setSelected] = useState<TestItem | null>(null);
    const [questions, setQuestions] = useState<QuestionRow[]>([]);
    const [message, setMessage] = useState("");
    const [form, setForm] = useState({ title: "", instructions: "", passScore: 60, timeLimitMinutes: 30 });
    const [importFile, setImportFile] = useState<File | null>(null);

    const load = useCallback(async () => {
        const response = await fetch(`/api/enrollment/classes/${classId}/tests`);
        const data = await response.json();
        if (response.ok) setItems(data.data ?? []);
    }, [classId]);
    useEffect(() => { void load(); }, [load]);

    async function create(event: React.FormEvent) {
        event.preventDefault();
        const response = await fetch(`/api/enrollment/classes/${classId}/tests`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
        const data = await response.json();
        setMessage(data.error || "Draft tes berhasil dibuat.");
        if (response.ok) { setForm({ title: "", instructions: "", passScore: 60, timeLimitMinutes: 30 }); await load(); }
    }

    async function openTest(item: TestItem) {
        const response = await fetch(`/api/enrollment/classes/${classId}/tests/${item.id}`);
        const data = await response.json();
        setMessage(data.error || "");
        if (response.ok) {
            setSelected(data.data);
            setQuestions(
                data.data.questions.length
                    ? data.data.questions.map((q: { text: string; options: string[]; correctAnswer: string; points: number; id: number }) => ({ id: q.id, text: q.text, options: q.options, correctAnswer: q.correctAnswer, points: q.points }))
                    : [{ ...EMPTY_QUESTION }]
            );
        }
    }

    function updateQuestion(index: number, patch: Partial<QuestionRow>) {
        setQuestions((current) => current.map((q, i) => (i === index ? { ...q, ...patch } : q)));
    }
    function updateOption(index: number, optionIndex: number, value: string) {
        setQuestions((current) => current.map((q, i) => (i === index ? { ...q, options: q.options.map((o, oi) => (oi === optionIndex ? value : o)) } : q)));
    }
    function addQuestion() { setQuestions((current) => [...current, { ...EMPTY_QUESTION }]); }
    function removeQuestion(index: number) { setQuestions((current) => current.filter((_, i) => i !== index)); }

    async function saveQuestions() {
        if (!selected) return;
        const response = await fetch(`/api/enrollment/classes/${classId}/tests/${selected.id}/questions`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questions }),
        });
        const data = await response.json();
        setMessage(data.error || data.message);
        if (response.ok) await load();
    }

    async function importCsv() {
        if (!selected || !importFile) return;
        const body = new FormData();
        body.append("file", importFile);
        const response = await fetch(`/api/enrollment/classes/${classId}/tests/${selected.id}/import`, { method: "POST", body });
        const data = await response.json();
        setMessage(data.error || data.message);
        if (response.ok) { setImportFile(null); await openTest(selected); await load(); }
    }

    async function transition(item: TestItem, action: "publish" | "close") {
        const response = await fetch(`/api/enrollment/classes/${classId}/tests/${item.id}/transition`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
        });
        const data = await response.json();
        setMessage(data.error || data.message);
        if (response.ok) await load();
    }

    return (
        <div className="space-y-6">
            <header className="rounded-2xl bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-bold">Tes Penempatan</h1>
                <p className="text-sm text-neutral-50">Buat tes untuk kelas ini. Calon siswa yang lolos akan diarahkan ke halaman pembayaran.</p>
            </header>
            {message && <div className="rounded-xl bg-primary-10 p-4 text-primary-base">{message}</div>}

            <form onSubmit={create} className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
                <Field label="Judul tes"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label="Nilai kelulusan (%)"><input required type="number" min={0} max={100} value={form.passScore} onChange={(e) => setForm({ ...form, passScore: Number(e.target.value) })} /></Field>
                <Field label="Batas waktu (menit)"><input required type="number" min={1} value={form.timeLimitMinutes} onChange={(e) => setForm({ ...form, timeLimitMinutes: Number(e.target.value) })} /></Field>
                <label className="md:col-span-2 font-semibold">Instruksi<textarea className="mt-2 min-h-20 w-full rounded-xl border p-3" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></label>
                <button className="md:col-span-2 rounded-xl bg-primary-base p-3 font-bold text-white">Simpan draft tes</button>
            </form>

            <div className="grid gap-4 md:grid-cols-2">
                {items.map((item) => (
                    <article key={item.id} className="rounded-2xl bg-white p-5 shadow-sm">
                        <p className="text-xs font-bold text-primary-base">{item.status} · {item.question_count} soal · {item.attempt_count} attempt</p>
                        <h2 className="text-lg font-bold">{item.title}</h2>
                        <p className="mt-1 text-sm text-neutral-50">Lulus ≥ {item.pass_score}% · {item.time_limit_minutes} menit</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Button onClick={() => openTest(item)}>Kelola soal</Button>
                            {item.status === "draft" && <Button onClick={() => transition(item, "publish")}>Publish</Button>}
                            {item.status === "published" && <Button onClick={() => transition(item, "close")}>Tutup</Button>}
                        </div>
                    </article>
                ))}
                {items.length === 0 && <p className="text-sm text-neutral-50">Belum ada tes untuk kelas ini.</p>}
            </div>

            {selected && (
                <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-bold">Soal — {selected.title}</h2>
                        <button onClick={() => setSelected(null)} className="text-sm font-semibold text-neutral-50">Tutup</button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-neutral-5 p-4">
                        <p className="text-sm font-semibold">Import dari CSV:</p>
                        <input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} className="text-sm" />
                        <Button onClick={importCsv}>Import</Button>
                        <a href="/templates/class-test-template.csv" download className="text-xs font-semibold text-primary-base underline">Unduh template CSV</a>
                        {selected.source_file_name && <span className="text-xs text-neutral-40">Terakhir diimpor: {selected.source_file_name}</span>}
                    </div>

                    <div className="space-y-4">
                        {questions.map((question, index) => (
                            <div key={index} className="rounded-xl border border-neutral-10 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <textarea className="min-h-16 w-full rounded-lg border p-2 text-sm" placeholder="Teks soal" value={question.text} onChange={(e) => updateQuestion(index, { text: e.target.value })} />
                                    <button onClick={() => removeQuestion(index)} className="shrink-0 text-xs font-bold text-error-base">Hapus</button>
                                </div>
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                    {question.options.map((option, optionIndex) => (
                                        <div key={optionIndex} className="flex items-center gap-2">
                                            <span className="w-5 text-xs font-bold text-neutral-40">{String.fromCharCode(65 + optionIndex)}</span>
                                            <input className="w-full rounded-lg border p-2 text-sm" value={option} onChange={(e) => updateOption(index, optionIndex, e.target.value)} />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm font-semibold">Jawaban benar
                                        <select className="rounded-lg border p-2" value={question.correctAnswer} onChange={(e) => updateQuestion(index, { correctAnswer: e.target.value })}>
                                            {["A", "B", "C", "D"].map((letter) => <option key={letter} value={letter}>{letter}</option>)}
                                        </select>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm font-semibold">Poin
                                        <input type="number" min={1} className="w-20 rounded-lg border p-2" value={question.points} onChange={(e) => updateQuestion(index, { points: Number(e.target.value) })} />
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={addQuestion}>+ Tambah soal</Button>
                        <button onClick={saveQuestions} className="rounded-xl bg-primary-base px-5 py-2 text-sm font-bold text-white">Simpan semua soal</button>
                    </div>
                </section>
            )}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <label className="font-semibold">{label}<div className="[&>*]:mt-2 [&>*]:w-full [&>*]:rounded-xl [&>*]:border [&>*]:p-3">{children}</div></label>;
}
function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return <button type="button" onClick={onClick} className="rounded-lg bg-primary-10 px-3 py-2 text-xs font-bold text-primary-base">{children}</button>;
}
