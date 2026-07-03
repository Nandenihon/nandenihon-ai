import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";
import { ensureLmsTables, getStudentDashboard } from "@repo/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard
 * Returns aggregated dashboard data for the authenticated student.
 */
export async function GET(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session || session.role !== "student") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await ensureLmsTables();
        const data = await getStudentDashboard(session.id);
        return NextResponse.json(data);
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("Dashboard error:", error);
        return NextResponse.json({ error: "Gagal memuat dashboard", details: msg }, { status: 500 });
    }
}
