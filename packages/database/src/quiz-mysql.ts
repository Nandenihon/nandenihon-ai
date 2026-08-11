import { queryMySQL, type ResultSetHeader, type RowDataPacket } from "./mysql-connection";

export type TestStatus = "not_started" | "in_progress" | "completed";
export type PassStatus = "pending" | "passed" | "failed";
// "N5"/"N4" are kept for the legacy public landing-site quiz (apps/landing/app/class/*),
// which still only ever passes those two literal levels. The other three are the
// canonical levels used by the admin question bank / class-linked test flow.
export type QuizLevel = "N5" | "N4" | "N5 Basic" | "N5 Menengah" | "N5 Lanjutan";

export interface QuizAnswer {
    id: number;
    studentId: number;
    questionId: number;
    selectedValue: string | null;
    isCorrect: boolean;
    answeredAt: Date;
}

export interface QuizStudent {
    id: number;
    fullName: string;
    email: string;
    testStatus: TestStatus;
    passStatus: PassStatus;
    score: number;
    nickname: string | null;
    whatsapp: string | null;
    age: number | null;
    domicile: string | null;
    motivation: string | null;
    level: string | null;
    japaneseLevel: string | null;
    paymentProofUrl: string | null;
    registrationComplete: boolean;
    testStartedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    answerHistory: QuizAnswer[];
}

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

