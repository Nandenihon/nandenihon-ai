import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type ResultSetHeader } from "@repo/database";
import { COOKIE_MAX_AGE, COOKIE_NAME, signToken } from "@/app/lib/auth";
import {
    REGISTRATION_COOKIE_NAME,
    ensurePreStudentUserId,
    ensureRegistrationTables,
    findPreStudentByEmail,
    hashPassword,
    verifyRegistrationToken,
} from "@/app/lib/registration";

const JAPANESE_LEVELS = new Set(["BEGINNER", "N5", "N4", "N3", "N2", "N1"]);

export async function POST(request: NextRequest) {
    try {
        const registration = verifyRegistrationToken(request.cookies.get(REGISTRATION_COOKIE_NAME)?.value ?? "");
        if (!registration) return NextResponse.json({ error: "Sesi verifikasi berakhir. Verifikasi email kembali." }, { status: 401 });

        const body = await request.json();
        const fullName = String(body.fullName ?? "").trim();
        const nickname = String(body.nickname ?? "").trim();
        const phoneNumber = String(body.phoneNumber ?? "").trim();
        const domicile = String(body.domicile ?? "").trim();
        const motivation = String(body.motivation ?? "").trim();
        const japaneseLevel = String(body.japaneseLevel ?? "").toUpperCase();
        const password = String(body.password ?? "");
        const passwordConfirmation = String(body.passwordConfirmation ?? "");

        if (fullName.length < 2 || fullName.length > 255) return NextResponse.json({ error: "Nama lengkap tidak valid" }, { status: 400 });
        if (nickname.length < 1 || nickname.length > 100) return NextResponse.json({ error: "Nama panggilan wajib diisi" }, { status: 400 });
        if (!/^[0-9+().\s-]{7,30}$/.test(phoneNumber)) return NextResponse.json({ error: "Nomor telepon tidak valid" }, { status: 400 });
        if (domicile.length < 2 || domicile.length > 255) return NextResponse.json({ error: "Domisili wajib diisi" }, { status: 400 });
        if (motivation.length < 10 || motivation.length > 2000) return NextResponse.json({ error: "Motivasi harus terdiri dari 10–2000 karakter" }, { status: 400 });
        if (!JAPANESE_LEVELS.has(japaneseLevel)) return NextResponse.json({ error: "Level bahasa Jepang tidak valid" }, { status: 400 });
        if (password.length < 8 || password.length > 128) return NextResponse.json({ error: "Password harus terdiri dari 8–128 karakter" }, { status: 400 });
        if (password !== passwordConfirmation) return NextResponse.json({ error: "Konfirmasi password tidak sama" }, { status: 400 });

        await ensureRegistrationTables();
        const preStudent = await findPreStudentByEmail(registration.email);
        if (!preStudent || preStudent.id !== registration.preStudentId || !preStudent.email_verified_at) {
            return NextResponse.json({ error: "Email belum diverifikasi" }, { status: 403 });
        }
        if (preStudent.registration_completed_at) {
            return NextResponse.json({ error: "Pendaftaran sudah diselesaikan. Silakan login." }, { status: 409 });
        }

        const passwordHash = hashPassword(password);
        const result = await queryMySQL<ResultSetHeader>(
            `UPDATE pre_students
             SET full_name = ?, nickname = ?, phone_number = ?, domicile = ?, motivation = ?,
                 japanese_level = ?, password_hash = ?, registration_completed_at = CURRENT_TIMESTAMP
             WHERE id = ? AND registration_completed_at IS NULL`,
            [fullName, nickname, phoneNumber, domicile, motivation, japaneseLevel, passwordHash, preStudent.id]
        );
        if (result.affectedRows !== 1) return NextResponse.json({ error: "Pendaftaran sudah diselesaikan" }, { status: 409 });

        const userId = await ensurePreStudentUserId({
            preStudentId: preStudent.id,
            nickname,
            email: preStudent.email,
            passwordHash,
        });

        const session = {
            id: userId,
            name: nickname,
            email: preStudent.email,
            role: "pre_student" as const,
        };
        const response = NextResponse.json({ message: "Pendaftaran berhasil", user: session });
        response.cookies.set(COOKIE_NAME, await signToken(session), {
            httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: COOKIE_MAX_AGE, path: "/",
        });
        response.cookies.delete(REGISTRATION_COOKIE_NAME);
        return response;
    } catch (error) {
        console.error("Complete registration error:", error);
        return NextResponse.json({ error: "Pendaftaran gagal. Coba lagi nanti." }, { status: 500 });
    }
}
