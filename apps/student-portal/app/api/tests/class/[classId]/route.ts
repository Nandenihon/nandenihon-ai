import { NextRequest, NextResponse } from "next/server";
import { getClassTestInfo } from "@repo/database";
import { requirePreStudent } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ classId: string }> };

export async function GET(request: NextRequest, context: Context) {
    const session = await requirePreStudent(request);
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const classId = Number((await context.params).classId);
    const info = await getClassTestInfo(classId);
    if (!info) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ data: info });
}
