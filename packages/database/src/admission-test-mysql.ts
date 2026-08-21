import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getConnection, queryMySQL } from "./mysql-connection";
import { ensureAssignmentTables } from "./assignment-mysql";

export type AttemptStatus = "in_progress" | "completed";
export type AttemptPassStatus = "pending" | "passed" | "failed";
export type PaymentStatus = "pending" | "verified" | "rejected";

const RETAKE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Admission test attempts/answers/payments. Unlike the earlier design, there is
 * no separate "class_tests" entity — a class's test is fully determined by its
 * `enrollment_classes.level` (which questions are drawn from the shared
 * `questions` bank managed on the "Soal Test" admin page) plus its
 * `test_pass_score` / `test_time_limit_minutes` / `test_question_count` columns
 * (see enrollment-mysql.ts). This keeps one shared question bank per level
 * instead of requiring a teacher to author a distinct question set per class.
 */
async function ensureIndex(tableName: string, indexName: string, definition: string): Promise<void> {
    const rows = await queryMySQL<RowDataPacket[]>(
        `SHOW INDEX FROM \`${tableName}\` WHERE Key_name = ?`,
        [indexName]
    );

    if (rows.length === 0) {
        await queryMySQL(`ALTER TABLE \`${tableName}\` ADD ${definition}`);
    }
}

let admissionTestTablesReady: Promise<void> | null = null;

export async function ensureAdmissionTestTables(): Promise<void> {
    if (!admissionTestTablesReady) {
        admissionTestTablesReady = ensureAdmissionTestTablesUncached().catch((error) => {
            admissionTestTablesReady = null;
            throw error;
        });
    }
    await admissionTestTablesReady;
}

