import { NextRequest } from "next/server";
import { COOKIE_NAME, verifyToken } from "./auth";

export async function requireEnrollmentActor(request: NextRequest, roles: string[]) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifyToken(token) : null;
    return session && roles.includes(session.role) ? session : null;
}

export const CLASS_MANAGER_ROLES = ["super_admin", "admin", "admin-class", "teacher"];
export const REVIEWER_ROLES = ["super_admin", "admin", "admin-class"];
