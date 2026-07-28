import { NextRequest, NextResponse } from "next/server";
import { listAssignmentsForStudent } from "@repo/database";
import { COOKIE_NAME, verifyToken } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifyToken(token) : null;
    if (!session || session.role !== "student" || session.id < 1) return NextResponse.json({ error: "Membership student diperlukan" }, { status: 403 });
    return NextResponse.json({ data: await listAssignmentsForStudent(session.id) });
}
