import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";

/**
 * Student Portal Middleware
 * - Protects /dashboard/* — must be logged in as 'student'
 * - Redirects already-logged-in students away from /login
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/dashboard")) {
        const token = request.cookies.get(COOKIE_NAME)?.value;

        if (!token) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        const session = await verifyToken(token);
        if (!session) {
            const response = NextResponse.redirect(new URL("/login", request.url));
            response.cookies.delete(COOKIE_NAME);
            return response;
        }

        // Only students can use this portal
        if (session.role !== "student") {
            const response = NextResponse.redirect(new URL("/login", request.url));
            response.cookies.delete(COOKIE_NAME);
            return response;
        }

        // Inject identity into headers for server components
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-id", String(session.id));
        requestHeaders.set("x-user-role", session.role);
        requestHeaders.set("x-user-name", session.name);

        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Already logged in → skip login page
    if (pathname === "/login" || pathname === "/") {
        const token = request.cookies.get(COOKIE_NAME)?.value;
        if (token) {
            const session = await verifyToken(token);
            if (session && session.role === "student") {
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/login", "/dashboard/:path*"],
};
