import { NextRequest } from "next/server";
import { resolvePreStudentId } from "@repo/database";
import { COOKIE_NAME, verifyToken } from "./auth";

export async function requireStudent(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifyToken(token) : null;
    if (!session || session.role !== "student") return null;
    return session;
}

export async function requireCandidate(request: NextRequest) {
    const session = await requireStudent(request);
    if (!session) return null;
    const preStudentId = await resolvePreStudentId(session.id, session.email);
    return preStudentId ? { session, preStudentId } : null;
}
