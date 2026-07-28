import { NextRequest, NextResponse } from "next/server";
import { findPortalClass, teacherCanManageClass, transitionPortalClass } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string }> };
const ACTIONS = new Set(["publish", "close-enrollment", "close", "archive"]);

export async function POST(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const classId = Number((await context.params).id);
    const body = await request.json();
    const action = String(body.action ?? "");
    if (!ACTIONS.has(action)) return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
    const existing = await findPortalClass(classId);
    if (!existing || (actor.role === "teacher" && !await teacherCanManageClass(actor.id, classId))) {
        return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }
    try {
        const data = await transitionPortalClass(classId, action as "publish" | "close-enrollment" | "close" | "archive", actor.id);
        return NextResponse.json({ data });
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (["CLASS_INCOMPLETE", "INVALID_CLASS_DATES"].includes(message)) {
            return NextResponse.json({ error: "Data kelas belum lengkap atau periode tidak valid" }, { status: 400 });
        }
        return NextResponse.json({ error: "Gagal mengubah status kelas" }, { status: 500 });
    }
}
