import { NextRequest, NextResponse } from "next/server";
import { getAcademicReport } from "@repo/database";
import { requireEnrollmentActor } from "@/app/lib/enrollment-auth";

export async function GET(request: NextRequest) {
    const actor = await requireEnrollmentActor(request, ["super_admin", "admin"]);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    return NextResponse.json({ data: await getAcademicReport() });
}
