import { NextRequest, NextResponse } from "next/server";
import {
    assignClassTeacher,
    findPortalClass,
    listClassTeachers,
    removeClassTeacher,
} from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string }> };
const ADMIN_ROLES = ["super_admin", "admin_2"];

export async function GET(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const classId = Number((await context.params).id);
    const item = await findPortalClass(classId);
    if (!item || (actor.role === "lecture" && !await hasAssignment(classId, actor.id))) {
        return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: await listClassTeachers(classId) });
}

export async function POST(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, ADMIN_ROLES);
    if (!actor) return NextResponse.json({ error: "Hanya admin yang dapat assign pengajar" }, { status: 403 });
    const classId = Number((await context.params).id);
    const body = await request.json();
    try {
        const data = await assignClassTeacher(
            classId,
            Number(body.teacherId),
            actor.id,
            body.role === "assistant" ? "assistant" : body.role === "owner" ? "owner" : "teacher"
        );
        return NextResponse.json({ message: "Pengajar berhasil ditambahkan", data });
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message === "TEACHER_NOT_FOUND") return NextResponse.json({ error: "Akun pengajar tidak ditemukan" }, { status: 404 });
        return NextResponse.json({ error: "Gagal menambahkan pengajar" }, { status: 400 });
    }
}

export async function DELETE(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, ADMIN_ROLES);
    if (!actor) return NextResponse.json({ error: "Hanya admin yang dapat menghapus pengajar" }, { status: 403 });
    const classId = Number((await context.params).id);
    const teacherId = Number(request.nextUrl.searchParams.get("teacherId"));
    try {
        await removeClassTeacher(classId, teacherId, actor.id);
        return NextResponse.json({ message: "Pengajar dihapus dari kelas" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message === "OWNER_CANNOT_BE_REMOVED") return NextResponse.json({ error: "Owner teacher harus diganti sebelum dihapus" }, { status: 409 });
        return NextResponse.json({ error: "Pengajar tidak ditemukan pada kelas" }, { status: 404 });
    }
}

async function hasAssignment(classId: number, teacherId: number) {
    const teachers = await listClassTeachers(classId);
    return teachers.some((teacher) => Number(teacher.teacher_id) === teacherId);
}
