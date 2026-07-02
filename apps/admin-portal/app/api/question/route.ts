import { NextRequest, NextResponse } from "next/server";
import {
    ensureQuizTables,
    queryMySQL,
    type ResultSetHeader,
    type RowDataPacket,
} from "@repo/database";

const DEFAULT_PAGE_SIZE = 10;
const VALID_LEVELS = new Set(["N5", "N4"]);

interface QuestionRow extends RowDataPacket {
    id: number;
    text: string;
    options: string;
    correct_answer: string;
    time_limit: number;
    category: string | null;
    level: "N5" | "N4";
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
    const timeLimit = Number(body.timeLimit ?? 30);
    const category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : null;
    const level = typeof body.level === "string" ? body.level : "";

    if (!text) return { error: "text wajib diisi" };
    if (options.length === 0 || options.some((option) => typeof option !== "string" || !option.trim())) {
        return { error: "options wajib berupa array string" };
    }
    if (!correctAnswer) return { error: "correctAnswer wajib diisi" };
    if (!options.includes(correctAnswer)) return { error: "correctAnswer harus ada di options" };
    if (!Number.isInteger(timeLimit) || timeLimit < 1) return { error: "timeLimit harus angka positif" };
    if (!VALID_LEVELS.has(level)) return { error: "level harus N5 atau N4" };

    return {
        data: {
            text,
            options: options.map((option) => String(option).trim()),
            correctAnswer,
            timeLimit,
            category,
            level,
        },
    };
}

export async function GET(request: NextRequest) {
    try {
        await ensureQuizTables();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);
        const offset = (page - 1) * limit;
        const search = searchParams.get("search") || "";
        const level = searchParams.get("level") || "";
        const category = searchParams.get("category") || "";

        const where: string[] = [];
        const params: unknown[] = [];

        if (search) {
            where.push("(text LIKE ? OR category LIKE ?)");
            params.push(`%${search}%`, `%${search}%`);
        }
        if (VALID_LEVELS.has(level)) {
            where.push("level = ?");
            params.push(level);
        }
        if (category) {
            where.push("category = ?");
            params.push(category);
        }

        const whereSql = where.length > 0 ? ` WHERE ${where.join(" AND ")}` : "";
        const countResult = await queryMySQL<RowDataPacket[]>(
            `SELECT COUNT(*) AS total FROM questions${whereSql}`,
            params
        );
        const total = countResult[0]?.total || 0;

        const rows = await queryMySQL<QuestionRow[]>(
            `SELECT * FROM questions${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return NextResponse.json({
            data: rows.map(mapQuestion),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        console.error("Error fetching questions:", error);
        return NextResponse.json({ error: "Gagal mengambil data soal", details }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await ensureQuizTables();

        const validation = validateQuestionPayload(await request.json());
        if ("error" in validation) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const { text, options, correctAnswer, timeLimit, category, level } = validation.data;
        const result = await queryMySQL<ResultSetHeader>(
            `INSERT INTO questions (text, options, correct_answer, time_limit, category, level)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [text, JSON.stringify(options), correctAnswer, timeLimit, category, level]
        );

        const rows = await queryMySQL<QuestionRow[]>("SELECT * FROM questions WHERE id = ?", [result.insertId]);
        return NextResponse.json({ data: mapQuestion(rows[0]) }, { status: 201 });
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        console.error("Error creating question:", error);
        return NextResponse.json({ error: "Gagal membuat soal", details }, { status: 500 });
    }
}
