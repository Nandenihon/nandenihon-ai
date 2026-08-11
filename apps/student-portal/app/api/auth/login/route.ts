import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/app/lib/auth";
import crypto from "crypto";
import {
    ensurePreStudentUserId,
    ensureRegistrationTables,
    findPreStudentByEmail,
    findUserRoleById,
    normalizeEmail,
    passwordMatches,
} from "@/app/lib/registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function md5(str: string): string {
    return crypto.createHash("md5").update(str).digest("hex");
}

/**
 * POST /api/auth/login
 * Authenticates a student or pre-student. Pre-student/student accounts verify
 * against `pre_students.password_hash`; legacy `users` rows fall back to MD5.
 * Only role = 'student' or 'pre_student' may log into this portal.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = normalizeEmail(body.email);
        const password = String(body.password ?? "");

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email dan password wajib diisi" },
                { status: 400 }
            );
        }

        await ensureRegistrationTables();
        const preStudent = await findPreStudentByEmail(email);
        if (preStudent?.registration_completed_at && preStudent.email_verified_at && preStudent.password_hash) {
            if (!passwordMatches(password, preStudent.password_hash)) {
                return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
            }

            // Accounts registered before the users-row-on-registration change may not
            // have promoted_user_id set yet — backfill it here on first login.
            const userId = preStudent.promoted_user_id
                || (await ensurePreStudentUserId({
                    preStudentId: preStudent.id,
                    nickname: preStudent.nickname || preStudent.full_name,
                    email: preStudent.email,
                    passwordHash: preStudent.password_hash,
                }));
            const role = (await findUserRoleById(userId)) === "student" ? "student" : "pre_student";

            const session = {
                id: userId,
                name: preStudent.nickname || preStudent.full_name,
                email: preStudent.email,
                role: role as "student" | "pre_student",
            };
            const response = NextResponse.json({ user: session, message: "Login berhasil" });
            response.cookies.set(COOKIE_NAME, await signToken(session), {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: COOKIE_MAX_AGE,
                path: "/",
            });
            return response;
        }

        // Legacy student accounts remain readable during the migration period.
        const users = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (!users || users.length === 0) {
            return NextResponse.json(
                { error: "Email atau password salah" },
                { status: 401 }
            );
        }

        const user = users[0];

        // Only students may log into the student portal
        if (user.role !== "student") {
            return NextResponse.json(
                { error: "Akun ini bukan akun siswa" },
                { status: 403 }
            );
        }

        if (user.is_active === 0 || user.is_active === false) {
            return NextResponse.json(
                { error: "Akun tidak aktif. Hubungi admin." },
                { status: 403 }
            );
        }

        const hashedInput = md5(password);
        if (user.password !== hashedInput) {
            return NextResponse.json(
                { error: "Email atau password salah" },
                { status: 401 }
            );
        }

        const session = {
            id: user.id,
            name: user.name || user.username || user.display_name || user.full_name || "Siswa",
            email: user.email,
            role: "student" as const,
        };

        const token = await signToken(session);

        const response = NextResponse.json({
            user: session,
            message: "Login berhasil",
        });

        response.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: COOKIE_MAX_AGE,
            path: "/",
        });

        return response;
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("Student login error:", error);
        return NextResponse.json(
            process.env.NODE_ENV === "production"
                ? { error: "Terjadi kesalahan server" }
                : { error: "Terjadi kesalahan server", details: msg },
            { status: 500 }
        );
    }
}