async function ensureAdmissionTestTablesUncached(): Promise<void> {
    await ensureAssignmentTables();
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS class_test_attempts (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            class_id BIGINT UNSIGNED NOT NULL,
            user_id BIGINT UNSIGNED NOT NULL,
            question_ids JSON NOT NULL,
            status ENUM('in_progress','completed') NOT NULL DEFAULT 'in_progress',
            score INT UNSIGNED NOT NULL DEFAULT 0,
            pass_status ENUM('pending','passed','failed') NOT NULL DEFAULT 'pending',
            started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            submitted_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_class_test_attempts_user (user_id, created_at),
            INDEX idx_class_test_attempts_class (class_id),
            CONSTRAINT fk_class_test_attempts_class FOREIGN KEY (class_id) REFERENCES enrollment_classes(id)
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
            CONSTRAINT fk_class_test_answers_attempt FOREIGN KEY (attempt_id) REFERENCES class_test_attempts(id),
            CONSTRAINT fk_class_test_answers_question FOREIGN KEY (question_id) REFERENCES questions(id)
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
            INDEX idx_class_test_payments_user (user_id, created_at),
            CONSTRAINT fk_class_test_payments_attempt FOREIGN KEY (attempt_id) REFERENCES class_test_attempts(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    // Added after the table's initial rollout — existing databases need this backfilled.
    await ensureIndex("class_test_payments", "idx_class_test_payments_user", "INDEX idx_class_test_payments_user (user_id, created_at)");
}

let studentsTableEnsured = false;

/**
 * Repurposes the legacy `students` table (previously owned by the retired
 * public landing-page placement quiz — see quiz-mysql.ts history) into the
 * active-student profile record for this class-based admission flow. The old
 * live-test columns (test_status/pass_status/score/payment_proof_url/
 * registration_complete/test_started_at) are dropped since that quiz flow no
 * longer runs; test results now live in class_test_attempts and payments in
 * class_test_payments. `user_id` is the new source of truth linking a row
 * here back to the login identity in `users`.
 */
export async function ensureStudentsTable(): Promise<void> {
    if (studentsTableEnsured) return;
    const columns = await queryMySQL<RowDataPacket[]>("SHOW COLUMNS FROM students");
    const names = new Set(columns.map((column) => String(column.Field)));

    for (const column of ["test_status", "pass_status", "score", "payment_proof_url", "registration_complete", "test_started_at"]) {
        if (names.has(column)) await queryMySQL(`ALTER TABLE students DROP COLUMN \`${column}\``);
    }
    if (!names.has("user_id")) {
        await queryMySQL("ALTER TABLE students ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER id");
        await queryMySQL("ALTER TABLE students ADD UNIQUE KEY uq_students_user_id (user_id)");
    }
    if (!names.has("pre_student_id")) {
        await queryMySQL("ALTER TABLE students ADD COLUMN pre_student_id BIGINT UNSIGNED NULL AFTER user_id");
    }
    if (!names.has("activated_at")) {
        await queryMySQL("ALTER TABLE students ADD COLUMN activated_at DATETIME NULL AFTER pre_student_id");
    }
    if (!names.has("status")) {
        await queryMySQL("ALTER TABLE students ADD COLUMN status ENUM('active','inactive') NOT NULL DEFAULT 'active' AFTER activated_at");
    }
    studentsTableEnsured = true;
}

/** Upserts the active-student profile row when a payment is verified (see verifyPayment). */
async function upsertStudentRecord(
    connection: Awaited<ReturnType<typeof getConnection>>,
    input: { userId: number }
): Promise<void> {
    const [preStudentRows] = await connection.query<RowDataPacket[]>(
        `SELECT id, full_name, nickname, email, phone_number, domicile, motivation, japanese_level
         FROM pre_students WHERE promoted_user_id = ? LIMIT 1`,
        [input.userId]
    );
    const preStudent = preStudentRows[0];
    if (!preStudent) return; // Nothing to mirror (e.g. account promoted via a different path).

    await connection.query(
        `INSERT INTO students (user_id, pre_student_id, full_name, email, nickname, whatsapp, domicile, motivation, japanese_level, activated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE
             pre_student_id = VALUES(pre_student_id), full_name = VALUES(full_name), email = VALUES(email),
             nickname = VALUES(nickname), whatsapp = VALUES(whatsapp), domicile = VALUES(domicile),
             motivation = VALUES(motivation), japanese_level = VALUES(japanese_level),
             activated_at = COALESCE(students.activated_at, VALUES(activated_at))`,
        [
            input.userId, preStudent.id, preStudent.full_name, preStudent.email, preStudent.nickname,
            preStudent.phone_number, preStudent.domicile, preStudent.motivation, preStudent.japanese_level,
        ]
    );
}

function parseIdArray(raw: unknown): number[] {
    if (Array.isArray(raw)) return raw.map(Number);
    try {
        const parsed = JSON.parse(String(raw));
        return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
        return [];
    }
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

export interface ClassTestInfo {
    id: number;
    code: string;
    name: string;
    level: string | null;
    status: string;
    testPassScore: number;
    testTimeLimitMinutes: number;
    testQuestionCount: number;
    availableQuestions: number;
}

/** Class + its derived test config (level-based shared question bank), for the info/rules screen. */
export async function getClassTestInfo(classId: number): Promise<ClassTestInfo | null> {
    const rows = await queryMySQL<RowDataPacket[]>(
        `SELECT id, code, name, level, status, test_pass_score, test_time_limit_minutes, test_question_count
         FROM enrollment_classes WHERE id = ? LIMIT 1`,
        [classId]
    );
    const cls = rows[0];
    if (!cls) return null;

    let availableQuestions = 0;
    if (cls.level) {
        const countRows = await queryMySQL<RowDataPacket[]>(
            "SELECT COUNT(*) AS total FROM questions WHERE level = ?",
            [cls.level]
        );
        availableQuestions = Number(countRows[0]?.total || 0);
    }

    return {
        id: Number(cls.id),
        code: String(cls.code),
        name: String(cls.name),
        level: cls.level as string | null,
        status: String(cls.status),
        testPassScore: Number(cls.test_pass_score),
        testTimeLimitMinutes: Number(cls.test_time_limit_minutes),
        testQuestionCount: Number(cls.test_question_count),
        availableQuestions,
    };
}

export async function findLatestAttemptForClass(userId: number, classId: number) {
    const rows = await queryMySQL<RowDataPacket[]>(
        "SELECT * FROM class_test_attempts WHERE user_id = ? AND class_id = ? ORDER BY id DESC LIMIT 1",
        [userId, classId]
    );
    return rows[0] ?? null;
}

export async function startAttempt(userId: number, classId: number) {
    await ensureAdmissionTestTables();
    const classInfo = await getClassTestInfo(classId);
    if (!classInfo || classInfo.status !== "published" || !classInfo.level) throw new Error("TEST_NOT_AVAILABLE");
    if (classInfo.availableQuestions < classInfo.testQuestionCount) throw new Error("NOT_ENOUGH_QUESTIONS");

    const alreadyPassed = await queryMySQL<RowDataPacket[]>(
        "SELECT id FROM class_test_attempts WHERE user_id = ? AND pass_status = 'passed' LIMIT 1",
        [userId]
    );
    if (alreadyPassed[0]) throw new Error("ALREADY_PASSED");

    const inProgress = await queryMySQL<RowDataPacket[]>(
        "SELECT id, class_id FROM class_test_attempts WHERE user_id = ? AND status = 'in_progress' LIMIT 1",
        [userId]
    );
    if (inProgress[0]) {
        if (Number(inProgress[0].class_id) === classId) return Number(inProgress[0].id);
        throw new Error("ATTEMPT_IN_PROGRESS");
    }

    const latest = await findLatestAttemptForClass(userId, classId);
    if (latest && latest.pass_status === "failed") {
        const elapsed = Date.now() - new Date(latest.submitted_at ?? latest.created_at).getTime();
        if (elapsed < RETAKE_COOLDOWN_MS) throw new Error("RETAKE_COOLDOWN");
    }

    const questionRows = await queryMySQL<RowDataPacket[]>(
        "SELECT id FROM questions WHERE level = ? ORDER BY RAND() LIMIT ?",
        [classInfo.level, classInfo.testQuestionCount]
    );
    const questionIds = questionRows.map((row) => Number(row.id));

    const result = await queryMySQL<ResultSetHeader>(
        "INSERT INTO class_test_attempts (class_id, user_id, question_ids) VALUES (?, ?, ?)",
        [classId, userId, JSON.stringify(questionIds)]
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

    const questionIds = parseIdArray(attempt.question_ids);
    if (!questionIds.includes(input.questionId)) throw new Error("QUESTION_NOT_FOUND");

    const questionRows = await queryMySQL<RowDataPacket[]>(
        "SELECT correct_answer FROM questions WHERE id = ? LIMIT 1",
        [input.questionId]
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

    const classInfo = await getClassTestInfo(Number(attempt.class_id));
    if (!classInfo) throw new Error("CLASS_NOT_FOUND");

    const questionIds = parseIdArray(attempt.question_ids);
    const totals = await queryMySQL<RowDataPacket[]>(
        `SELECT
            (SELECT COALESCE(SUM(q.points), 0) FROM questions q WHERE q.id IN (${questionIds.map(() => "?").join(",") || "NULL"})) AS max_points,
            (SELECT COALESCE(SUM(q.points), 0)
             FROM class_test_answers a
             JOIN questions q ON q.id = a.question_id
             WHERE a.attempt_id = ? AND a.is_correct = 1) AS earned_points`,
        [...questionIds, attemptId]
    );
    const maxPoints = Number(totals[0]?.max_points || 0);
    const earnedPoints = Number(totals[0]?.earned_points || 0);
    const score = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
    const passStatus: AttemptPassStatus = score >= classInfo.testPassScore ? "passed" : "failed";

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
        `SELECT a.*, c.name AS class_name, c.code AS class_code
         FROM class_test_attempts a
         JOIN enrollment_classes c ON c.id = a.class_id
         WHERE a.user_id = ? ORDER BY a.created_at DESC`,
        [userId]
    );
}

export async function findAttemptWithQuestions(attemptId: number, userId: number) {
    await ensureAdmissionTestTables();
    const attempt = await findAttemptOwnedByUser(attemptId, userId);
    if (!attempt) return null;
    const classInfo = await getClassTestInfo(Number(attempt.class_id));
    if (!classInfo) return null;

    const questionIds = parseIdArray(attempt.question_ids);
    const questionRows = questionIds.length
        ? await queryMySQL<RowDataPacket[]>(
            `SELECT * FROM questions WHERE id IN (${questionIds.map(() => "?").join(",")})`,
            questionIds
        )
        : [];
    const questionById = new Map(questionRows.map((row) => [Number(row.id), row]));

    const answers = await queryMySQL<RowDataPacket[]>(
        "SELECT question_id, selected_value FROM class_test_answers WHERE attempt_id = ?",
        [attemptId]
    );
    const answerMap = new Map(answers.map((row) => [Number(row.question_id), row.selected_value as string | null]));

    return {
        attempt: {
            id: Number(attempt.id),
            classId: Number(attempt.class_id),
            status: attempt.status as AttemptStatus,
            score: Number(attempt.score),
            passStatus: attempt.pass_status as AttemptPassStatus,
            startedAt: attempt.started_at as Date,
            submittedAt: attempt.submitted_at as Date | null,
            className: classInfo.name,
            passScore: classInfo.testPassScore,
            timeLimitMinutes: classInfo.testTimeLimitMinutes,
        },
        questions: questionIds
            .map((id) => questionById.get(id))
            .filter((row): row is RowDataPacket => Boolean(row))
            .map((row) => ({
                id: Number(row.id),
                text: String(row.text),
                options: parseOptions(row.options),
                points: Number(row.points ?? 1),
                // Never leak the correct answer to an in-progress attempt.
                correctAnswer: attempt.status === "completed" ? String(row.correct_answer) : undefined,
                selectedValue: answerMap.get(Number(row.id)) ?? null,
            })),
    };
}

/**
 * Same shape as findAttemptWithQuestions but with no ownership check and no
 * correct-answer redaction — for the admin "Riwayat Nilai Tes" detail view,
 * where staff need to verify grading (selected answer vs. correct answer,
 * per-question) regardless of attempt status.
 */
export async function findAttemptDetailForAdmin(attemptId: number) {
    await ensureAdmissionTestTables();
    const rows = await queryMySQL<RowDataPacket[]>(
        "SELECT * FROM class_test_attempts WHERE id = ? LIMIT 1",
        [attemptId]
    );
    const attempt = rows[0];
    if (!attempt) return null;
    const classInfo = await getClassTestInfo(Number(attempt.class_id));

    const questionIds = parseIdArray(attempt.question_ids);
    const questionRows = questionIds.length
        ? await queryMySQL<RowDataPacket[]>(
            `SELECT * FROM questions WHERE id IN (${questionIds.map(() => "?").join(",")})`,
            questionIds
        )
        : [];
    const questionById = new Map(questionRows.map((row) => [Number(row.id), row]));

    const answers = await queryMySQL<RowDataPacket[]>(
        "SELECT question_id, selected_value, is_correct FROM class_test_answers WHERE attempt_id = ?",
        [attemptId]
    );
    const answerById = new Map(answers.map((row) => [Number(row.question_id), row]));

    return {
        attempt: {
            id: Number(attempt.id),
            classId: Number(attempt.class_id),
            status: attempt.status as AttemptStatus,
            score: Number(attempt.score),
            passStatus: attempt.pass_status as AttemptPassStatus,
            startedAt: attempt.started_at as Date,
            submittedAt: attempt.submitted_at as Date | null,
            className: classInfo?.name ?? "-",
            passScore: classInfo?.testPassScore ?? 0,
        },
        questions: questionIds
            .map((id) => questionById.get(id))
            .filter((row): row is RowDataPacket => Boolean(row))
            .map((row) => {
                const answer = answerById.get(Number(row.id));
                return {
                    id: Number(row.id),
                    text: String(row.text),
                    options: parseOptions(row.options),
                    points: Number(row.points ?? 1),
                    correctAnswer: String(row.correct_answer),
                    selectedValue: (answer?.selected_value as string | null | undefined) ?? null,
                    isCorrect: Boolean(answer?.is_correct),
                };
            }),
    };
}

export async function findPassedAttemptWithoutPayment(userId: number) {
    await ensureAdmissionTestTables();
    const rows = await queryMySQL<RowDataPacket[]>(
        `SELECT a.*, c.name AS class_name, c.code AS class_code
         FROM class_test_attempts a
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
        `SELECT p.*, a.score, c.name AS class_name, c.code AS class_code,
                u.username AS applicant_name, u.email AS applicant_email
         FROM class_test_payments p
         JOIN class_test_attempts a ON a.id = p.attempt_id
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
    await ensureStudentsTable();
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
        await upsertStudentRecord(connection, { userId: Number(payment.user_id) });
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

export type PreStudentOverviewStatus = "pre_student" | "student";

export interface ListPreStudentsOptions {
    search?: string;
    status?: PreStudentOverviewStatus;
    passStatus?: AttemptPassStatus;
    paymentStatus?: PaymentStatus;
    page?: number;
    pageSize?: number;
}

/**
 * Admin overview: pre_students joined with their current role (promoted or
 * still pending) plus their latest test attempt and latest payment, one row
 * per candidate. Attempts/payments are keyed by `promoted_user_id`, which is
 * now set eagerly at registration (see registration.ts `ensurePreStudentUserId`).
 */
export async function listPreStudentsOverview(options: ListPreStudentsOptions = {}) {
    await ensureAdmissionTestTables();
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    const where: string[] = [];
    const params: unknown[] = [];
    if (options.search) {
        where.push("(ps.full_name LIKE ? OR ps.nickname LIKE ? OR ps.email LIKE ? OR ps.phone_number LIKE ?)");
        const term = `%${options.search}%`;
        params.push(term, term, term, term);
    }
    if (options.status === "student") where.push("u.role = 'student'");
    else if (options.status === "pre_student") where.push("(u.role IS NULL OR u.role = 'pre_student')");
    if (options.passStatus) { where.push("latest_attempt.pass_status = ?"); params.push(options.passStatus); }
    if (options.paymentStatus) { where.push("latest_payment.status = ?"); params.push(options.paymentStatus); }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const joins = `
        LEFT JOIN users u ON u.id = ps.promoted_user_id
        LEFT JOIN (
            SELECT a.user_id, a.score, a.pass_status, a.submitted_at, c.name AS class_name, c.code AS class_code,
                   ROW_NUMBER() OVER (PARTITION BY a.user_id ORDER BY a.created_at DESC) AS rn
            FROM class_test_attempts a
            JOIN enrollment_classes c ON c.id = a.class_id
        ) latest_attempt ON latest_attempt.user_id = ps.promoted_user_id AND latest_attempt.rn = 1
        LEFT JOIN (
            SELECT user_id, COUNT(*) AS total_attempts, SUM(pass_status = 'passed') AS passed_attempts
            FROM class_test_attempts GROUP BY user_id
        ) attempt_counts ON attempt_counts.user_id = ps.promoted_user_id
        LEFT JOIN (
            SELECT p.user_id, p.status, p.amount, p.created_at, c.name AS class_name,
                   ROW_NUMBER() OVER (PARTITION BY p.user_id ORDER BY p.created_at DESC) AS rn
            FROM class_test_payments p
            JOIN enrollment_classes c ON c.id = p.class_id
        ) latest_payment ON latest_payment.user_id = ps.promoted_user_id AND latest_payment.rn = 1
    `;

    const countRows = await queryMySQL<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM pre_students ps ${joins} ${whereClause}`,
        params
    );
    const total = Number(countRows[0]?.total || 0);

    const rows = await queryMySQL<RowDataPacket[]>(
        `SELECT ps.id, ps.full_name, ps.nickname, ps.email, ps.phone_number, ps.domicile, ps.japanese_level,
                ps.avatar_url, ps.email_verified_at, ps.registration_completed_at, ps.promoted_user_id, ps.created_at,
                COALESCE(u.role, 'pre_student') AS current_role,
                latest_attempt.score AS latest_score, latest_attempt.pass_status AS latest_pass_status,
                latest_attempt.class_name AS latest_class_name, latest_attempt.class_code AS latest_class_code,
                latest_attempt.submitted_at AS latest_attempt_at,
                COALESCE(attempt_counts.total_attempts, 0) AS total_attempts,
                COALESCE(attempt_counts.passed_attempts, 0) AS passed_attempts,
                latest_payment.status AS latest_payment_status, latest_payment.amount AS latest_payment_amount,
                latest_payment.class_name AS latest_payment_class_name, latest_payment.created_at AS latest_payment_at
         FROM pre_students ps
         ${joins}
         ${whereClause}
         ORDER BY ps.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
    );

    return { data: rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function findPreStudentDetail(preStudentId: number) {
    await ensureAdmissionTestTables();
    const rows = await queryMySQL<RowDataPacket[]>(
        `SELECT ps.*, COALESCE(u.role, 'pre_student') AS current_role, u.username AS user_display_name
         FROM pre_students ps
         LEFT JOIN users u ON u.id = ps.promoted_user_id
         WHERE ps.id = ? LIMIT 1`,
        [preStudentId]
    );
    const profile = rows[0];
    if (!profile) return null;

    const userId = profile.promoted_user_id ? Number(profile.promoted_user_id) : null;
    const [attempts, payments] = userId
        ? await Promise.all([
            queryMySQL<RowDataPacket[]>(
                `SELECT a.*, c.name AS class_name, c.code AS class_code
                 FROM class_test_attempts a
                 JOIN enrollment_classes c ON c.id = a.class_id
                 WHERE a.user_id = ? ORDER BY a.created_at DESC`,
                [userId]
            ),
            queryMySQL<RowDataPacket[]>(
                `SELECT p.*, c.name AS class_name, c.code AS class_code
                 FROM class_test_payments p
                 JOIN enrollment_classes c ON c.id = p.class_id
                 WHERE p.user_id = ? ORDER BY p.created_at DESC`,
                [userId]
            ),
        ])
        : [[], []];

    return { profile, attempts, payments };
}

export type StudentStatus = "active" | "inactive";

export interface ListStudentsOptions {
    search?: string;
    classId?: number;
    status?: StudentStatus;
    page?: number;
    pageSize?: number;
}

/**
 * Active-student roster (students.user_id IS NOT NULL) with each student's
 * current class membership, for the admin "Siswa" page: search, filter by
 * class/status, CSV export, status toggle, and class transfer all read from
 * this same shape.
 */
export async function listStudentsOverview(options: ListStudentsOptions = {}) {
    await ensureStudentsTable();
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(500, Math.max(1, options.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    const where: string[] = ["s.user_id IS NOT NULL"];
    const params: unknown[] = [];
    if (options.search) {
        where.push("(s.full_name LIKE ? OR s.email LIKE ? OR s.whatsapp LIKE ?)");
        const term = `%${options.search}%`;
        params.push(term, term, term);
    }
    if (options.status) { where.push("s.status = ?"); params.push(options.status); }
    if (options.classId) { where.push("m.class_id = ?"); params.push(options.classId); }
    const whereClause = `WHERE ${where.join(" AND ")}`;

    const countRows = await queryMySQL<RowDataPacket[]>(
        `SELECT COUNT(*) AS total
         FROM students s
         LEFT JOIN class_memberships m ON m.user_id = s.user_id AND m.status = 'active'
         ${whereClause}`,
        params
    );
    const total = Number(countRows[0]?.total ?? 0);

    const rows = await queryMySQL<RowDataPacket[]>(
        `SELECT s.id, s.user_id, s.pre_student_id, s.full_name, s.email, s.whatsapp, s.japanese_level,
                s.activated_at, s.status,
                c.id AS class_id, c.code AS class_code, c.name AS class_name
         FROM students s
         LEFT JOIN class_memberships m ON m.user_id = s.user_id AND m.status = 'active'
         LEFT JOIN enrollment_classes c ON c.id = m.class_id
         ${whereClause}
         ORDER BY s.activated_at DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
    );

    return { data: rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function updateStudentStatus(studentId: number, status: StudentStatus, actorId: number) {
    await ensureStudentsTable();
    const [before] = await queryMySQL<RowDataPacket[]>("SELECT id, status FROM students WHERE id = ? LIMIT 1", [studentId]);
    if (!before) throw new Error("STUDENT_NOT_FOUND");
    await queryMySQL("UPDATE students SET status = ? WHERE id = ?", [status, studentId]);
    await queryMySQL(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, before_data, after_data)
         VALUES (?, 'student_status_updated', 'student', ?, ?, ?)`,
        [actorId, studentId, JSON.stringify({ status: before.status }), JSON.stringify({ status })]
    );
    return { id: studentId, status };
}

/**
 * Moves a student's active class membership to a different class: closes out
 * the old membership (frees its seat) and opens/reactivates one in the target
 * class (claims a seat there), in one transaction. Mirrors the seat/group
 * bookkeeping in verifyPayment/acceptApplication.
 */
export async function transferStudentToClass(studentId: number, targetClassId: number, actorId: number) {
    await ensureStudentsTable();
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const [studentRows] = await connection.query<RowDataPacket[]>(
            "SELECT id, user_id FROM students WHERE id = ? FOR UPDATE",
            [studentId]
        );
        const student = studentRows[0];
        if (!student || !student.user_id) throw new Error("STUDENT_NOT_FOUND");
        const userId = Number(student.user_id);

        const [targetClassRows] = await connection.query<RowDataPacket[]>(
            "SELECT id, capacity, occupied_seats FROM enrollment_classes WHERE id = ? FOR UPDATE",
            [targetClassId]
        );
        const targetClass = targetClassRows[0];
        if (!targetClass) throw new Error("CLASS_NOT_FOUND");

        const [currentMembershipRows] = await connection.query<RowDataPacket[]>(
            "SELECT id, class_id, status FROM class_memberships WHERE user_id = ? AND status = 'active' FOR UPDATE",
            [userId]
        );
        const currentMembership = currentMembershipRows[0];
        if (currentMembership && Number(currentMembership.class_id) === targetClassId) {
            await connection.commit();
            return { studentId, classId: targetClassId, alreadyInClass: true };
        }

        if (Number(targetClass.occupied_seats) >= Number(targetClass.capacity)) throw new Error("CLASS_FULL");

        if (currentMembership) {
            await connection.query(
                "UPDATE class_memberships SET status = 'removed', removed_at = UTC_TIMESTAMP() WHERE id = ?",
                [currentMembership.id]
            );
            await connection.query(
                "UPDATE enrollment_classes SET occupied_seats = GREATEST(occupied_seats - 1, 0) WHERE id = ?",
                [currentMembership.class_id]
            );
        }

        const [groupRows] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM class_groups WHERE class_id = ? LIMIT 1",
            [targetClassId]
        );
        let groupId = groupRows[0] ? Number(groupRows[0].id) : 0;
        if (!groupId) {
            const [groupResult] = await connection.query<ResultSetHeader>(
                "INSERT INTO class_groups (class_id, name) VALUES (?, ?)",
                [targetClassId, `Class ${targetClassId} — Main Group`]
            );
            groupId = groupResult.insertId;
        }

        await connection.query(
            `INSERT INTO class_memberships (group_id, class_id, user_id, status)
             VALUES (?, ?, ?, 'active')
             ON DUPLICATE KEY UPDATE group_id = VALUES(group_id), status = 'active',
                 joined_at = UTC_TIMESTAMP(), removed_at = NULL, completed_at = NULL`,
            [groupId, targetClassId, userId]
        );
        await connection.query("UPDATE enrollment_classes SET occupied_seats = occupied_seats + 1 WHERE id = ?", [targetClassId]);

        await connection.query(
            `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, before_data, after_data)
             VALUES (?, 'student_transferred', 'student', ?, ?, ?)`,
            [
                actorId, studentId,
                JSON.stringify({ classId: currentMembership ? Number(currentMembership.class_id) : null }),
                JSON.stringify({ classId: targetClassId }),
            ]
        );

        await connection.commit();
        return { studentId, classId: targetClassId, alreadyInClass: false };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
