import { NextRequest, NextResponse } from "next/server";
import { findPortalClass } from "@repo/database";
import { requireCandidate } from "@/app/lib/enrollment-auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
    const candidate = await requireCandidate(request);
    if (!candidate) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const data = await findPortalClass(Number((await context.params).id));
    if (!data || data.status !== "published" || data.enrollment_closed) {
        return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data });
}
