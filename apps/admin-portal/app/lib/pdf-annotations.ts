/**
 * Teacher corrections on a student's PDF. Every coordinate is normalized to the page as displayed
 * (0..1 of the rotated viewport's width/height) so annotations survive zoom and screen size changes.
 * Lengths (stroke width, stamp and font size) are fractions of the displayed page width.
 */
export type Point = [number, number];
export type DrawingTool = "pen" | "highlighter";
export type StampKind = "check" | "cross";
export type Tool = "pan" | DrawingTool | StampKind | "text" | "eraser";

export type Annotation =
    | { id: string; type: "stroke"; tool: DrawingTool; color: string; width: number; points: Point[] }
    | { id: string; type: "stamp"; kind: StampKind; x: number; y: number; size: number }
    | { id: string; type: "text"; x: number; y: number; text: string; color: string; size: number };

/** Annotations keyed by zero-based page index. */
export type PageAnnotations = Record<number, Annotation[]>;

export const PEN_WIDTH = 0.004;
export const HIGHLIGHTER_WIDTH = 0.022;
export const STAMP_SIZE = 0.045;
export const TEXT_SIZE = 0.024;
export const HIGHLIGHTER_COLOR = "#facc15";
const CHECK_COLOR = "#16a34a";
const CROSS_COLOR = "#dc2626";
const HIGHLIGHTER_ALPHA = 0.35;
const TEXT_LINE_HEIGHT = 1.25;
const FONT_FAMILY = `"Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Segoe UI", Arial, sans-serif`;

export function newAnnotationId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function hasAnnotations(pages: PageAnnotations) {
    return Object.values(pages).some((items) => items.length > 0);
}

function drawStroke(ctx: CanvasRenderingContext2D, item: Extract<Annotation, { type: "stroke" }>, w: number, h: number) {
    const lineWidth = Math.max(1, item.width * w);
    ctx.save();
    ctx.globalAlpha = item.tool === "highlighter" ? HIGHLIGHTER_ALPHA : 1;
    ctx.strokeStyle = item.color;
    ctx.fillStyle = item.color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = item.tool === "highlighter" ? "square" : "round";
    ctx.lineJoin = "round";
    const points = item.points.map(([x, y]) => [x * w, y * h] as const);
    if (points.length === 1) {
        ctx.beginPath();
        ctx.arc(points[0][0], points[0][1], lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Quadratic curves through segment midpoints smooth out jittery finger/mouse input.
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length - 1; i++) {
            const midX = (points[i][0] + points[i + 1][0]) / 2;
            const midY = (points[i][1] + points[i + 1][1]) / 2;
            ctx.quadraticCurveTo(points[i][0], points[i][1], midX, midY);
        }
        const last = points[points.length - 1];
        ctx.lineTo(last[0], last[1]);
        ctx.stroke();
    }
    ctx.restore();
}

function drawStamp(ctx: CanvasRenderingContext2D, item: Extract<Annotation, { type: "stamp" }>, w: number, h: number) {
    const size = item.size * w;
    const cx = item.x * w;
    const cy = item.y * h;
    ctx.save();
    ctx.lineWidth = Math.max(2, size * 0.16);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (item.kind === "check") {
        ctx.strokeStyle = CHECK_COLOR;
        ctx.moveTo(cx - size * 0.42, cy + size * 0.02);
        ctx.lineTo(cx - size * 0.12, cy + size * 0.34);
        ctx.lineTo(cx + size * 0.45, cy - size * 0.38);
    } else {
        ctx.strokeStyle = CROSS_COLOR;
        ctx.moveTo(cx - size * 0.36, cy - size * 0.36);
        ctx.lineTo(cx + size * 0.36, cy + size * 0.36);
        ctx.moveTo(cx + size * 0.36, cy - size * 0.36);
        ctx.lineTo(cx - size * 0.36, cy + size * 0.36);
    }
    ctx.stroke();
    ctx.restore();
}

