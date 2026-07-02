import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";

/**
 * Next.js Middleware — protects /dashboard/* routes
 * - admin / super_admin  → /dashboard  (full access)
 * - teacher              → /dashboard/lecturer (lecturer-only pages)
 * - student              → redirected to login (students use student-portal)
 * Redirects to login if no valid session cookie found.
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect all dashboard routes
    if (pathname.startsWith("/dashboard")) {
        const token = request.cookies.get(COOKIE_NAME)?.value;

        if (!token) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        const session = await verifyToken(token);
        if (!session) {
            // Token expired or invalid — clear cookie and redirect
            const response = NextResponse.redirect(new URL("/", request.url));
            response.cookies.delete(COOKIE_NAME);
            return response;
        }

        // Students have no access to admin portal
        if (session.role === "student") {
            const response = NextResponse.redirect(new URL("/", request.url));
            response.cookies.delete(COOKIE_NAME);
            return response;
        }

        // Teachers can ONLY access /dashboard/lecturer/*
        if (session.role === "teacher") {
            const isLecturerPath = pathname.startsWith("/dashboard/lecturer");
            if (!isLecturerPath) {
                return NextResponse.redirect(new URL("/dashboard/lecturer", request.url));
            }
        }

        // Inject user info into request headers (available in server components/route handlers)
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-id", String(session.id));
        requestHeaders.set("x-user-role", session.role);
        requestHeaders.set("x-user-name", session.name);

        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // If already logged in and trying to access login page, redirect by role
    if (pathname === "/") {
        const token = request.cookies.get(COOKIE_NAME)?.value;
        if (token) {
            const session = await verifyToken(token);
            if (session) {
                if (session.role === "teacher") {
                    return NextResponse.redirect(new URL("/dashboard/lecturer", request.url));
                }
                if (session.role !== "student") {
                    return NextResponse.redirect(new URL("/dashboard", request.url));
                }
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/dashboard/:path*"],
};
