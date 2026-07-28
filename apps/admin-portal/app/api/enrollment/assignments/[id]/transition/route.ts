import { NextRequest, NextResponse } from "next/server";
import { closeAssignment, findAssignment, publishAssignment, teacherCanManageClass } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const id = Number((await context.params).id);
    const item = await findAssignment(id);
    if (!item) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    if (!await teacherCanManageClass(actor.id, Number(item.class_id)) && !["super_admin", "admin"].includes(actor.role)) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }
    const action = String((await request.json()).action ?? "");
    try {
        if (action === "publish") await publishAssignment(id, actor.id);
        else if (action === "close") await closeAssignment(id, actor.id);
        else return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
        return NextResponse.json({ message: "Status tugas diperbarui" });
    } catch {
        return NextResponse.json({ error: "Status tugas tidak dapat diubah" }, { status: 409 });
    }
}