function drawText(ctx: CanvasRenderingContext2D, item: Extract<Annotation, { type: "text" }>, w: number, h: number) {
    const fontSize = item.size * w;
    ctx.save();
    ctx.font = `600 ${fontSize}px ${FONT_FAMILY}`;
    ctx.textBaseline = "top";
    ctx.fillStyle = item.color;
    // A thin white halo keeps notes readable on top of handwriting or dark scans.
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = Math.max(2, fontSize * 0.18);
    ctx.lineJoin = "round";
    item.text.split("\n").forEach((line, index) => {
        const y = item.y * h + index * fontSize * TEXT_LINE_HEIGHT;
        ctx.strokeText(line, item.x * w, y);
        ctx.fillText(line, item.x * w, y);
    });
    ctx.restore();
}

/** Draws annotations onto a canvas context whose drawing area is w × h pixels (the whole page). */
export function drawAnnotations(ctx: CanvasRenderingContext2D, items: Annotation[], w: number, h: number) {
    for (const item of items) {
        if (item.type === "stroke") drawStroke(ctx, item, w, h);
        else if (item.type === "stamp") drawStamp(ctx, item, w, h);
        else drawText(ctx, item, w, h);
    }
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** True when the point (in pixels on a w × h page) touches the annotation, within `radius` pixels. */
export function hitTest(item: Annotation, x: number, y: number, w: number, h: number, radius: number) {
    if (item.type === "stroke") {
        const reach = radius + (item.width * w) / 2;
        const points = item.points.map(([px, py]) => [px * w, py * h] as const);
        if (points.length === 1) return Math.hypot(x - points[0][0], y - points[0][1]) <= reach;
        for (let i = 0; i < points.length - 1; i++) {
            if (distanceToSegment(x, y, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]) <= reach) return true;
        }
        return false;
    }
    if (item.type === "stamp") return Math.hypot(x - item.x * w, y - item.y * h) <= radius + (item.size * w) / 2;
    const fontSize = item.size * w;
    const lines = item.text.split("\n");
    const width = Math.max(...lines.map((line) => line.length)) * fontSize * 0.62;
    const height = lines.length * fontSize * TEXT_LINE_HEIGHT;
    const left = item.x * w;
    const top = item.y * h;
    return x >= left - radius && x <= left + width + radius && y >= top - radius && y <= top + height + radius;
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? blob.arrayBuffer().then(resolve, reject) : reject(new Error("Gagal membuat gambar koreksi"))), "image/png");
    });
}

/**
 * Flattens the annotations into a copy of the PDF: each annotated page gets one transparent PNG
 * layer covering the visible page. Rasterizing (instead of drawing vector text) keeps any script,
 * including Japanese notes, identical to what the teacher saw on screen.
 */
export async function exportAnnotatedPdf(originalPdf: ArrayBuffer, pages: PageAnnotations): Promise<Uint8Array> {
    // Loaded on save only, keeping the correction screen light on phones.
    const { PDFDocument, degrees } = await import("pdf-lib");
    const pdf = await PDFDocument.load(originalPdf, { ignoreEncryption: true });
    for (const [pageKey, items] of Object.entries(pages)) {
        if (!items.length) continue;
        const pageIndex = Number(pageKey);
        if (pageIndex < 0 || pageIndex >= pdf.getPageCount()) continue;
        const page = pdf.getPage(pageIndex);
        const box = page.getCropBox();
        const rotation = ((page.getRotation().angle % 360) + 360) % 360;
        const viewWidth = rotation % 180 === 0 ? box.width : box.height;
        const viewHeight = rotation % 180 === 0 ? box.height : box.width;

        // ~2.5 px per PDF point, capped so very large pages stay within mobile canvas limits.
        const scale = Math.min(2.5, 3000 / Math.max(viewWidth, viewHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewWidth * scale);
        canvas.height = Math.round(viewHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas tidak didukung browser ini");
        drawAnnotations(ctx, items, canvas.width, canvas.height);
        const image = await pdf.embedPng(await canvasToPng(canvas));

        // The image is drawn in the page's unrotated space, rotated so it lines up after the
        // viewer applies the page's /Rotate (clockwise) on display.
        const origin = {
            0: { x: box.x, y: box.y },
            90: { x: box.x + box.width, y: box.y },
            180: { x: box.x + box.width, y: box.y + box.height },
            270: { x: box.x, y: box.y + box.height },
        }[rotation] ?? { x: box.x, y: box.y };
        page.drawImage(image, { x: origin.x, y: origin.y, width: viewWidth, height: viewHeight, rotate: degrees(rotation) });
    }
    return pdf.save();
}
