import { NextRequest, NextResponse } from "next/server";
import {
    ensureQuizTables,
    isValidNumericId,
    queryMySQL,
    type ResultSetHeader,
    type RowDataPacket,
} from "@repo/database";
import { CLASS_MANAGER_ROLES, requireEnrollmentActor } from "@/app/lib/enrollment-auth";

const VALID_LEVELS = new Set(["N5 Basic", "N5 Menengah", "N5 Lanjutan", "N4"]);

interface QuestionRow extends RowDataPacket {
    id: number;
    text: string;
    options: string;
    correct_answer: string;
    points: number;
    time_limit: number;
    category: string | null;
    level: string;
    created_at: Date;
    updated_at: Date;
}

function parseOptions(raw: unknown): string[] {
    if (!raw) return [];
    // mysql2 may auto-parse JSON columns → already an array
    if (Array.isArray(raw)) return raw.map(String);
    const str = typeof raw === "string" ? raw : JSON.stringify(raw);
    try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
        // Legacy: comma-separated plain string
        return str.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
}

function mapQuestion(row: QuestionRow) {
    return {
        id: row.id,
        text: row.text,
        options: parseOptions(row.options),
        correctAnswer: row.correct_answer,
        points: Number(row.points ?? 1),
        timeLimit: row.time_limit,
        category: row.category,
        level: row.level,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function validateQuestionPayload(body: Record<string, unknown>) {
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const options = Array.isArray(body.options) ? body.options : [];
    const correctAnswer = typeof body.correctAnswer === "string" ? body.correctAnswer.trim() : "";
    const points = Number(body.points ?? 1);
    const timeLimit = Number(body.timeLimit ?? 30);
    const category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : null;
    const level = typeof body.level === "string" ? body.level : "";

    if (!text) return { error: "text wajib diisi" };
    if (options.length === 0 || options.some((option) => typeof option !== "string" || !option.trim())) {
        return { error: "options wajib berupa array string" };
    }
    if (!correctAnswer) return { error: "correctAnswer wajib diisi" };
    if (!options.includes(correctAnswer)) return { error: "correctAnswer harus ada di options" };
    if (!Number.isInteger(points) || points < 1) return { error: "points harus angka positif" };
    if (!Number.isInteger(timeLimit) || timeLimit < 1) return { error: "timeLimit harus angka positif" };
    if (!VALID_LEVELS.has(level)) return { error: `level harus salah satu dari: ${[...VALID_LEVELS].join(", ")}` };

    return {
        data: {
            text,
            options: options.map((option) => String(option).trim()),
            correctAnswer,
            points,
            timeLimit,
            category,
            level,
        },
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    try {
        await ensureQuizTables();

        const { id } = await params;
        if (!isValidNumericId(id)) {
            return NextResponse.json({ error: "ID soal tidak valid" }, { status: 400 });
        }

        const rows = await queryMySQL<QuestionRow[]>("SELECT * FROM questions WHERE id = ? LIMIT 1", [id]);
        if (rows.length === 0) {
            return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 });
        }

        return NextResponse.json({ data: mapQuestion(rows[0]) });
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        console.error("Error fetching question:", error);
        return NextResponse.json({ error: "Gagal mengambil data soal", details }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    try {
        await ensureQuizTables();

        const { id } = await params;
        if (!isValidNumericId(id)) {
            return NextResponse.json({ error: "ID soal tidak valid" }, { status: 400 });
        }

        const validation = validateQuestionPayload(await request.json());
        if ("error" in validation) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const { text, options, correctAnswer, points, timeLimit, category, level } = validation.data;
        const result = await queryMySQL<ResultSetHeader>(
            `UPDATE questions
             SET text = ?,
                 options = ?,
                 correct_answer = ?,
                 points = ?,
                 time_limit = ?,
                 category = ?,
                 level = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [text, JSON.stringify(options), correctAnswer, points, timeLimit, category, level, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 });
        }

        const rows = await queryMySQL<QuestionRow[]>("SELECT * FROM questions WHERE id = ? LIMIT 1", [id]);
        return NextResponse.json({ data: mapQuestion(rows[0]) });
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        console.error("Error updating question:", error);
        return NextResponse.json({ error: "Gagal memperbarui soal", details }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const actor = await requireEnrollmentActor(request, CLASS_MANAGER_ROLES);
    if (!actor) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    try {
        await ensureQuizTables();

        const { id } = await params;
        if (!isValidNumericId(id)) {
            return NextResponse.json({ error: "ID soal tidak valid" }, { status: 400 });
        }

        const result = await queryMySQL<ResultSetHeader>("DELETE FROM questions WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        console.error("Error deleting question:", error);
        return NextResponse.json({ error: "Gagal menghapus soal", details }, { status: 500 });
    }
}
