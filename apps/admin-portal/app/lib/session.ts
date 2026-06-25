import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "./auth";
import type { UserSession } from "@repo/types";

/**
 * Get current user session from cookie (Server Component / Route Handler use)
 * Returns null if not authenticated
 */
export async function getSession(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
}


/**
 * Check if user has sufficient role
 */
export function hasRole(session: UserSession | null, roles: string[]): boolean {
    if (!session) return false;
    return roles.includes(session.role);
}

/**
 * Roles that can perform write operations (create/update/delete)
 */
export const WRITE_ROLES = ["super_admin", "admin"];

/**
 * Roles that have admin-level full access
 */
export const ADMIN_ROLES = ["super_admin", "admin"];
