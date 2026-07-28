import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, resolvePreStudentId, type RowDataPacket } from "@repo/database";
import { COOKIE_MAX_AGE, COOKIE_NAME, signToken } from "@/app/lib/auth";
import { ensureProfileTable, getProfileSession } from "@/app/lib/student-profile";
import {
    ensureRegistrationTables,
} from "@/app/lib/registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JAPANESE_LEVELS = new Set(["BEGINNER", "N5", "N4", "N3", "N2", "N1"]);

async function getDisplayColumn() {
    const columns = await queryMySQL<RowDataPacket[]>("SHOW COLUMNS FROM users");
    const names = new Set(columns.map((column) => String(column.Field)));
    return names.has("name") ? "name" : names.has("username") ? "username" : null;
}

function getProxiedAvatarUrl(value: unknown) {
    const avatarUrl = typeof value === "string" ? value.trim() : "";
    if (!avatarUrl || avatarUrl.startsWith("/")) return avatarUrl || null;
    try {
        const url = new URL(avatarUrl);
        if (!url.hostname.endsWith(".r2.dev") && !url.hostname.endsWith(".r2.cloudflarestorage.com")) return avatarUrl;
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts[0] === "dev" || parts[0] === "prod") parts.shift();
        return parts.length ? `/uploads/${parts.join("/")}` : null;
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getProfileSession(request);
        if (!session || session.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const preStudentId = await resolvePreStudentId(session.id, session.email);
        if (preStudentId) {
            await ensureRegistrationTables();
            const rows = await queryMySQL<RowDataPacket[]>(
                `SELECT id, full_name AS name, nickname, email, phone_number AS phone,
                        domicile, motivation, japanese_level, avatar_url, created_at
                 FROM pre_students
                 WHERE id = ? AND registration_completed_at IS NOT NULL LIMIT 1`,
                [preStudentId]
            );
            if (!rows[0]) return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 });
            return NextResponse.json({
                profile: { ...rows[0], avatar_url: getProxiedAvatarUrl(rows[0].avatar_url) },
            });
        }

        await ensureProfileTable();
        const displayColumn = await getDisplayColumn();
        const displaySelect = displayColumn ? `u.\`${displayColumn}\`` : "NULL";
        const rows = await queryMySQL<RowDataPacket[]>(
            `SELECT u.id, ${displaySelect} AS name, ${displaySelect} AS nickname, u.email, u.created_at,
                    p.phone, p.bio AS motivation, p.avatar_url
             FROM users u LEFT JOIN student_profiles p ON p.user_id = u.id
             WHERE u.id = ? LIMIT 1`,
            [session.id]
        );
        if (!rows[0]) return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 });
        return NextResponse.json({ profile: { ...rows[0], avatar_url: getProxiedAvatarUrl(rows[0].avatar_url) } });
    } catch (error) {
        console.error("Get student profile error:", error);
        return NextResponse.json({ error: "Gagal memuat profil" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getProfileSession(request);
        if (!session || session.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const body = await request.json();
        const name = String(body.name ?? "").trim();
        const nickname = String(body.nickname ?? "").trim();
        const phone = String(body.phone ?? "").trim();
        const domicile = String(body.domicile ?? "").trim();
        const motivation = String(body.motivation ?? body.bio ?? "").trim();
        const japaneseLevel = String(body.japaneseLevel ?? "").toUpperCase();

        if (name.length < 2 || name.length > 255) return NextResponse.json({ error: "Nama lengkap harus terdiri dari 2–255 karakter" }, { status: 400 });
        if (nickname.length < 1 || nickname.length > 100) return NextResponse.json({ error: "Nama panggilan wajib diisi" }, { status: 400 });
        if (phone.length > 30 || (phone && !/^[+\d][\d\s()-]+$/.test(phone))) return NextResponse.json({ error: "Nomor telepon tidak valid" }, { status: 400 });
        if (motivation.length > 2000) return NextResponse.json({ error: "Motivasi maksimal 2000 karakter" }, { status: 400 });

        const preStudentId = await resolvePreStudentId(session.id, session.email);
        if (preStudentId) {
            if (domicile.length < 2 || domicile.length > 255) return NextResponse.json({ error: "Domisili wajib diisi" }, { status: 400 });
            if (motivation.length < 10) return NextResponse.json({ error: "Motivasi minimal 10 karakter" }, { status: 400 });
            if (!JAPANESE_LEVELS.has(japaneseLevel)) return NextResponse.json({ error: "Level bahasa Jepang tidak valid" }, { status: 400 });
            await queryMySQL(
                `UPDATE pre_students
                 SET full_name = ?, nickname = ?, phone_number = ?, domicile = ?, motivation = ?, japanese_level = ?
                 WHERE id = ?`,
                [name, nickname, phone, domicile, motivation, japaneseLevel, preStudentId]
            );
        } else {
            await ensureProfileTable();
            const displayColumn = await getDisplayColumn();
            if (displayColumn) await queryMySQL(`UPDATE users SET \`${displayColumn}\` = ? WHERE id = ?`, [name, session.id]);
            await queryMySQL(
                `INSERT INTO student_profiles (user_id, phone, bio) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE phone = VALUES(phone), bio = VALUES(bio)`,
                [session.id, phone || null, motivation || null]
            );
        }

        const updatedSession = { ...session, name: nickname };
        const response = NextResponse.json({
            message: "Profil berhasil diperbarui",
            profile: { name, nickname, email: session.email, phone, domicile, motivation, japanese_level: japaneseLevel },
        });
        response.cookies.set(COOKIE_NAME, await signToken(updatedSession), {
            httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: COOKIE_MAX_AGE, path: "/",
        });
        return response;
    } catch (error) {
        console.error("Update student profile error:", error);
        return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
    }
}
