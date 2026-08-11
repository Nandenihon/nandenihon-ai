import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getConnection, queryMySQL } from "./mysql-connection";
import { ensureAssignmentTables } from "./assignment-mysql";

export type ClassTestStatus = "draft" | "published" | "closed";
export type AttemptStatus = "in_progress" | "completed";
export type AttemptPassStatus = "pending" | "passed" | "failed";
export type PaymentStatus = "pending" | "verified" | "rejected";

const RETAKE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const CORRECT_OPTIONS = ["A", "B", "C", "D"] as const;

export interface ClassTestQuestionInput {
    text: string;
    options: string[];
    correctAnswer: string;
    points?: number;
}

export interface ParsedQuestionFileResult {
    questions: ClassTestQuestionInput[];
    errors: string[];
}

export async function ensureAdmissionTestTables(): Promise<void> {
    await ensureAssignmentTables();
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS class_tests (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            class_id BIGINT UNSIGNED NOT NULL,
            title VARCHAR(255) NOT NULL,
            instructions TEXT NULL,
            pass_score INT UNSIGNED NOT NULL DEFAULT 60,
            time_limit_minutes INT UNSIGNED NOT NULL DEFAULT 30,
            status ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
            source_file_name VARCHAR(255) NULL,
            source_file_url VARCHAR(1000) NULL,
            created_by BIGINT UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_class_tests_class_status (class_id, status),
            CONSTRAINT fk_class_tests_class FOREIGN KEY (class_id) REFERENCES enrollment_classes(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS class_test_questions (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            test_id BIGINT UNSIGNED NOT NULL,
            text TEXT NOT NULL,
            options JSON NOT NULL,
            correct_answer VARCHAR(10) NOT NULL,
            points INT UNSIGNED NOT NULL DEFAULT 1,
            position INT UNSIGNED NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_class_test_questions_test (test_id, position),
            CONSTRAINT fk_class_test_questions_test FOREIGN KEY (test_id) REFERENCES class_tests(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS class_test_attempts (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            test_id BIGINT UNSIGNED NOT NULL,
            class_id BIGINT UNSIGNED NOT NULL,
            user_id BIGINT UNSIGNED NOT NULL,
            status ENUM('in_progress','completed') NOT NULL DEFAULT 'in_progress',
            score INT UNSIGNED NOT NULL DEFAULT 0,
            pass_status ENUM('pending','passed','failed') NOT NULL DEFAULT 'pending',
            started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            submitted_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_class_test_attempts_user (user_id, created_at),
            INDEX idx_class_test_attempts_test (test_id),
            CONSTRAINT fk_class_test_attempts_test FOREIGN KEY (test_id) REFERENCES class_tests(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS class_test_answers (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            attempt_id BIGINT UNSIGNED NOT NULL,
            question_id BIGINT UNSIGNED NOT NULL,
            selected_value VARCHAR(10) NULL,
            is_correct TINYINT(1) NOT NULL DEFAULT 0,
            answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_class_test_attempt_question (attempt_id, question_id),
            CONSTRAINT fk_class_test_answers_attempt FOREIGN KEY (attempt_id) REFERENCES class_test_attempts(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS class_test_payments (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            attempt_id BIGINT UNSIGNED NOT NULL,
            class_id BIGINT UNSIGNED NOT NULL,
            user_id BIGINT UNSIGNED NOT NULL,
            amount INT UNSIGNED NOT NULL,
            proof_url VARCHAR(1000) NOT NULL,
            status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
            rejection_reason TEXT NULL,
            verified_by BIGINT UNSIGNED NULL,
            verified_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_class_test_payments_status (status, created_at),
            CONSTRAINT fk_class_test_payments_attempt FOREIGN KEY (attempt_id) REFERENCES class_test_attempts(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

function parseOptions(raw: unknown): string[] {
    if (Array.isArray(raw)) return raw.map(String);
    try {
        const parsed = JSON.parse(String(raw));
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
}

function mapQuestionRow(row: RowDataPacket) {
    return {
        id: Number(row.id),
        testId: Number(row.test_id),
        text: String(row.text),
        options: parseOptions(row.options),
        correctAnswer: String(row.correct_answer),
        points: Number(row.points),
        position: Number(row.position),
    };
}

export async function createClassTest(input: {
    classId: number;
    createdBy: number;
    title: string;
    instructions?: string;
    passScore?: number;
    timeLimitMinutes?: number;
}) {
    await ensureAdmissionTestTables();
    const result = await queryMySQL<ResultSetHeader>(
        `INSERT INTO class_tests (class_id, title, instructions, pass_score, time_limit_minutes, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            input.classId,
            input.title,
            input.instructions || null,
            input.passScore ?? 60,
            input.timeLimitMinutes ?? 30,
            input.createdBy,
        ]
    );
    return result.insertId;
}

export async function updateClassTest(
    testId: number,
    input: {
        title?: string;
        instructions?: string;
        passScore?: number;
        timeLimitMinutes?: number;
        sourceFileName?: string;
        sourceFileUrl?: string;
    }
) {
    await ensureAdmissionTestTables();
    const test = await findClassTestById(testId);
    if (!test) throw new Error("TEST_NOT_FOUND");
    await queryMySQL(
        `UPDATE class_tests SET
            title = COALESCE(?, title),
            instructions = COALESCE(?, instructions),
            pass_score = COALESCE(?, pass_score),
            time_limit_minutes = COALESCE(?, time_limit_minutes),
            source_file_name = COALESCE(?, source_file_name),
            source_file_url = COALESCE(?, source_file_url)
         WHERE id = ?`,
        [
            input.title ?? null,
            input.instructions ?? null,
            input.passScore ?? null,
            input.timeLimitMinutes ?? null,
            input.sourceFileName ?? null,
            input.sourceFileUrl ?? null,
            testId,
        ]
    );
}

export async function publishClassTest(testId: number, actorId: number) {
    await ensureAdmissionTestTables();
    const test = await findClassTestById(testId);
    if (!test) throw new Error("TEST_NOT_FOUND");
    const questionCount = await queryMySQL<RowDataPacket[]>(
        "SELECT COUNT(*) AS total FROM class_test_questions WHERE test_id = ?",
        [testId]
    );
    if (!questionCount[0] || Number(questionCount[0].total) === 0) throw new Error("TEST_HAS_NO_QUESTIONS");
    await queryMySQL("UPDATE class_tests SET status = 'published' WHERE id = ?", [testId]);
    await queryMySQL(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data)
         VALUES (?, 'class_test_published', 'class_test', ?, ?)`,
        [actorId, testId, JSON.stringify({ status: "published" })]
    );
}

export async function closeClassTest(testId: number, actorId: number) {
    await ensureAdmissionTestTables();
    const test = await findClassTestById(testId);
    if (!test) throw new Error("TEST_NOT_FOUND");
    await queryMySQL("UPDATE class_tests SET status = 'closed' WHERE id = ?", [testId]);
    await queryMySQL(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data)
         VALUES (?, 'class_test_closed', 'class_test', ?, ?)`,
        [actorId, testId, JSON.stringify({ status: "closed" })]
    );
}

export async function findClassTestById(testId: number) {
    await ensureAdmissionTestTables();
    const rows = await queryMySQL<RowDataPacket[]>(
        `SELECT t.*, c.name AS class_name, c.code AS class_code
         FROM class_tests t JOIN enrollment_classes c ON c.id = t.class_id
         WHERE t.id = ? LIMIT 1`,
        [testId]
    );
    const row = rows[0];
    if (!row) return null;
    return {
        id: Number(row.id),
        classId: Number(row.class_id),
        className: String(row.class_name),
        classCode: String(row.class_code),
        title: String(row.title),
        instructions: row.instructions as string | null,
        passScore: Number(row.pass_score),
        timeLimitMinutes: Number(row.time_limit_minutes),
        status: row.status as ClassTestStatus,
        sourceFileName: row.source_file_name as string | null,
        sourceFileUrl: row.source_file_url as string | null,
        createdBy: Number(row.created_by),
    };
}

/** actorId = null lists tests across all classes (admin view); a teacher id restricts to their own classes. */
export async function listTestsForTeacher(actorId: number | null, classId?: number) {
    await ensureAdmissionTestTables();
    const teacherJoin = actorId
        ? "JOIN class_teachers ct ON ct.class_id = t.class_id AND ct.teacher_id = ? AND ct.active = 1"
        : "";
    const params: unknown[] = actorId ? [actorId] : [];
    if (classId) params.push(classId);
    return queryMySQL<RowDataPacket[]>(
        `SELECT t.*, c.name AS class_name, c.code AS class_code,
                (SELECT COUNT(*) FROM class_test_questions q WHERE q.test_id = t.id) AS question_count,
                (SELECT COUNT(*) FROM class_test_attempts a WHERE a.test_id = t.id) AS attempt_count
         FROM class_tests t
         JOIN enrollment_classes c ON c.id = t.class_id
         ${teacherJoin}
         ${classId ? "WHERE t.class_id = ?" : ""}
         ORDER BY t.created_at DESC`,
        params
    );
}

export async function listPublishedTestsForClass(classId: number) {
    await ensureAdmissionTestTables();
    return queryMySQL<RowDataPacket[]>(
        `SELECT id, class_id, title, instructions, pass_score, time_limit_minutes
         FROM class_tests WHERE class_id = ? AND status = 'published' ORDER BY created_at DESC`,
        [classId]
    );
}

export async function listQuestionsForTest(testId: number) {
    await ensureAdmissionTestTables();
    const rows = await queryMySQL<RowDataPacket[]>(
        "SELECT * FROM class_test_questions WHERE test_id = ? ORDER BY position ASC, id ASC",
        [testId]
    );
    return rows.map(mapQuestionRow);
}

function validateQuestionInput(question: ClassTestQuestionInput, index: number): string[] {
    const errors: string[] = [];
    const label = `Baris ${index + 1}`;
    if (!question.text || !question.text.trim()) errors.push(`${label}: teks soal kosong`);
    if (!Array.isArray(question.options) || question.options.filter((option) => option && option.trim()).length !== 4) {
        errors.push(`${label}: harus memiliki tepat 4 opsi (A-D) yang tidak kosong`);
    }
    const correct = String(question.correctAnswer || "").trim().toUpperCase();
    if (!CORRECT_OPTIONS.includes(correct as (typeof CORRECT_OPTIONS)[number])) {
        errors.push(`${label}: correct_option harus salah satu dari A, B, C, D`);
    }
    return errors;
}

export async function replaceTestQuestions(
    testId: number,
    questions: ClassTestQuestionInput[]
): Promise<{ count: number; errors: string[] }> {
    await ensureAdmissionTestTables();
    const test = await findClassTestById(testId);
    if (!test) throw new Error("TEST_NOT_FOUND");

    const errors = questions.flatMap((question, index) => validateQuestionInput(question, index));
    if (errors.length) return { count: 0, errors };
    if (questions.length === 0) throw new Error("NO_QUESTIONS_PROVIDED");

    await queryMySQL("DELETE FROM class_test_questions WHERE test_id = ?", [testId]);
    let position = 0;
    for (const question of questions) {
        await queryMySQL<ResultSetHeader>(
            `INSERT INTO class_test_questions (test_id, text, options, correct_answer, points, position)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                testId,
                question.text.trim(),
                JSON.stringify(question.options.map((option) => option.trim())),
                question.correctAnswer.trim().toUpperCase(),
                question.points ?? 1,
                position,
            ]
        );
        position += 1;
    }
    return { count: questions.length, errors: [] };
}

/**
 * CSV format (UTF-8, header row required):
 * question,option_a,option_b,option_c,option_d,correct_option,points
 * `points` is optional. No external CSV dependency is used since the format is fixed and small.
 */
function parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"') {
                if (line[i + 1] === '"') {
                    current += '"';
                    i += 1;
                } else {
                    inQuotes = false;
                }
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

const REQUIRED_CSV_HEADERS = ["question", "option_a", "option_b", "option_c", "option_d", "correct_option"];

export function parseQuestionCsv(content: string): ParsedQuestionFileResult {
    const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((line) => line.trim().length > 0);
    if (lines.length === 0) return { questions: [], errors: ["File kosong"] };

    const header = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase());
    const missingHeaders = REQUIRED_CSV_HEADERS.filter((name) => !header.includes(name));
    if (missingHeaders.length) {
        return { questions: [], errors: [`Header wajib tidak ditemukan: ${missingHeaders.join(", ")}`] };
    }

    const columnIndex = (name: string) => header.indexOf(name);
    const questions: ClassTestQuestionInput[] = [];
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

        if (!text.trim()) {
            errors.push(`${rowLabel}: kolom question kosong`);
            continue;
        }
        if (options.some((option) => !option.trim())) {
            errors.push(`${rowLabel}: salah satu opsi jawaban kosong`);
            continue;
        }
        if (!CORRECT_OPTIONS.includes(correctAnswer as (typeof CORRECT_OPTIONS)[number])) {
            errors.push(`${rowLabel}: correct_option harus A, B, C, atau D`);
            continue;
        }
        questions.push({ text, options, correctAnswer, points });
    }

    return { questions, errors };
}

export async function findLatestAttemptForTest(userId: number, testId: number) {
    const rows = await queryMySQL<RowDataPacket[]>(
        "SELECT * FROM class_test_attempts WHERE user_id = ? AND test_id = ? ORDER BY id DESC LIMIT 1",
        [userId, testId]
    );
    return rows[0] ?? null;
}

export async function startAttempt(userId: number, testId: number) {
    await ensureAdmissionTestTables();
    const test = await findClassTestById(testId);
    if (!test || test.status !== "published") throw new Error("TEST_NOT_AVAILABLE");

    const alreadyPassed = await queryMySQL<RowDataPacket[]>(
        "SELECT id FROM class_test_attempts WHERE user_id = ? AND pass_status = 'passed' LIMIT 1",
        [userId]
    );
    if (alreadyPassed[0]) throw new Error("ALREADY_PASSED");

    const inProgress = await queryMySQL<RowDataPacket[]>(
        "SELECT id, test_id FROM class_test_attempts WHERE user_id = ? AND status = 'in_progress' LIMIT 1",
        [userId]
    );
    if (inProgress[0]) {
        if (Number(inProgress[0].test_id) === testId) return Number(inProgress[0].id);
        throw new Error("ATTEMPT_IN_PROGRESS");
    }

    const latest = await findLatestAttemptForTest(userId, testId);
    if (latest && latest.pass_status === "failed") {
        const elapsed = Date.now() - new Date(latest.submitted_at ?? latest.created_at).getTime();
        if (elapsed < RETAKE_COOLDOWN_MS) throw new Error("RETAKE_COOLDOWN");
    }

    const result = await queryMySQL<ResultSetHeader>(
        "INSERT INTO class_test_attempts (test_id, class_id, user_id) VALUES (?, ?, ?)",
        [testId, test.classId, userId]
    );
    return result.insertId;
}

async function findAttemptOwnedByUser(attemptId: number, userId: number) {
    const rows = await queryMySQL<RowDataPacket[]>(
        "SELECT * FROM class_test_attempts WHERE id = ? AND user_id = ? LIMIT 1",
        [attemptId, userId]
    );
    return rows[0] ?? null;
}

export async function recordAnswer(input: {
    attemptId: number;
    userId: number;
    questionId: number;
    selectedValue: string | null;
}) {
    await ensureAdmissionTestTables();
    const attempt = await findAttemptOwnedByUser(input.attemptId, input.userId);
    if (!attempt || attempt.status !== "in_progress") throw new Error("ATTEMPT_NOT_ACTIVE");

    const questionRows = await queryMySQL<RowDataPacket[]>(
        "SELECT * FROM class_test_questions WHERE id = ? AND test_id = ? LIMIT 1",
        [input.questionId, attempt.test_id]
    );
    const question = questionRows[0];
    if (!question) throw new Error("QUESTION_NOT_FOUND");

    const isCorrect = Boolean(
        input.selectedValue && String(input.selectedValue).toUpperCase() === String(question.correct_answer).toUpperCase()
    );

    await queryMySQL(
        `INSERT INTO class_test_answers (attempt_id, question_id, selected_value, is_correct)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE selected_value = VALUES(selected_value), is_correct = VALUES(is_correct), answered_at = UTC_TIMESTAMP()`,
        [input.attemptId, input.questionId, input.selectedValue, isCorrect ? 1 : 0]
    );
    return isCorrect;
}

export async function finishAttempt(attemptId: number, userId: number) {
    await ensureAdmissionTestTables();
    const attempt = await findAttemptOwnedByUser(attemptId, userId);
    if (!attempt || attempt.status !== "in_progress") throw new Error("ATTEMPT_NOT_ACTIVE");

    const test = await findClassTestById(Number(attempt.test_id));
    if (!test) throw new Error("TEST_NOT_FOUND");

    const totals = await queryMySQL<RowDataPacket[]>(
        `SELECT
            (SELECT COALESCE(SUM(q.points), 0) FROM class_test_questions q WHERE q.test_id = ?) AS max_points,
            (SELECT COALESCE(SUM(q.points), 0)
             FROM class_test_answers a
             JOIN class_test_questions q ON q.id = a.question_id
             WHERE a.attempt_id = ? AND a.is_correct = 1) AS earned_points`,
        [attempt.test_id, attemptId]
    );
    const maxPoints = Number(totals[0]?.max_points || 0);
    const earnedPoints = Number(totals[0]?.earned_points || 0);
    const score = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
    const passStatus: AttemptPassStatus = score >= test.passScore ? "passed" : "failed";

    await queryMySQL(
        `UPDATE class_test_attempts
         SET status = 'completed', score = ?, pass_status = ?, submitted_at = UTC_TIMESTAMP()
         WHERE id = ?`,
        [score, passStatus, attemptId]
    );

    return { score, passStatus };
}

export async function listAttemptsForUser(userId: number) {
    await ensureAdmissionTestTables();
    return queryMySQL<RowDataPacket[]>(
        `SELECT a.*, t.title AS test_title, c.name AS class_name, c.code AS class_code
         FROM class_test_attempts a
         JOIN class_tests t ON t.id = a.test_id
         JOIN enrollment_classes c ON c.id = a.class_id
         WHERE a.user_id = ? ORDER BY a.created_at DESC`,
        [userId]
    );
}

export async function findAttemptWithQuestions(attemptId: number, userId: number) {
    await ensureAdmissionTestTables();
    const attempt = await findAttemptOwnedByUser(attemptId, userId);
    if (!attempt) return null;
    const test = await findClassTestById(Number(attempt.test_id));
    if (!test) return null;
    const questions = await listQuestionsForTest(Number(attempt.test_id));
    const answers = await queryMySQL<RowDataPacket[]>(
        "SELECT question_id, selected_value FROM class_test_answers WHERE attempt_id = ?",
        [attemptId]
    );
    const answerMap = new Map(answers.map((row) => [Number(row.question_id), row.selected_value as string | null]));
    return {
        attempt: {
            id: Number(attempt.id),
            testId: Number(attempt.test_id),
            classId: Number(attempt.class_id),
            status: attempt.status as AttemptStatus,
            score: Number(attempt.score),
            passStatus: attempt.pass_status as AttemptPassStatus,
            startedAt: attempt.started_at as Date,
            submittedAt: attempt.submitted_at as Date | null,
            testTitle: test.title,
            passScore: test.passScore,
            timeLimitMinutes: test.timeLimitMinutes,
        },
        questions: questions.map((question) => ({
            ...question,
            // Never leak the correct answer to an in-progress attempt.
            correctAnswer: attempt.status === "completed" ? question.correctAnswer : undefined,
            selectedValue: answerMap.get(question.id) ?? null,
        })),
    };
}

export async function findPassedAttemptWithoutPayment(userId: number) {
    await ensureAdmissionTestTables();
    const rows = await queryMySQL<RowDataPacket[]>(
        `SELECT a.*, t.title AS test_title, c.name AS class_name, c.code AS class_code
         FROM class_test_attempts a
         JOIN class_tests t ON t.id = a.test_id
         JOIN enrollment_classes c ON c.id = a.class_id
         WHERE a.user_id = ? AND a.pass_status = 'passed'
           AND NOT EXISTS (
             SELECT 1 FROM class_test_payments p WHERE p.attempt_id = a.id AND p.status IN ('pending','verified')
           )
         ORDER BY a.created_at DESC LIMIT 1`,
        [userId]
    );
    return rows[0] ?? null;
}

export async function findMyPayments(userId: number) {
    await ensureAdmissionTestTables();
    return queryMySQL<RowDataPacket[]>(
        `SELECT p.*, c.name AS class_name, c.code AS class_code
         FROM class_test_payments p JOIN enrollment_classes c ON c.id = p.class_id
         WHERE p.user_id = ? ORDER BY p.created_at DESC`,
        [userId]
    );
}

export async function createPayment(input: { attemptId: number; userId: number; amount: number; proofUrl: string }) {
    await ensureAdmissionTestTables();
    const attempt = await findAttemptOwnedByUser(input.attemptId, input.userId);
    if (!attempt || attempt.pass_status !== "passed") throw new Error("ATTEMPT_NOT_PASSED");

    const existing = await queryMySQL<RowDataPacket[]>(
        "SELECT id FROM class_test_payments WHERE attempt_id = ? AND status IN ('pending','verified') LIMIT 1",
        [input.attemptId]
    );
    if (existing[0]) throw new Error("PAYMENT_ALREADY_EXISTS");

    const result = await queryMySQL<ResultSetHeader>(
        `INSERT INTO class_test_payments (attempt_id, class_id, user_id, amount, proof_url)
         VALUES (?, ?, ?, ?, ?)`,
        [input.attemptId, attempt.class_id, input.userId, input.amount, input.proofUrl]
    );
    await queryMySQL(
        "INSERT INTO notification_outbox (event_type, payload) VALUES ('test_payment_submitted', ?)",
        [JSON.stringify({ paymentId: result.insertId, attemptId: input.attemptId, userId: input.userId })]
    );
    return result.insertId;
}

export async function listPendingPayments() {
    await ensureAdmissionTestTables();
    return queryMySQL<RowDataPacket[]>(
        `SELECT p.*, a.score, a.test_id, t.title AS test_title, c.name AS class_name, c.code AS class_code,
                u.username AS applicant_name, u.email AS applicant_email
         FROM class_test_payments p
         JOIN class_test_attempts a ON a.id = p.attempt_id
         JOIN class_tests t ON t.id = a.test_id
         JOIN enrollment_classes c ON c.id = p.class_id
         JOIN users u ON u.id = p.user_id
         WHERE p.status = 'pending' ORDER BY p.created_at ASC`
    );
}

export async function rejectPayment(paymentId: number, actorId: number, reason: string) {
    if (!reason.trim()) throw new Error("REJECTION_REASON_REQUIRED");
    await ensureAdmissionTestTables();
    const result = await queryMySQL<ResultSetHeader>(
        `UPDATE class_test_payments SET status = 'rejected', rejection_reason = ?, verified_by = ?, verified_at = UTC_TIMESTAMP()
         WHERE id = ? AND status = 'pending'`,
        [reason.trim(), actorId, paymentId]
    );
    if (result.affectedRows !== 1) throw new Error("INVALID_PAYMENT_TRANSITION");
    const rows = await queryMySQL<RowDataPacket[]>("SELECT user_id, class_id FROM class_test_payments WHERE id = ?", [paymentId]);
    await queryMySQL(
        "INSERT INTO notification_outbox (event_type, recipient_user_id, payload) VALUES ('test_payment_rejected', ?, ?)",
        [rows[0].user_id, JSON.stringify({ paymentId, reason: reason.trim() })]
    );
}

/**
 * Verifies a payment inside one transaction: activates the class membership
 * (reusing the same group/seat mechanics as `acceptApplication` in
 * enrollment-mysql.ts) and promotes the user from 'pre_student' to 'student'.
 */
export async function verifyPayment(paymentId: number, actorId: number) {
    await ensureAdmissionTestTables();
    const connection = await getConnection();
    try {
        await connection.beginTransaction();
        const [paymentRows] = await connection.query<RowDataPacket[]>(
            "SELECT * FROM class_test_payments WHERE id = ? FOR UPDATE",
            [paymentId]
        );
        const payment = paymentRows[0];
        if (!payment) throw new Error("PAYMENT_NOT_FOUND");
        if (payment.status === "verified") {
            await connection.commit();
            return { paymentId, alreadyVerified: true };
        }
        if (payment.status !== "pending") throw new Error("INVALID_PAYMENT_TRANSITION");

        const [classRows] = await connection.query<RowDataPacket[]>(
            "SELECT * FROM enrollment_classes WHERE id = ? FOR UPDATE",
            [payment.class_id]
        );
        const classItem = classRows[0];
        if (!classItem) throw new Error("CLASS_NOT_FOUND");

        const [membershipRows] = await connection.query<RowDataPacket[]>(
            "SELECT id, status FROM class_memberships WHERE class_id = ? AND user_id = ? FOR UPDATE",
            [payment.class_id, payment.user_id]
        );
        const membership = membershipRows[0];
        const needsSeat = !membership || membership.status !== "active";
        if (needsSeat && Number(classItem.occupied_seats) >= Number(classItem.capacity)) throw new Error("CLASS_FULL");

        const [groupRows] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM class_groups WHERE class_id = ? LIMIT 1",
            [payment.class_id]
        );
        let groupId = groupRows[0] ? Number(groupRows[0].id) : 0;
        if (!groupId) {
            const [groupResult] = await connection.query<ResultSetHeader>(
                "INSERT INTO class_groups (class_id, name) VALUES (?, ?)",
                [payment.class_id, `Class ${payment.class_id} — Main Group`]
            );
            groupId = groupResult.insertId;
        }

        await connection.query(
            `INSERT INTO class_memberships (group_id, class_id, user_id, status)
             VALUES (?, ?, ?, 'active')
             ON DUPLICATE KEY UPDATE group_id = VALUES(group_id), status = 'active',
                 joined_at = UTC_TIMESTAMP(), removed_at = NULL, completed_at = NULL`,
            [groupId, payment.class_id, payment.user_id]
        );
        if (needsSeat) {
            await connection.query("UPDATE enrollment_classes SET occupied_seats = occupied_seats + 1 WHERE id = ?", [payment.class_id]);
        }
        await connection.query("UPDATE users SET role = 'student' WHERE id = ? AND role = 'pre_student'", [payment.user_id]);
        await connection.query(
            "UPDATE class_test_payments SET status = 'verified', verified_by = ?, verified_at = UTC_TIMESTAMP() WHERE id = ?",
            [actorId, paymentId]
        );
        await connection.query(
            `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data)
             VALUES (?, 'test_payment_verified', 'class_test_payment', ?, ?)`,
            [actorId, paymentId, JSON.stringify({ userId: payment.user_id, classId: payment.class_id })]
        );
        await connection.query(
            "INSERT INTO notification_outbox (event_type, recipient_user_id, payload) VALUES ('test_payment_verified', ?, ?)",
            [payment.user_id, JSON.stringify({ paymentId, classId: payment.class_id })]
        );

        await connection.commit();
        return { paymentId, alreadyVerified: false };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
