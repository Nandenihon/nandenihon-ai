"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import {
    HIGHLIGHTER_COLOR,
    HIGHLIGHTER_WIDTH,
    PEN_WIDTH,
    STAMP_SIZE,
    TEXT_SIZE,
    drawAnnotations,
    exportAnnotatedPdf,
    hasAnnotations,
    hitTest,
    newAnnotationId,
    type Annotation,
    type PageAnnotations,
    type Point,
    type Tool,
} from "../lib/pdf-annotations";

const COLORS = [
    { value: "#dc2626", label: "Merah" },
    { value: "#2563eb", label: "Biru" },
    { value: "#16a34a", label: "Hijau" },
    { value: "#111827", label: "Hitam" },
];

const TOOLS: { value: Tool; label: string; icon: string; hint: string }[] = [
    { value: "pan", label: "Geser", icon: "✋", hint: "Geser dan scroll halaman tanpa mencoret" },
    { value: "pen", label: "Pena", icon: "✏️", hint: "Coret, lingkari, atau tulis tangan" },
    { value: "highlighter", label: "Stabilo", icon: "🖍️", hint: "Tandai bagian tertentu" },
    { value: "check", label: "Benar", icon: "✓", hint: "Ketuk untuk memberi tanda benar" },
    { value: "cross", label: "Salah", icon: "✗", hint: "Ketuk untuk memberi tanda salah" },
    { value: "text", label: "Teks", icon: "T", hint: "Ketuk lalu tulis catatan" },
    { value: "eraser", label: "Hapus", icon: "⌫", hint: "Sentuh coretan untuk menghapusnya" },
];

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const MAX_PIXEL_RATIO = 2; // caps canvas memory on high-density phone screens
const MAX_HISTORY = 50;

type TextDraft = { page: number; x: number; y: number; value: string };

