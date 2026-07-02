import { NextRequest, NextResponse } from "next/server";
import {
    createCounselingRegistration,
    VALID_EDUCATION_LEVELS,
    VALID_TOPICS,
} from "@repo/database";

/**
 * POST /api/counseling
 * Register a new counseling session request.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            full_name,
            email,
            phone,
            birth_place,
            birth_date,
            domicile,
            last_education,
            topic,
            story,
            consultation_time,
        } = body;

        // --- Validate required fields ---
        const missing = [
            !full_name?.trim() && "Nama lengkap",
            !email?.trim() && "Email",
            !phone?.trim() && "Nomor handphone",
            !birth_place?.trim() && "Tempat lahir",
            !birth_date?.trim() && "Tanggal lahir",
            !domicile?.trim() && "Domisili",
            !last_education?.trim() && "Pendidikan terakhir",
            !topic?.trim() && "Tema",
            !story?.trim() && "Cerita",
            !consultation_time?.trim() && "Waktu konsultasi",
        ].filter(Boolean);

        if (missing.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Field berikut wajib diisi: ${missing.join(", ")}`,
                },
                { status: 400 }
            );
        }

        // --- Validate enum values ---
        if (!VALID_EDUCATION_LEVELS.includes(last_education)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Pendidikan terakhir tidak valid. Pilih salah satu: ${VALID_EDUCATION_LEVELS.join(", ")}`,
                },
                { status: 400 }
            );
        }

        if (!VALID_TOPICS.includes(topic)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Tema tidak valid. Pilih salah satu: ${VALID_TOPICS.join(", ")}`,
                },
                { status: 400 }
            );
        }

        // --- Basic email format check ---
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { success: false, error: "Format email tidak valid" },
                { status: 400 }
            );
        }

        const registration = await createCounselingRegistration({
            full_name: full_name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            birth_place: birth_place.trim(),
            birth_date,
            domicile: domicile.trim(),
            last_education,
            topic,
            story: story.trim(),
            consultation_time,
        });

        return NextResponse.json(
            {
                success: true,
                message: "Pendaftaran konseling berhasil! Tim kami akan menghubungi kamu segera.",
                data: {
                    id: registration.id,
                    full_name: registration.full_name,
                    email: registration.email,
                    topic: registration.topic,
                    consultation_time: registration.consultation_time,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Counseling registration error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Terjadi kesalahan server. Silakan coba lagi.",
                details: process.env.NODE_ENV !== "production" ? message : undefined,
            },
            { status: 500 }
        );
    }
}
