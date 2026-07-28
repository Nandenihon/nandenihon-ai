import { NextRequest, NextResponse } from "next/server";
import { listNotifications, resolvePreStudentId } from "@repo/database";
import { COOKIE_NAME, verifyToken } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifyToken(token) : null;
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const preStudentId = await resolvePreStudentId(session.id, session.email);
    return NextResponse.json({ data: await listNotifications(session.id > 0 ? session.id : null, preStudentId) });
}
