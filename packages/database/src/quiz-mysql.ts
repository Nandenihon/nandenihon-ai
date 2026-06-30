import { queryMySQL, type ResultSetHeader, type RowDataPacket } from "./mysql-connection";

export type TestStatus = "not_started" | "in_progress" | "completed";
export type PassStatus = "pending" | "passed" | "failed";
export type QuizLevel = "N5" | "N4";

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
    time_limit: number;
    category: string | null;
    level: QuizLevel;
    created_at: Date;
    updated_at: Date;
}

let schemaReady: Promise<void> | null = null;

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

export async function ensureQuizTables(): Promise<void> {
    if (!schemaReady) {
        schemaReady = (async () => {
            await queryMySQL(`
                CREATE TABLE IF NOT EXISTS students (
                    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                    full_name VARCHAR(100) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    test_status ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
                    pass_status ENUM('pending', 'passed', 'failed') NOT NULL DEFAULT 'pending',
                    score INT NOT NULL DEFAULT 0,
                    nickname VARCHAR(50) NULL,
                    whatsapp VARCHAR(20) NULL,
                    age INT NULL,
                    domicile VARCHAR(100) NULL,
                    motivation VARCHAR(500) NULL,
                    level VARCHAR(50) NULL,
                    japanese_level VARCHAR(100) NULL,
                    payment_proof_url VARCHAR(500) NULL,
                    registration_complete TINYINT(1) NOT NULL DEFAULT 0,
                    test_started_at DATETIME NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY students_email_unique (email),
                    KEY students_status_idx (test_status, pass_status),
                    KEY students_level_idx (level)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            await queryMySQL(`
                CREATE TABLE IF NOT EXISTS questions (
                    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                    text TEXT NOT NULL,
                    options JSON NOT NULL,
                    correct_answer VARCHAR(500) NOT NULL,
                    time_limit INT NOT NULL DEFAULT 30,
                    category VARCHAR(100) NULL,
                    level ENUM('N5', 'N4') NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    KEY questions_level_idx (level)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            await queryMySQL(`
                CREATE TABLE IF NOT EXISTS student_answers (
                    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                    student_id BIGINT UNSIGNED NOT NULL,
                    question_id BIGINT UNSIGNED NOT NULL,
                    selected_value VARCHAR(500) NULL,
                    is_correct TINYINT(1) NOT NULL,
                    answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY student_answers_student_question_unique (student_id, question_id),
                    KEY student_answers_student_idx (student_id),
                    KEY student_answers_question_idx (question_id),
                    CONSTRAINT student_answers_student_fk
                        FOREIGN KEY (student_id) REFERENCES students(id)
                        ON DELETE CASCADE,
                    CONSTRAINT student_answers_question_fk
                        FOREIGN KEY (question_id) REFERENCES questions(id)
                        ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
        })().catch((error) => {
            schemaReady = null;
            throw error;
        });
    }

    await schemaReady;
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
    timeLimit: number;
    category?: string;
    level: QuizLevel;
}>): Promise<number> {
    await ensureQuizTables();
    await queryMySQL("DELETE FROM questions");

    for (const question of questions) {
        await queryMySQL<ResultSetHeader>(
            `INSERT INTO questions (text, options, correct_answer, time_limit, category, level)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                question.text,
                JSON.stringify(question.options),
                question.correctAnswer,
                question.timeLimit,
                question.category || null,
                question.level,
            ]
        );
    }

    return questions.length;
}
