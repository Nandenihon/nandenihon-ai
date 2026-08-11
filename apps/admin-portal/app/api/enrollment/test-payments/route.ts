import { NextRequest, NextResponse } from "next/server";
import { listPendingPayments } from "@repo/database";
import { REVIEWER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

export async function GET(request: NextRequest) {
    const actor = await requireEnrollmentActor(request, REVIEWER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    return NextResponse.json({ data: await listPendingPayments() });
}
