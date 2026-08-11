import { NextRequest, NextResponse } from "next/server";
import { createPortalClass, listPortalClasses, type PortalClassInput } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

const VALID_TEST_LEVELS = new Set(["N5 Basic", "N5 Menengah", "N5 Lanjutan", "N4"]);

function parseInput(body: Record<string, unknown>, actorId: number): PortalClassInput {
    return {
        code: String(body.code ?? "").trim(),
        name: String(body.name ?? "").trim(),
        description: String(body.description ?? "").trim(),
        level: String(body.level ?? "").trim(),
        program: String(body.program ?? "").trim(),
        schedule: String(body.schedule ?? "").trim(),
        capacity: Number(body.capacity),
        enrollmentOpenAt: String(body.enrollmentOpenAt ?? ""),
        enrollmentCloseAt: String(body.enrollmentCloseAt ?? ""),
        startAt: String(body.startAt ?? ""),
        endAt: String(body.endAt ?? ""),
        ownerTeacherId: Number(body.ownerTeacherId || actorId),
        testPassScore: Number(body.testPassScore ?? 60),
    };
}

function validate(input: PortalClassInput) {
    if (!input.code || !/^[A-Za-z0-9_-]{2,50}$/.test(input.code)) return "Kode kelas wajib 2–50 karakter";
    if (input.name.length < 3 || input.name.length > 255) return "Nama kelas tidak valid";
    if (!input.description || !input.level || !input.program || !input.schedule) return "Deskripsi, level, program, dan jadwal wajib diisi";
    if (!VALID_TEST_LEVELS.has(input.level)) return `Level harus salah satu dari: ${[...VALID_TEST_LEVELS].join(", ")}`;
    if (!Number.isInteger(input.capacity) || input.capacity < 1) return "Kapasitas minimal 1";
    if (!input.ownerTeacherId || !input.enrollmentOpenAt || !input.enrollmentCloseAt || !input.startAt || !input.endAt) return "Teacher dan seluruh periode wajib diisi";
    if (new Date(input.enrollmentOpenAt) >= new Date(input.enrollmentCloseAt)) return "Periode enrollment tidak valid";
    if (new Date(input.startAt) >= new Date(input.endAt)) return "Periode kelas tidak valid";
    if (input.testPassScore === undefined || !Number.isInteger(input.testPassScore) || input.testPassScore < 0 || input.testPassScore > 100) {
        return "Nilai kelulusan harus 0-100";
    }
    return null;
}

export async function GET(request: NextRequest) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const params = request.nextUrl.searchParams;
    const classes = await listPortalClasses({
        search: params.get("search") || undefined,
        status: params.get("status") || undefined,
        level: params.get("level") || undefined,
        teacherId: actor.role === "lecture" ? actor.id : Number(params.get("teacherId")) || undefined,
    });
    return NextResponse.json({ data: classes });
}

export async function POST(request: NextRequest) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    if (!["super_admin", "admin_2"].includes(actor.role)) {
        return NextResponse.json({ error: "Hanya admin yang dapat membuat kelas" }, { status: 403 });
    }
    try {
        const input = parseInput(await request.json(), actor.id);
        const error = validate(input);
        if (error) return NextResponse.json({ error }, { status: 400 });
        const data = await createPortalClass(input, actor.id);
        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === "ER_DUP_ENTRY") return NextResponse.json({ error: "Kode kelas sudah digunakan" }, { status: 409 });
        console.error("Create enrollment class error:", error);
        return NextResponse.json({ error: "Gagal membuat kelas" }, { status: 500 });
    }
}
