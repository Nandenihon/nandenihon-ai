import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";

/**
 * Next.js Middleware — protects /dashboard/* routes
 * Redirects to login if no valid session cookie found
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

        // Inject user role into request header (available in server components/route handlers)
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-id", String(session.id));
        requestHeaders.set("x-user-role", session.role);
        requestHeaders.set("x-user-name", session.name);

        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // If already logged in and trying to access login page, redirect to dashboard
    if (pathname === "/") {
        const token = request.cookies.get(COOKIE_NAME)?.value;
        if (token) {
            const session = await verifyToken(token);
            if (session) {
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/dashboard/:path*"],
};
