import { NextRequest } from "next/server";
import { resolvePreStudentId } from "@repo/database";
import { COOKIE_NAME, verifyToken } from "./auth";

async function getPortalSession(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifyToken(token) : null;
    if (!session || (session.role !== "student" && session.role !== "pre_student")) return null;
    return session;
}

export async function requireStudent(request: NextRequest) {
    const session = await getPortalSession(request);
    return session?.role === "student" ? session : null;
}

export async function requirePreStudent(request: NextRequest) {
    const session = await getPortalSession(request);
    return session?.role === "pre_student" ? session : null;
}

/** Either role, for routes shared by pre-students and full students (profile, notifications). */
export async function requirePortalUser(request: NextRequest) {
    return getPortalSession(request);
}

export async function requireCandidate(request: NextRequest) {
    const session = await getPortalSession(request);
    if (!session) return null;
    const preStudentId = await resolvePreStudentId(session.id, session.email);
    return preStudentId ? { session, preStudentId } : null;
}
