import { NextRequest, NextResponse } from "next/server";
import { listAvailableTeachers } from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

export async function GET(request: NextRequest) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    return NextResponse.json({
        data: await listAvailableTeachers(request.nextUrl.searchParams.get("search") || undefined),
    });
}
