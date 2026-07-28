import { NextRequest, NextResponse } from "next/server";
import { listPortalClasses } from "@repo/database";
import { requireStudent } from "@/app/lib/enrollment-auth";

export async function GET(request: NextRequest) {
    const student = await requireStudent(request);
    if (!student) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const params = request.nextUrl.searchParams;
    const data = await listPortalClasses({
        publicOnly: true,
        search: params.get("search") || undefined,
        level: params.get("level") || undefined,
    });
    return NextResponse.json({ data });
}
