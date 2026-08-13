import { queryMySQL, type ResultSetHeader, type RowDataPacket } from "./mysql-connection";

// "N5"/"N4" are kept for the legacy public landing-site quiz (apps/landing/app/class/*),
// which still only ever passes those two literal levels. The other three are the
// canonical levels used by the admin question bank / class-linked test flow.
export type QuizLevel = "N5" | "N4" | "N5 Basic" | "N5 Intermediate" | "N5 Advanced";

export interface QuizQuestion {
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
    points: number;
    timeLimit: number;
    category: string | null;
    level: QuizLevel;
    createdAt: Date;
    updatedAt: Date;
}

interface QuestionRow extends RowDataPacket {
    id: number;
    text: string;
    options: string;
    correct_answer: string;
    points: number;
    time_limit: number;
    category: string | null;
    level: QuizLevel;
    created_at: Date;
    updated_at: Date;
}

export function isValidNumericId(id: string): boolean {
    return /^[1-9]\d*$/.test(id);
}

function parseNumericId(id: string): number {
    if (!isValidNumericId(id)) {
        throw new Error("Invalid numeric ID");
    }
    return Number(id);
}

function mapQuestion(row: QuestionRow): QuizQuestion {
    let options: string[] = [];
    try {
        options = JSON.parse(row.options);
    } catch {
        options = [];
    }

    return {
        id: row.id,
        text: row.text,
        options,
        correctAnswer: row.correct_answer,
        points: Number(row.points ?? 1),
        timeLimit: row.time_limit,
        category: row.category,
        level: row.level,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

let quizTablesEnsured = false;

export async function ensureQuizTables(): Promise<void> {
    if (quizTablesEnsured) return;
    const pointsColumn = await queryMySQL<RowDataPacket[]>("SHOW COLUMNS FROM questions LIKE 'points'");
    if (pointsColumn.length === 0) {
        await queryMySQL("ALTER TABLE questions ADD COLUMN points INT UNSIGNED NOT NULL DEFAULT 1 AFTER correct_answer");
    }
    const levelColumn = await queryMySQL<RowDataPacket[]>("SHOW COLUMNS FROM questions LIKE 'level'");
    if (levelColumn[0] && String(levelColumn[0].Type).toLowerCase().startsWith("enum")) {
        await queryMySQL("ALTER TABLE questions MODIFY COLUMN level VARCHAR(50) NOT NULL");
    }
    quizTablesEnsured = true;
}

export async function findQuestionById(questionId: string | number): Promise<QuizQuestion | null> {
    await ensureQuizTables();
    const id = typeof questionId === "number" ? questionId : parseNumericId(questionId);
    const rows = await queryMySQL<QuestionRow[]>("SELECT * FROM questions WHERE id = ? LIMIT 1", [id]);
    return rows[0] ? mapQuestion(rows[0]) : null;
}

export async function findRandomUnansweredQuestion(
    level: QuizLevel,
    answeredQuestionIds: number[]
): Promise<QuizQuestion | null> {
    await ensureQuizTables();
    const params: unknown[] = [level];
    let sql = "SELECT * FROM questions WHERE level = ?";

    if (answeredQuestionIds.length > 0) {
        sql += ` AND id NOT IN (${answeredQuestionIds.map(() => "?").join(", ")})`;
        params.push(...answeredQuestionIds);
    }

    sql += " ORDER BY RAND() LIMIT 1";
    const rows = await queryMySQL<QuestionRow[]>(sql, params);
    return rows[0] ? mapQuestion(rows[0]) : null;
}

export async function replaceQuestions(questions: Array<{
    text: string;
    options: string[];
    correctAnswer: string;
    points?: number;
    timeLimit: number;
    category?: string;
    level: QuizLevel;
}>): Promise<number> {
    await ensureQuizTables();
    await queryMySQL("DELETE FROM questions");

    for (const question of questions) {
        await queryMySQL<ResultSetHeader>(
            `INSERT INTO questions (text, options, correct_answer, points, time_limit, category, level)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                question.text,
                JSON.stringify(question.options),
                question.correctAnswer,
                question.points ?? 1,
                question.timeLimit,
                question.category || null,
                question.level,
            ]
        );
    }

    return questions.length;
}

/** Appends questions to the bank without touching existing rows (unlike replaceQuestions). */
export async function insertQuestions(questions: Array<ParsedQuizQuestionInput & { level: QuizLevel }>): Promise<number> {
    await ensureQuizTables();
    for (const question of questions) {
        await queryMySQL<ResultSetHeader>(
            `INSERT INTO questions (text, options, correct_answer, points, time_limit, category, level)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                question.text,
                JSON.stringify(question.options),
                question.correctAnswer,
                question.points,
                question.timeLimit,
                question.category || null,
                question.level,
            ]
        );
    }
    return questions.length;
}

const CORRECT_OPTIONS = ["A", "B", "C", "D"] as const;
const REQUIRED_CSV_HEADERS = ["question", "option_a", "option_b", "option_c", "option_d", "correct_option"];

export interface ParsedQuizQuestionInput {
    text: string;
    options: string[];
    correctAnswer: string;
    points: number;
    timeLimit: number;
    category?: string;
}

export interface ParsedQuizQuestionFile {
    questions: ParsedQuizQuestionInput[];
    errors: string[];
}

function parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"') {
                if (line[i + 1] === '"') { current += '"'; i += 1; } else { inQuotes = false; }
            } else {
                current += char;
            }
        } else if (char === '"') {
            inQuotes = true;
        } else if (char === ",") {
            cells.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    cells.push(current);
    return cells.map((cell) => cell.trim());
}

