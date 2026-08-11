import { NextRequest, NextResponse } from "next/server";
import { listPublishedTestsForClass } from "@repo/database";
import { requirePreStudent } from "@/app/lib/enrollment-auth";

export async function GET(request: NextRequest) {
    const session = await requirePreStudent(request);
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const classId = Number(request.nextUrl.searchParams.get("classId"));
    if (!classId) return NextResponse.json({ error: "classId wajib diisi" }, { status: 400 });
    return NextResponse.json({ data: await listPublishedTestsForClass(classId) });
}
