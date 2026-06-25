import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/app/lib/auth";

/**
 * POST /api/auth/logout
 * Clear session cookie
 */
export async function POST() {
    const response = NextResponse.json({ message: "Logout berhasil" });
    response.cookies.set(COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
    });
    return response;
}
