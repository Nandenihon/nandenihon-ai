import { NextRequest, NextResponse } from "next/server";
import { closeClassTest, findClassTestById, publishClassTest, teacherCanManageClass } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string; testId: string }> };

export async function POST(request: NextRequest, context: Context) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const testId = Number((await context.params).testId);
    const test = await findClassTestById(testId);
    if (!test) return NextResponse.json({ error: "Tes tidak ditemukan" }, { status: 404 });
    if (actor.role === "lecture" && !(await teacherCanManageClass(actor.id, test.classId))) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const action = String((await request.json()).action ?? "");
    try {
        if (action === "publish") await publishClassTest(testId, actor.id);
        else if (action === "close") await closeClassTest(testId, actor.id);
        else return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
        return NextResponse.json({ message: "Status tes diperbarui" });
    } catch (error) {
        const message = error instanceof Error && error.message === "TEST_HAS_NO_QUESTIONS"
            ? "Tambahkan minimal satu soal sebelum mempublikasikan tes"
            : "Status tes tidak dapat diubah";
        return NextResponse.json({ error: message }, { status: 409 });
    }
}
