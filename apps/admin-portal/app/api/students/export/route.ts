import { NextRequest, NextResponse } from "next/server";
import { listStudentsOverview, type StudentStatus } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

const VALID_STATUSES = new Set<StudentStatus>(["active", "inactive"]);
const STATUS_LABEL: Record<StudentStatus, string> = { active: "Aktif", inactive: "Non-aktif" };

function csvEscape(value: unknown): string {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatDateForExport(value: unknown): string {
    if (!value) return "";
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value as string));
}

export async function GET(request: NextRequest) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

    const params = request.nextUrl.searchParams;
    const search = params.get("search") || undefined;
    const classId = Number(params.get("classId")) || undefined;
    const statusParam = params.get("status") || "";
    const status = VALID_STATUSES.has(statusParam as StudentStatus) ? (statusParam as StudentStatus) : undefined;

    const { data } = await listStudentsOverview({ search, classId, status, page: 1, pageSize: 500 });

    const header = ["Nama Lengkap", "Email", "No. HP", "Level", "Kelas", "Status", "Aktif Sejak"];
    const lines = [header.map(csvEscape).join(",")];
    for (const row of data) {
        lines.push([
            row.full_name,
            row.email,
            row.whatsapp ?? "",
            row.japanese_level ?? "",
            row.class_code ? `${row.class_code} - ${row.class_name}` : "",
            STATUS_LABEL[(row.status as StudentStatus) ?? "active"],
            formatDateForExport(row.activated_at),
        ].map(csvEscape).join(","));
    }
    const csv = `﻿${lines.join("\r\n")}`;
    const filename = `siswa-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
        status: 200,
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
