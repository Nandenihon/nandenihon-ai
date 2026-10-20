import { teacherCanManageClass } from "@repo/database";

export function jakartaToday() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

/** Returns an error message, or null when the date is a real YYYY-MM-DD date that is not in the future. */
export function validateAttendanceDate(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00Z`).getTime())) return "Format tanggal tidak valid";
    if (date > jakartaToday()) return "Absensi tidak bisa diisi untuk tanggal yang akan datang";
    return null;
}

export async function canManageAttendance(actor: { id: number; role: string }, classId: number) {
    // Lecturers only see their own classes; super_admin and admin_2 manage every class.
    return actor.role !== "lecture" || teacherCanManageClass(actor.id, classId);
}

export function csvEscape(value: unknown): string {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Builds a UTF-8 CSV (with BOM so Excel reads non-ASCII names correctly) download response. */
export function csvResponse(rows: unknown[][], filename: string) {
    const csv = `﻿${rows.map((row) => row.map(csvEscape).join(",")).join("\r\n")}`;
    return new Response(csv, {
        status: 200,
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "private, no-store",
        },
    });
}
