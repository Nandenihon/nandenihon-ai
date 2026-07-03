import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ user: null }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ user: null }, { status: 401 });
    return NextResponse.json({ user: session });
}
