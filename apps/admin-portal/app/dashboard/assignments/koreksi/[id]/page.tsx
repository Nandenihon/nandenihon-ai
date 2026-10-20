"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PdfAnnotator from "../../../../components/PdfAnnotator";

type SubmissionDetail = {
    id: number;
    assignmentTitle: string;
    classCode: string;
    studentName: string;
    version: number;
    originalFilename: string;
    submittedAt: string;
    status: string;
    maxScore: number;
    score: number | null;
    feedback: string;
    hasCorrection: boolean;
    correctionUploadedAt: string | null;
};

const STATUS_LABELS: Record<string, string> = {
    submitted: "Tepat waktu", late: "Terlambat", resubmitted: "Dikumpulkan ulang", graded: "Sudah dinilai", pending_upload: "Sedang diunggah",
};

function formatDateTime(value: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" });
}

export default function SubmissionCorrectionPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [detail, setDetail] = useState<SubmissionDetail | null>(null);
    const [loadError, setLoadError] = useState("");
    const [source, setSource] = useState<"original" | "correction">("original");
    const [annotatorKey, setAnnotatorKey] = useState(0);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [grade, setGrade] = useState({ score: "", feedback: "" });
    const [savingGrade, setSavingGrade] = useState(false);

    const load = useCallback(async (resetSource: boolean) => {
        const res = await fetch(`/api/enrollment/submissions/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
            setLoadError(data.error || "Submission tidak ditemukan");
            return;
        }
        const item = data.data as SubmissionDetail;
        setDetail(item);
        if (resetSource) {
            // Continue on top of an earlier correction by default so previous marks are kept.
            setSource(item.hasCorrection ? "correction" : "original");
            setGrade({ score: item.score !== null ? String(item.score) : "", feedback: item.feedback ?? "" });
        }
    }, [id]);

    useEffect(() => { void load(true); }, [load]);

    const uploadCorrection = async (file: Blob, filename: string) => {
        const form = new FormData();
        form.append("file", file, filename);
        const res = await fetch(`/api/enrollment/submissions/${id}/correction`, { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Gagal menyimpan koreksi");
        await load(false);
        setSource("correction");
        setAnnotatorKey((k) => k + 1);
        setMessage({ type: "success", text: "Koreksi tersimpan. Siswa sudah bisa melihat PDF hasil koreksi." });
    };

    const handleManualUpload = async (file?: File) => {
        if (!file) return;
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            setMessage({ type: "error", text: "File koreksi harus berformat PDF" });
            return;
        }
        setUploading(true);
        setMessage(null);
        try {
            await uploadCorrection(file, file.name);
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Gagal mengunggah koreksi" });
        } finally {
            setUploading(false);
        }
    };

    const saveGrade = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!detail) return;
        const score = Number(grade.score);
        if (grade.score.trim() === "" || !Number.isFinite(score) || score < 0 || score > detail.maxScore) {
            setMessage({ type: "error", text: `Nilai harus antara 0 dan ${detail.maxScore}.` });
            return;
        }
        setSavingGrade(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/enrollment/submissions/${id}/grade`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score, feedback: grade.feedback }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Gagal menyimpan nilai");
            await load(false);
            setMessage({ type: "success", text: "Nilai berhasil dipublikasikan." });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Gagal menyimpan nilai" });
        } finally {
            setSavingGrade(false);
        }
    };

    if (loadError) {
        return (
            <div className="flex flex-col gap-4">
                <button type="button" onClick={() => router.back()} className="w-fit text-sm font-semibold text-primary-base">← Kembali</button>
                <div className="rounded-xl border border-error-base bg-error-10 px-4 py-3 text-sm text-error-base">{loadError}</div>
            </div>
        );
    }

    const sourceUrl = `/api/enrollment/submissions/${id}/${source === "correction" ? "correction" : "file"}`;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <button type="button" onClick={() => router.back()} className="text-sm font-semibold text-primary-base">← Kembali ke submission</button>
                    <h2 className="mt-1 text-xl font-bold text-neutral-90">Koreksi Tugas</h2>
                    {detail ? (
                        <p className="text-sm text-neutral-50">
                            <b className="text-neutral-80">{detail.studentName}</b> · {detail.classCode} · {detail.assignmentTitle} · versi {detail.version}
                            {" · "}{STATUS_LABELS[detail.status] ?? detail.status} · dikumpulkan {formatDateTime(detail.submittedAt)}
                        </p>
                    ) : <div className="mt-1 h-4 w-64 animate-pulse rounded bg-neutral-20" />}
                </div>
                {detail && (
                    <a href={`/api/enrollment/submissions/${id}/file`} target="_blank" rel="noreferrer"
                        className="rounded-xl bg-primary-10 px-3 py-2 text-xs font-semibold text-primary-base">Buka file asli</a>
                )}
            </div>

            {message && (
                <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === "success" ? "border-success-base bg-success-10 text-success-base" : "border-error-base bg-error-10 text-error-base"}`}>
                    {message.text}
                </div>
            )}

            {detail?.hasCorrection && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-20 bg-absolute-white px-4 py-3 text-sm">
                    <span className="text-neutral-60">Koreksi terakhir disimpan {formatDateTime(detail.correctionUploadedAt)}.</span>
                    <span className="text-neutral-60">Lanjutkan dari:</span>
                    {(["correction", "original"] as const).map((option) => (
                        <button key={option} type="button"
                            onClick={() => { if (option !== source) { setSource(option); setAnnotatorKey((k) => k + 1); } }}
                            aria-pressed={source === option}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${source === option ? "bg-primary-base text-absolute-white" : "bg-primary-10 text-primary-base"}`}>
                            {option === "correction" ? "Koreksi sebelumnya" : "File asli (mulai ulang)"}
                        </button>
                    ))}
                </div>
            )}

            {detail && (
                <PdfAnnotator key={`${source}-${annotatorKey}`} sourceUrl={sourceUrl}
                    onSave={(pdf) => uploadCorrection(pdf, `koreksi-${detail.originalFilename}`)} />
            )}

            <div className="grid gap-4 lg:grid-cols-2">
                <form onSubmit={saveGrade} className="flex flex-col gap-3 rounded-2xl border border-neutral-20 bg-absolute-white p-5">
                    <h3 className="text-sm font-bold text-neutral-90">Nilai & Feedback</h3>
                    <label className="text-xs font-semibold text-neutral-70">
                        Nilai (0–{detail?.maxScore ?? 100})
                        <input required type="number" min={0} max={detail?.maxScore} step="any" value={grade.score}
                            onChange={(e) => setGrade({ ...grade, score: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-neutral-20 p-2.5 text-sm outline-none focus:border-primary-base" />
                    </label>
                    <label className="text-xs font-semibold text-neutral-70">
                        Feedback
                        <textarea value={grade.feedback} onChange={(e) => setGrade({ ...grade, feedback: e.target.value })} rows={3}
                            placeholder="Catatan umum untuk siswa"
                            className="mt-1 w-full rounded-lg border border-neutral-20 p-2.5 text-sm outline-none focus:border-primary-base" />
                    </label>
                    <button type="submit" disabled={savingGrade || !detail}
                        className="self-end rounded-xl bg-primary-base px-4 py-2 text-sm font-semibold text-absolute-white hover:bg-primary-80 disabled:bg-neutral-30">
                        {savingGrade ? "Menyimpan..." : detail?.score !== null && detail?.score !== undefined ? "Perbarui nilai" : "Simpan nilai"}
                    </button>
                </form>

                <div className="flex flex-col gap-2 rounded-2xl border border-neutral-20 bg-absolute-white p-5">
                    <h3 className="text-sm font-bold text-neutral-90">Upload PDF koreksi dari perangkat</h3>
                    <p className="text-xs text-neutral-50">
                        Alternatif kalau Anda lebih nyaman mengoreksi di aplikasi lain (Adobe, Xodo, dll.). File ini menggantikan koreksi yang tersimpan.
                    </p>
                    <label className={`w-fit cursor-pointer rounded-xl bg-primary-10 px-4 py-2 text-sm font-semibold text-primary-base ${uploading ? "opacity-60" : ""}`}>
                        {uploading ? "Mengunggah..." : "Pilih PDF koreksi"}
                        <input type="file" accept=".pdf,application/pdf" className="sr-only" disabled={uploading}
                            onChange={(e) => { void handleManualUpload(e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                </div>
            </div>
        </div>
    );
}
