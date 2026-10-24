"use client";
import { useEffect, useState } from "react";

type Assignment = {
    id: number; class_code: string; title: string; description: string; subject: string; deadline_at: string;
    max_score: number; status: string; allow_resubmission: number | boolean;
    submission_id: number | null; submission_status: string | null; correction_uploaded_at: string | null;
    score: number | null; feedback: string | null;
};

const SUBMISSION_STATUS_LABELS: Record<string, string> = {
    submitted: "Sudah dikumpulkan", late: "Dikumpulkan terlambat", resubmitted: "Dikumpulkan ulang",
    graded: "Sudah dinilai", pending_upload: "Sedang diunggah",
};

export default function StudentAssignmentsPage() {
    const [items, setItems] = useState<Assignment[]>([]);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [uploading, setUploading] = useState(0);

    async function load() {
        const r = await fetch("/api/enrollment/assignments");
        const d = await r.json();
        if (r.ok) setItems(d.data ?? []); else setMessage({ type: "error", text: d.error });
    }
    useEffect(() => { void load(); }, []);

    async function upload(id: number, file?: File) {
        if (!file) return;
        setUploading(id);
        setMessage(null);
        const form = new FormData();
        form.append("file", file);
        const r = await fetch(`/api/enrollment/assignments/${id}/submissions`, { method: "POST", body: form });
        const d = await r.json();
        setUploading(0);
        setMessage({ type: r.ok ? "success" : "error", text: d.error || d.message });
        if (r.ok) await load();
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
            <header className="rounded-[1.75rem] bg-primary-80 p-7 text-white"><h1 className="text-3xl font-black">Tugas Saya</h1></header>
            {message && <div className={`rounded-xl p-4 ${message.type === "success" ? "bg-success-10 text-success-base" : "bg-error-10 text-error-base"}`}>{message.text}</div>}
            {items.length === 0 ? <div className="portal-card p-10 text-center">Belum ada tugas.</div> : items.map((a) => {
                const submitted = a.submission_id !== null;
                const pastDeadline = Date.now() > new Date(a.deadline_at).getTime();
                const canUpload = a.status === "published" && a.score === null && (!submitted || Boolean(a.allow_resubmission));
                return (
                    <article key={a.id} className="portal-card p-6">
                        <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-primary-base">{a.class_code} · {a.subject}</p>
                                <h2 className="text-xl font-black">{a.title}</h2>
                                <p className="mt-3 whitespace-pre-line text-sm text-neutral-60">{a.description}</p>
                                <p className={`mt-3 text-sm font-semibold ${pastDeadline && !submitted ? "text-error-base" : ""}`}>
                                    Deadline {new Date(a.deadline_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                                    {pastDeadline && !submitted && a.status === "published" && " · lewat deadline, pengumpulan akan tercatat terlambat"}
                                </p>
                                <p className="mt-2 text-sm">
                                    Status: {a.submission_status ? SUBMISSION_STATUS_LABELS[a.submission_status] ?? a.submission_status : a.status === "closed" ? "Tidak mengumpulkan" : "Belum mengumpulkan"}
                                    {submitted && <> · <a className="font-semibold text-primary-base underline" href={`/api/enrollment/submissions/${a.submission_id}/file`} target="_blank" rel="noreferrer">Lihat file saya</a></>}
                                </p>
                                {a.status === "closed" && <p className="mt-1 text-xs text-neutral-50">Tugas sudah ditutup.</p>}
                                {submitted && a.status === "published" && a.score === null && !a.allow_resubmission && <p className="mt-1 text-xs text-neutral-50">Tugas ini tidak mengizinkan pengumpulan ulang.</p>}
                                {a.score !== null && <div className="mt-3 rounded-xl bg-success-10 p-3"><b>Nilai {Number(a.score)}/{Number(a.max_score)}</b>{a.feedback && <p className="whitespace-pre-line">{a.feedback}</p>}</div>}
                                {a.correction_uploaded_at && (
                                    <a href={`/api/enrollment/submissions/${a.submission_id}/correction`} target="_blank" rel="noreferrer"
                                        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary-base bg-primary-10 px-4 py-2.5 text-sm font-bold text-primary-base">
                                        ✏️ Lihat hasil koreksi pengajar
                                    </a>
                                )}
                            </div>
                            {canUpload && (
                                <label className="h-fit shrink-0 cursor-pointer rounded-xl bg-primary-base px-4 py-3 text-center text-sm font-bold text-white">
                                    {uploading === a.id ? "Mengunggah..." : submitted ? "Unggah ulang PDF" : "Unggah PDF"}
                                    <input className="sr-only" type="file" accept=".pdf,application/pdf" disabled={uploading !== 0} onChange={(e) => { void upload(a.id, e.target.files?.[0]); e.target.value = ""; }} />
                                </label>
                            )}
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