interface StudentRow extends RowDataPacket {
    id: number;
    full_name: string;
    email: string;
    test_status: TestStatus;
    pass_status: PassStatus;
    score: number;
    nickname: string | null;
    whatsapp: string | null;
    age: number | null;
    domicile: string | null;
    motivation: string | null;
    level: string | null;
    japanese_level: string | null;
    payment_proof_url: string | null;
    registration_complete: number;
    test_started_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

interface AnswerRow extends RowDataPacket {
    id: number;
    student_id: number;
    question_id: number;
    selected_value: string | null;
    is_correct: number;
    answered_at: Date;
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

function mapAnswer(row: AnswerRow): QuizAnswer {
    return {
        id: row.id,
        studentId: row.student_id,
        questionId: row.question_id,
        selectedValue: row.selected_value,
        isCorrect: Boolean(row.is_correct),
        answeredAt: row.answered_at,
    };
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

function mapStudent(row: StudentRow, answers: QuizAnswer[] = []): QuizStudent {
    return {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        testStatus: row.test_status,
        passStatus: row.pass_status,
        score: row.score,
        nickname: row.nickname,
        whatsapp: row.whatsapp,
        age: row.age,
        domicile: row.domicile,
        motivation: row.motivation,
        level: row.level,
        japaneseLevel: row.japanese_level,
        paymentProofUrl: row.payment_proof_url,
        registrationComplete: Boolean(row.registration_complete),
        testStartedAt: row.test_started_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        answerHistory: answers,
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

async function getAnswersByStudentId(studentId: number): Promise<QuizAnswer[]> {
    const rows = await queryMySQL<AnswerRow[]>(
        "SELECT * FROM student_answers WHERE student_id = ? ORDER BY answered_at ASC, id ASC",
        [studentId]
    );
    return rows.map(mapAnswer);
}

export async function findStudentById(studentId: string | number): Promise<QuizStudent | null> {
    await ensureQuizTables();
    const id = typeof studentId === "number" ? studentId : parseNumericId(studentId);
    const rows = await queryMySQL<StudentRow[]>("SELECT * FROM students WHERE id = ? LIMIT 1", [id]);
    if (rows.length === 0) {
        return null;
    }
    const answers = await getAnswersByStudentId(id);
    return mapStudent(rows[0], answers);
}

export async function findStudentByEmail(email: string): Promise<QuizStudent | null> {
    await ensureQuizTables();
    const rows = await queryMySQL<StudentRow[]>(
        "SELECT * FROM students WHERE email = ? LIMIT 1",
        [email.toLowerCase()]
    );
    if (rows.length === 0) {
        return null;
    }
    const answers = await getAnswersByStudentId(rows[0].id);
    return mapStudent(rows[0], answers);
}

export async function createStudent(input: {
    fullName: string;
    email: string;
    level: string;
    japaneseLevel: string;
    testStartedAt?: Date;
}): Promise<QuizStudent> {
    await ensureQuizTables();
    const result = await queryMySQL<ResultSetHeader>(
        `INSERT INTO students
            (full_name, email, level, japanese_level, test_status, pass_status, score, registration_complete, test_started_at)
         VALUES (?, ?, ?, ?, 'not_started', 'pending', 0, 0, ?)`,
        [input.fullName, input.email.toLowerCase(), input.level, input.japaneseLevel, input.testStartedAt || new Date()]
    );

    const student = await findStudentById(result.insertId);
    if (!student) {
        throw new Error("Failed to load created student");
    }
    return student;
}

export async function resetStudentForRetry(input: {
    id: number;
    level: string;
    japaneseLevel: string;
    testStartedAt?: Date;
}): Promise<void> {
    await ensureQuizTables();
    await queryMySQL("DELETE FROM student_answers WHERE student_id = ?", [input.id]);
    await queryMySQL(
        `UPDATE students
         SET test_status = 'not_started',
             pass_status = 'pending',
             score = 0,
             level = ?,
             japanese_level = ?,
             test_started_at = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [input.level, input.japaneseLevel, input.testStartedAt || new Date(), input.id]
    );
}

export async function completeStudentRegistration(input: {
    id: number;
    nickname: string;
    whatsapp: string;
    age: number;
    domicile: string;
    motivation: string;
    level: string;
}): Promise<void> {
    await ensureQuizTables();
    await queryMySQL(
        `UPDATE students
         SET nickname = ?,
             whatsapp = ?,
             age = ?,
             domicile = ?,
             motivation = ?,
             level = ?,
             registration_complete = 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
            input.nickname,
            input.whatsapp,
            input.age,
            input.domicile,
            input.motivation,
            input.level,
            input.id,
        ]
    );
}

export async function updateStudentPaymentProof(id: number, paymentProofUrl: string): Promise<void> {
    await ensureQuizTables();
    await queryMySQL(
        "UPDATE students SET payment_proof_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [paymentProofUrl, id]
    );
}

export async function ensureStudentTestStarted(id: number): Promise<Date> {
    const student = await findStudentById(id);
    if (!student) {
        throw new Error("Student not found");
    }
    if (student.testStartedAt) {
        return student.testStartedAt;
    }

    const startedAt = new Date();
    await queryMySQL(
        "UPDATE students SET test_started_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [startedAt, id]
    );
    return startedAt;
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

export async function addStudentAnswer(input: {
    studentId: number;
    questionId: number;
    selectedValue: string | null;
    isCorrect: boolean;
}): Promise<number> {
    await ensureQuizTables();
    await queryMySQL<ResultSetHeader>(
        `INSERT INTO student_answers (student_id, question_id, selected_value, is_correct)
         VALUES (?, ?, ?, ?)`,
        [input.studentId, input.questionId, input.selectedValue, input.isCorrect ? 1 : 0]
    );

    await queryMySQL(
        `UPDATE students
         SET test_status = CASE WHEN test_status = 'not_started' THEN 'in_progress' ELSE test_status END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [input.studentId]
    );

    const rows = await queryMySQL<RowDataPacket[]>(
        "SELECT COUNT(*) AS total FROM student_answers WHERE student_id = ?",
        [input.studentId]
    );
    return rows[0]?.total || 0;
}

export async function finishStudentTest(input: {
    studentId: number;
    score: number;
    passStatus: PassStatus;
}): Promise<void> {
    await ensureQuizTables();
    await queryMySQL(
        `UPDATE students
         SET score = ?,
             pass_status = ?,
             test_status = 'completed',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [input.score, input.passStatus, input.studentId]
    );
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