export default function PdfAnnotator({
    sourceUrl,
    onSave,
}: {
    /** URL of the PDF to correct (the student's file, or a previous correction to continue on). */
    sourceUrl: string;
    /** Receives the flattened corrected PDF. Throw to keep the annotations on screen. */
    onSave: (pdf: Blob) => Promise<void>;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const originalBytesRef = useRef<ArrayBuffer | null>(null);
    const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
    const [loadError, setLoadError] = useState("");
    const [containerWidth, setContainerWidth] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [tool, setTool] = useState<Tool>("pen");
    const [color, setColor] = useState(COLORS[0].value);
    const [annotations, setAnnotations] = useState<PageAnnotations>({});
    const [history, setHistory] = useState<PageAnnotations[]>([]);
    const [textDraft, setTextDraft] = useState<TextDraft | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const dirty = hasAnnotations(annotations);
    // Latest annotations for callbacks, so history is recorded outside state updaters
    // (React may run updaters twice in development).
    const annotationsRef = useRef(annotations);
    annotationsRef.current = annotations;

    // Load pdf.js lazily (browser only) and the source document.
    useEffect(() => {
        let cancelled = false;
        let loaded: PDFDocumentProxy | null = null;
        (async () => {
            try {
                // The legacy build bundles polyfills so older phone browsers can render PDFs too.
                const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
                pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
                const response = await fetch(sourceUrl, { cache: "no-store" });
                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.error || "PDF tidak bisa dimuat");
                }
                const bytes = await response.arrayBuffer();
                originalBytesRef.current = bytes.slice(0); // pdf.js takes ownership of the buffer it is given
                loaded = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
                if (cancelled) return void loaded.destroy();
                setPdf(loaded);
            } catch (error) {
                if (!cancelled) setLoadError(error instanceof Error ? error.message : "PDF tidak bisa dimuat");
            }
        })();
        return () => {
            cancelled = true;
            void loaded?.destroy();
        };
    }, [sourceUrl]);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) => setContainerWidth(Math.floor(entry.contentRect.width)));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    // Warn before leaving with unsaved corrections.
    useEffect(() => {
        if (!dirty) return;
        const handler = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);

    const commit = useCallback((update: (prev: PageAnnotations) => PageAnnotations) => {
        const prev = annotationsRef.current;
        const next = update(prev);
        if (next === prev) return;
        annotationsRef.current = next;
        setHistory((h) => [...h.slice(-(MAX_HISTORY - 1)), prev]);
        setAnnotations(next);
    }, []);

    const addAnnotation = useCallback((page: number, item: Annotation) => {
        commit((prev) => ({ ...prev, [page]: [...(prev[page] ?? []), item] }));
    }, [commit]);

    const undo = () => {
        if (!history.length) return;
        const previous = history[history.length - 1];
        annotationsRef.current = previous;
        setAnnotations(previous);
        setHistory(history.slice(0, -1));
    };

    const clearAll = () => {
        if (!dirty) return;
        commit(() => ({}));
    };

    const confirmText = () => {
        if (!textDraft) return;
        const text = textDraft.value.trim();
        if (text) {
            addAnnotation(textDraft.page, { id: newAnnotationId(), type: "text", x: textDraft.x, y: textDraft.y, text, color, size: TEXT_SIZE });
        }
        setTextDraft(null);
    };

    const save = async () => {
        if (!originalBytesRef.current || !dirty) return;
        setSaving(true);
        setSaveError("");
        try {
            const bytes = await exportAnnotatedPdf(originalBytesRef.current.slice(0), annotations);
            await onSave(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
            annotationsRef.current = {};
            setAnnotations({});
            setHistory([]);
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : "Gagal menyimpan koreksi");
        } finally {
            setSaving(false);
        }
    };

    const pageWidth = Math.max(200, Math.round(containerWidth * zoom));
    const activeHint = TOOLS.find((t) => t.value === tool)?.hint;
    const showColors = tool === "pen" || tool === "text";

    return (
        <div className="flex flex-col gap-3">
            {/* Toolbar */}
            <div className="rounded-2xl border border-neutral-20 bg-absolute-white p-2 shadow-sm">
                <div className="flex flex-wrap items-center gap-1 pb-1">
                    {TOOLS.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => { setTool(t.value); setTextDraft(null); }}
                            aria-pressed={tool === t.value}
                            title={t.hint}
                            className={`flex min-h-11 min-w-12 shrink-0 flex-col items-center justify-center rounded-xl px-2 text-xs font-semibold transition-all ${tool === t.value ? "bg-primary-base text-absolute-white" : "text-neutral-70 hover:bg-primary-10"}`}
                        >
                            <span className={`text-base leading-none ${tool === t.value ? "" : t.value === "check" ? "text-success-base" : t.value === "cross" ? "text-error-base" : ""}`}>{t.icon}</span>
                            <span className="mt-0.5">{t.label}</span>
                        </button>
                    ))}
                    <span className="mx-1 h-8 w-px shrink-0 bg-neutral-20" />
                    <button type="button" onClick={undo} disabled={!history.length} title="Batalkan langkah terakhir"
                        className="flex min-h-11 min-w-12 shrink-0 flex-col items-center justify-center rounded-xl px-2 text-xs font-semibold text-neutral-70 hover:bg-primary-10 disabled:opacity-40">
                        <span className="text-base leading-none">↶</span><span className="mt-0.5">Undo</span>
                    </button>
                    <button type="button" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.25).toFixed(2)))} title="Perkecil"
                        className="min-h-11 min-w-10 shrink-0 rounded-xl text-lg font-bold text-neutral-70 hover:bg-primary-10">−</button>
                    <span className="w-12 shrink-0 text-center text-xs font-semibold text-neutral-60 tabular-nums">{Math.round(zoom * 100)}%</span>
                    <button type="button" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.25).toFixed(2)))} title="Perbesar"
                        className="min-h-11 min-w-10 shrink-0 rounded-xl text-lg font-bold text-neutral-70 hover:bg-primary-10">+</button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
                    <div className="flex items-center gap-2">
                        {showColors ? COLORS.map((c) => (
                            <button key={c.value} type="button" onClick={() => setColor(c.value)} title={c.label} aria-label={`Warna ${c.label}`} aria-pressed={color === c.value}
                                className={`h-7 w-7 rounded-full border-2 ${color === c.value ? "border-neutral-90 ring-2 ring-primary-30" : "border-absolute-white shadow"}`}
                                style={{ backgroundColor: c.value }} />
                        )) : <span className="text-xs text-neutral-50">{activeHint}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={clearAll} disabled={!dirty || saving}
                            className="rounded-xl px-3 py-2 text-xs font-semibold text-error-base hover:bg-error-10 disabled:opacity-40">Hapus semua</button>
                        <button type="button" onClick={save} disabled={!dirty || saving}
                            className="rounded-xl bg-primary-base px-4 py-2 text-sm font-semibold text-absolute-white hover:bg-primary-80 disabled:bg-neutral-30">
                            {saving ? "Menyimpan..." : "Simpan koreksi"}
                        </button>
                    </div>
                </div>
            </div>

            {saveError && <div className="rounded-xl border border-error-base bg-error-10 px-4 py-3 text-sm text-error-base">{saveError}</div>}
            {tool === "pan" ? null : (
                <p className="text-xs text-neutral-50 md:hidden">Mode coret aktif: pilih <b>✋ Geser</b> untuk scroll PDF.</p>
            )}

            {/* Pages scroll inside a viewport-high box so the toolbar above stays within reach
                (the dashboard layout's overflow-x-hidden prevents a sticky toolbar). */}
            <div ref={containerRef} className="max-h-[80vh] w-full overflow-auto overscroll-contain rounded-2xl bg-neutral-20/60 p-2 supports-[height:100dvh]:max-h-[calc(100dvh-9rem)]">
                {loadError ? (
                    <p className="p-8 text-center text-sm text-error-base">{loadError}</p>
                ) : !pdf || !containerWidth ? (
                    <div className="flex flex-col gap-3">
                        <div className="mx-auto aspect-[1/1.414] w-full max-w-3xl animate-pulse rounded-lg bg-absolute-white" />
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3" style={{ width: pageWidth > containerWidth ? pageWidth : undefined }}>
                        {Array.from({ length: pdf.numPages }, (_, index) => (
                            <AnnotatedPage
                                key={index}
                                pdf={pdf}
                                pageIndex={index}
                                width={pageWidth - 16}
                                tool={tool}
                                color={color}
                                items={annotations[index] ?? []}
                                onAdd={addAnnotation}
                                onErase={(ids) => commit((prev) => ({ ...prev, [index]: (prev[index] ?? []).filter((item) => !ids.has(item.id)) }))}
                                onTextStart={(x, y) => setTextDraft({ page: index, x, y, value: "" })}
                                textDraft={textDraft?.page === index ? textDraft : null}
                                onTextChange={(value) => setTextDraft((d) => (d ? { ...d, value } : d))}
                                onTextConfirm={confirmText}
                                onTextCancel={() => setTextDraft(null)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function AnnotatedPage({
    pdf, pageIndex, width, tool, color, items, onAdd, onErase, onTextStart,
    textDraft, onTextChange, onTextConfirm, onTextCancel,
}: {
    pdf: PDFDocumentProxy;
    pageIndex: number;
    width: number;
    tool: Tool;
    color: string;
    items: Annotation[];
    onAdd: (page: number, item: Annotation) => void;
    onErase: (ids: Set<string>) => void;
    onTextStart: (x: number, y: number) => void;
    textDraft: TextDraft | null;
    onTextChange: (value: string) => void;
    onTextConfirm: () => void;
    onTextCancel: () => void;
}) {
    const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const [page, setPage] = useState<PDFPageProxy | null>(null);
    const [aspect, setAspect] = useState(1.414);
    const strokeRef = useRef<Extract<Annotation, { type: "stroke" }> | null>(null);
    const erasedRef = useRef<Set<string>>(new Set());
    const pointerRef = useRef<number | null>(null);
    const height = Math.round(width * aspect);

    useEffect(() => {
        let cancelled = false;
        pdf.getPage(pageIndex + 1).then((p) => {
            if (cancelled) return;
            const viewport = p.getViewport({ scale: 1 });
            setAspect(viewport.height / viewport.width);
            setPage(p);
        });
        return () => { cancelled = true; };
    }, [pdf, pageIndex]);

    // Render the PDF page whenever the displayed size changes.
    useEffect(() => {
        const canvas = pdfCanvasRef.current;
        if (!page || !canvas || width <= 0) return;
        const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (width / base.width) * ratio });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const task = page.render({ canvasContext: ctx, viewport });
        task.promise.catch(() => { /* cancelled by a newer render */ });
        return () => task.cancel();
    }, [page, width]);

    const redraw = useCallback(() => {
        const canvas = overlayRef.current;
        if (!canvas) return;
        const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
        const w = Math.floor(width * ratio);
        const h = Math.floor(height * ratio);
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);
        const visible = erasedRef.current.size ? items.filter((item) => !erasedRef.current.has(item.id)) : items;
        drawAnnotations(ctx, strokeRef.current ? [...visible, strokeRef.current] : visible, w, h);
    }, [items, width, height]);

    useEffect(() => { redraw(); }, [redraw]);

    const toPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
        const rect = event.currentTarget.getBoundingClientRect();
        return [
            Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
            Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
        ];
    };

    const eraseAt = (point: Point) => {
        const radius = 10; // CSS pixels; generous enough for a fingertip
        for (const item of items) {
            if (!erasedRef.current.has(item.id) && hitTest(item, point[0] * width, point[1] * height, width, height, radius)) {
                erasedRef.current.add(item.id);
            }
        }
        redraw();
    };

    const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (tool === "pan" || pointerRef.current !== null) return; // one pointer at a time (ignores a resting palm)
        if (event.pointerType === "mouse" && event.button !== 0) return;
        const point = toPoint(event);
        if (tool === "check" || tool === "cross") {
            onAdd(pageIndex, { id: newAnnotationId(), type: "stamp", kind: tool, x: point[0], y: point[1], size: STAMP_SIZE });
            return;
        }
        if (tool === "text") {
            onTextStart(point[0], point[1]);
            return;
        }
        event.currentTarget.setPointerCapture(event.pointerId);
        pointerRef.current = event.pointerId;
        if (tool === "eraser") {
            erasedRef.current = new Set();
            eraseAt(point);
            return;
        }
        strokeRef.current = {
            id: newAnnotationId(), type: "stroke", tool,
            color: tool === "highlighter" ? HIGHLIGHTER_COLOR : color,
            width: tool === "highlighter" ? HIGHLIGHTER_WIDTH : PEN_WIDTH,
            points: [point],
        };
        redraw();
    };

    const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (pointerRef.current !== event.pointerId) return;
        // Coalesced events give smooth lines with fast stylus/finger movement where supported.
        const events = typeof event.nativeEvent.getCoalescedEvents === "function" ? event.nativeEvent.getCoalescedEvents() : [];
        const samples = events.length ? events : [event.nativeEvent];
        const rect = event.currentTarget.getBoundingClientRect();
        for (const sample of samples) {
            const point: Point = [
                Math.min(1, Math.max(0, (sample.clientX - rect.left) / rect.width)),
                Math.min(1, Math.max(0, (sample.clientY - rect.top) / rect.height)),
            ];
            if (tool === "eraser") {
                eraseAt(point);
            } else if (strokeRef.current) {
                const last = strokeRef.current.points[strokeRef.current.points.length - 1];
                if (Math.hypot((point[0] - last[0]) * width, (point[1] - last[1]) * height) >= 1.5) strokeRef.current.points.push(point);
            }
        }
        if (tool !== "eraser") redraw();
    };

    const finishPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (pointerRef.current !== event.pointerId) return;
        pointerRef.current = null;
        if (tool === "eraser") {
            if (erasedRef.current.size) onErase(new Set(erasedRef.current));
            erasedRef.current = new Set();
            return;
        }
        const stroke = strokeRef.current;
        strokeRef.current = null;
        if (stroke) onAdd(pageIndex, stroke);
    };

    return (
        <div className="relative shrink-0 bg-absolute-white shadow-md" style={{ width, height }}>
            <canvas ref={pdfCanvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
            <canvas
                ref={overlayRef}
                className="absolute inset-0 h-full w-full"
                style={{ touchAction: tool === "pan" ? "auto" : "none", cursor: tool === "pan" ? "grab" : tool === "eraser" ? "cell" : "crosshair" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={finishPointer}
                onPointerCancel={finishPointer}
                aria-label={`Halaman ${pageIndex + 1}`}
            />
            <span className="pointer-events-none absolute bottom-1 right-2 rounded bg-neutral-90/60 px-1.5 text-[10px] font-semibold text-absolute-white">{pageIndex + 1}</span>
            {textDraft && (
                <div
                    className="absolute z-10 flex w-64 max-w-[90%] flex-col gap-2 rounded-xl border border-neutral-20 bg-absolute-white p-2 shadow-lg"
                    style={{ left: `min(${textDraft.x * 100}%, calc(100% - 16rem))`, top: `${textDraft.y * 100}%` }}
                >
                    <textarea
                        autoFocus
                        value={textDraft.value}
                        onChange={(e) => onTextChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onTextConfirm();
                            if (e.key === "Escape") onTextCancel();
                        }}
                        placeholder="Tulis catatan koreksi..."
                        rows={2}
                        className="w-full resize-none rounded-lg border border-neutral-20 p-2 text-sm outline-none focus:border-primary-base"
                    />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onTextCancel} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-60 hover:bg-neutral-10">Batal</button>
                        <button type="button" onClick={onTextConfirm} className="rounded-lg bg-primary-base px-3 py-1.5 text-xs font-semibold text-absolute-white">Tambah</button>
                    </div>
                </div>
            )}
        </div>
    );
}
