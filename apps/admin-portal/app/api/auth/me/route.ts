import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";

/**
 * GET /api/auth/me
 * Return current user session from JWT cookie
 */
export async function GET(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session) {
        return NextResponse.json({ error: "Sesi tidak valid atau sudah berakhir" }, { status: 401 });
    }

    return NextResponse.json({ user: session });
}