/**
 * CSV format (UTF-8, header row required; prepare in Excel then "Save As" .csv):
 * question,option_a,option_b,option_c,option_d,correct_option,points,time_limit,category
 * `points`, `time_limit`, and `category` are optional (default 1, 30, empty).
 */
export function parseQuestionCsv(content: string): ParsedQuizQuestionFile {
    const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((line) => line.trim().length > 0);
    if (lines.length === 0) return { questions: [], errors: ["File kosong"] };

    const header = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase());
    const missingHeaders = REQUIRED_CSV_HEADERS.filter((name) => !header.includes(name));
    if (missingHeaders.length) {
        return { questions: [], errors: [`Header wajib tidak ditemukan: ${missingHeaders.join(", ")}`] };
    }

    const columnIndex = (name: string) => header.indexOf(name);
    const questions: ParsedQuizQuestionInput[] = [];
    const errors: string[] = [];

    for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
        const cells = parseCsvLine(lines[rowIndex]);
        const rowLabel = `Baris ${rowIndex + 1}`;
        const text = cells[columnIndex("question")] ?? "";
        const options = ["option_a", "option_b", "option_c", "option_d"].map((name) => cells[columnIndex(name)] ?? "");
        const correctAnswer = (cells[columnIndex("correct_option")] ?? "").toUpperCase();
        const pointsIndex = columnIndex("points");
        const pointsRaw = pointsIndex >= 0 ? cells[pointsIndex] : "";
        const points = pointsRaw && Number.isFinite(Number(pointsRaw)) ? Number(pointsRaw) : 1;
        const timeLimitIndex = columnIndex("time_limit");
        const timeLimitRaw = timeLimitIndex >= 0 ? cells[timeLimitIndex] : "";
        const timeLimit = timeLimitRaw && Number.isFinite(Number(timeLimitRaw)) ? Number(timeLimitRaw) : 30;
        const categoryIndex = columnIndex("category");
        const category = categoryIndex >= 0 ? cells[categoryIndex] : "";

        if (!text.trim()) { errors.push(`${rowLabel}: kolom question kosong`); continue; }
        if (options.some((option) => !option.trim())) { errors.push(`${rowLabel}: salah satu opsi jawaban kosong`); continue; }
        if (!CORRECT_OPTIONS.includes(correctAnswer as (typeof CORRECT_OPTIONS)[number])) {
            errors.push(`${rowLabel}: correct_option harus A, B, C, atau D`);
            continue;
        }
        questions.push({ text, options, correctAnswer, points, timeLimit, category: category || undefined });
    }

    return { questions, errors };
}
