import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";

// Pre-students only get access to the admission test flow: pick a class, take
// its test, review history, and pay once passed. Everything else in the
// dashboard (courses, grades, forum, ...) requires the full 'student' role.
const PRE_STUDENT_ALLOWED_PATHS = ["/dashboard/class-catalog", "/dashboard/tests", "/dashboard/payment", "/dashboard/profile", "/dashboard/settings"];

function isAllowedForPreStudent(pathname: string): boolean {
    if (pathname === "/dashboard") return true;
    return PRE_STUDENT_ALLOWED_PATHS.some((allowed) => pathname === allowed || pathname.startsWith(`${allowed}/`));
}

/**
 * Student Portal Middleware
 * - Protects /dashboard/* — must be logged in as 'student' or 'pre_student'
 * - Restricts 'pre_student' sessions to the admission test/payment routes
 * - Redirects already-logged-in users away from /login
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

        // Only students and pre-students can use this portal
        if (session.role !== "student" && session.role !== "pre_student") {
            const response = NextResponse.redirect(new URL("/login", request.url));
            response.cookies.delete(COOKIE_NAME);
            return response;
        }

        if (session.role === "pre_student" && !isAllowedForPreStudent(pathname)) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        // Inject identity into headers for server components
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-id", String(session.id));
        requestHeaders.set("x-user-role", session.role);
        requestHeaders.set("x-user-name", session.name);

        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Already logged in → skip login page
    if (pathname === "/login" || pathname === "/register" || pathname === "/") {
        const token = request.cookies.get(COOKIE_NAME)?.value;
        if (token) {
            const session = await verifyToken(token);
            if (session && (session.role === "student" || session.role === "pre_student")) {
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/login", "/register", "/dashboard/:path*"],
};
