import { queryMySQL, type ResultSetHeader, type RowDataPacket } from "./mysql-connection";

export interface DailyQuizQuestion {
    id: number;
    category: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface DailyQuizQuestionSeed {
    id: number;
    category: string;
    question: string;
    options: string[];
    answerIndex: number;
    explanation?: string | null;
}

export interface DailyQuizAttempt {
    id: number;
    studentId: number;
    score: number;
    baseScore: number;
    multiplier: number;
    currentStreak: number;
    totalQuestions: number;
    correctAnswers: number;
    questionIds: number[];
    selectedAnswers: (number | null)[];
    responseTimes: number[];
    questionScores: number[];
    quizDate: string | null;
    submittedAt: Date;
}

export interface DailyQuizLeaderboardItem {
    rank: number;
    studentId: number;
    studentName: string;
    bestScore: number;
    attempts: number;
}

interface DailyQuizQuestionRow extends RowDataPacket {
    id: number;
    category: string;
    question: string;
    options: string;
    correct_index: number;
    explanation: string | null;
    is_active: number;
    created_at: Date;
    updated_at: Date;
}

interface DailyQuizAttemptRow extends RowDataPacket {
    id: number;
    student_id: number;
    score: number;
    base_score: number;
    multiplier: number | string;
    current_streak: number;
    total_questions: number;
    correct_answers: number;
    question_ids: string | null;
    selected_answers: string | null;
    response_times: string | null;
    question_scores: string | null;
    quiz_date: string | Date | null;
    submitted_at: Date;
}

interface DailyQuizLeaderboardRow extends RowDataPacket {
    student_id: number;
    student_name: string;
    best_score: number;
    attempts: number;
}

interface DailyQuizStateRow extends RowDataPacket {
    student_id: number;
    current_streak: number;
    last_completed_date: string | null;
}

let dailyQuizReady: Promise<void> | null = null;

const DAILY_QUIZ_QUESTION_LIMIT = 2;
const DAILY_QUIZ_TIME_LIMIT_SECONDS = 15;
const DAILY_QUIZ_COMPLETED_MESSAGE =
    "Kamu sudah menyelesaikan tantangan hari ini. Kembali lagi besok!";

function parseJsonArray<T>(value: string | null): T[] {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function mapQuestion(row: DailyQuizQuestionRow): DailyQuizQuestion {
    return {
        id: row.id,
        category: row.category,
        question: row.question,
        options: parseJsonArray<string>(row.options),
        correctIndex: Number(row.correct_index),
        explanation: row.explanation,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapAttempt(row: DailyQuizAttemptRow): DailyQuizAttempt {
    return {
        id: row.id,
        studentId: row.student_id,
        score: Number(row.score),
        baseScore: Number(row.base_score ?? row.score),
        multiplier: Number(row.multiplier ?? 1),
        currentStreak: Number(row.current_streak ?? 1),
        totalQuestions: Number(row.total_questions),
        correctAnswers: Number(row.correct_answers),
        questionIds: parseJsonArray<number>(row.question_ids),
        selectedAnswers: parseJsonArray<number | null>(row.selected_answers),
        responseTimes: parseJsonArray<number>(row.response_times),
        questionScores: parseJsonArray<number>(row.question_scores),
        quizDate: normalizeDateKey(row.quiz_date),
        submittedAt: row.submitted_at,
    };
}

function normalizeDateKey(value: string | Date | null): string | null {
    if (!value) return null;
    if (typeof value === "string") return value.slice(0, 10);
    return getJakartaDateKey(value);
}

function getJakartaDateKey(date: Date): string {
    const parts = new Intl.DateTimeFormat("en", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);

    const value = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? "";

    return `${value("year")}-${value("month")}-${value("day")}`;
}

function getPreviousDateKey(dateKey: string): string {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
}

function getStreakMultiplier(streak: number): number {
    if (streak >= 8) return 1.5;
    if (streak >= 4) return 1.2;
    return 1;
}

function getQuestionScore(isCorrect: boolean, responseTimeSeconds: number): number {
    if (!isCorrect) return 0;
    if (responseTimeSeconds < 4) return 20;
    if (responseTimeSeconds <= 8) return 17;
    return 15;
}

function hashString(value: string): number {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function createSeededRandom(seed: number) {
    return () => {
        seed += 0x6d2b79f5;
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffleForDate<T>(items: T[], date: Date, seedKey = ""): T[] {
    const result = [...items];
    const random = createSeededRandom(hashString(`${getJakartaDateKey(date)}:${seedKey}`));

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

async function ensureColumn(
    tableName: string,
    columnName: string,
    definition: string
): Promise<void> {
    const rows = await queryMySQL<RowDataPacket[]>(
        `SHOW COLUMNS FROM \`${tableName}\` LIKE ?`,
        [columnName]
    );

    if (rows.length === 0) {
        await queryMySQL(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`);
    }
}

async function ensureIndex(
    tableName: string,
    indexName: string,
    definition: string
): Promise<void> {
    const rows = await queryMySQL<RowDataPacket[]>(
        `SHOW INDEX FROM \`${tableName}\` WHERE Key_name = ?`,
        [indexName]
    );

    if (rows.length === 0) {
        await queryMySQL(`ALTER TABLE \`${tableName}\` ADD ${definition}`);
    }
}

export async function ensureDailyQuizTables(): Promise<void> {
    if (!dailyQuizReady) {
        dailyQuizReady = (async () => {
            await queryMySQL(`
                CREATE TABLE IF NOT EXISTS daily_quiz_questions (
                    id INT UNSIGNED NOT NULL PRIMARY KEY,
                    category VARCHAR(120) NOT NULL,
                    question TEXT NOT NULL,
                    options TEXT NOT NULL,
                    correct_index TINYINT UNSIGNED NOT NULL,
                    explanation TEXT NULL,
                    is_active TINYINT(1) NOT NULL DEFAULT 1,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_daily_quiz_questions_active (is_active),
                    INDEX idx_daily_quiz_questions_category (category)
                )
            `);

            await queryMySQL(`
                CREATE TABLE IF NOT EXISTS daily_quiz_attempts (
                    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    score TINYINT UNSIGNED NOT NULL,
                    base_score TINYINT UNSIGNED NOT NULL DEFAULT 0,
                    multiplier DECIMAL(3,1) NOT NULL DEFAULT 1.0,
                    current_streak INT UNSIGNED NOT NULL DEFAULT 1,
                    total_questions TINYINT UNSIGNED NOT NULL,
                    correct_answers TINYINT UNSIGNED NOT NULL,
                    question_ids TEXT NULL,
                    selected_answers TEXT NULL,
                    response_times TEXT NULL,
                    question_scores TEXT NULL,
                    quiz_date DATE NULL,
                    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_daily_quiz_attempts_student_date (student_id, quiz_date),
                    INDEX idx_daily_quiz_attempts_student_date (student_id, submitted_at),
                    INDEX idx_daily_quiz_attempts_submitted_at (submitted_at),
                    INDEX idx_daily_quiz_attempts_quiz_date (quiz_date)
                )
            `);

            await queryMySQL(`
                CREATE TABLE IF NOT EXISTS daily_quiz_student_state (
                    student_id INT NOT NULL PRIMARY KEY,
                    current_streak INT UNSIGNED NOT NULL DEFAULT 0,
                    last_completed_date DATE NULL,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);

            await ensureColumn("daily_quiz_attempts", "base_score", "base_score TINYINT UNSIGNED NOT NULL DEFAULT 0");
            await ensureColumn("daily_quiz_attempts", "multiplier", "multiplier DECIMAL(3,1) NOT NULL DEFAULT 1.0");
            await ensureColumn("daily_quiz_attempts", "current_streak", "current_streak INT UNSIGNED NOT NULL DEFAULT 1");
            await ensureColumn("daily_quiz_attempts", "response_times", "response_times TEXT NULL");
            await ensureColumn("daily_quiz_attempts", "question_scores", "question_scores TEXT NULL");
            await ensureColumn("daily_quiz_attempts", "quiz_date", "quiz_date DATE NULL");
            await ensureIndex(
                "daily_quiz_attempts",
                "uq_daily_quiz_attempts_student_date",
                "UNIQUE INDEX uq_daily_quiz_attempts_student_date (student_id, quiz_date)"
            );
            // Backfill for existing databases — lets getDailyQuizAttemptLeaderboard's
            // `quiz_date = ?` branch use an index instead of scanning the whole table.
            await ensureIndex(
                "daily_quiz_attempts",
                "idx_daily_quiz_attempts_quiz_date",
                "INDEX idx_daily_quiz_attempts_quiz_date (quiz_date)"
            );
        })().catch((error) => {
            dailyQuizReady = null;
            throw error;
        });
    }

    await dailyQuizReady;
}

export async function replaceDailyQuizQuestions(
    questions: DailyQuizQuestionSeed[]
): Promise<number> {
    await ensureDailyQuizTables();

    for (const question of questions) {
        await queryMySQL<ResultSetHeader>(
            `INSERT INTO daily_quiz_questions
                (id, category, question, options, correct_index, explanation, is_active)
             VALUES (?, ?, ?, ?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE
                category = VALUES(category),
                question = VALUES(question),
                options = VALUES(options),
                correct_index = VALUES(correct_index),
                explanation = VALUES(explanation),
                is_active = 1,
                updated_at = CURRENT_TIMESTAMP`,
            [
                question.id,
                question.category,
                question.question,
                JSON.stringify(question.options),
                question.answerIndex,
                question.explanation ?? null,
            ]
        );
    }

    if (questions.length > 0) {
        const ids = questions.map((question) => question.id);
        await queryMySQL(
            `UPDATE daily_quiz_questions
             SET is_active = 0, updated_at = CURRENT_TIMESTAMP
             WHERE id NOT IN (${ids.map(() => "?").join(", ")})`,
            ids
        );
    }

    return questions.length;
}

export async function listDailyQuizQuestions(): Promise<DailyQuizQuestion[]> {
    await ensureDailyQuizTables();
    const rows = await queryMySQL<DailyQuizQuestionRow[]>(
        "SELECT * FROM daily_quiz_questions WHERE is_active = 1 ORDER BY id ASC"
    );
    return rows.map(mapQuestion);
}

export async function getDailyQuizQuestionCount(): Promise<number> {
    await ensureDailyQuizTables();
    const rows = await queryMySQL<RowDataPacket[]>(
        "SELECT COUNT(*) AS total FROM daily_quiz_questions WHERE is_active = 1"
    );
    return Number(rows[0]?.total ?? 0);
}

export async function getDailyQuizQuestionsForDate(
    limit = DAILY_QUIZ_QUESTION_LIMIT,
    date = new Date(),
    seedKey = ""
): Promise<DailyQuizQuestion[]> {
    const questions = await listDailyQuizQuestions();
    return shuffleForDate(questions, date, seedKey).slice(0, limit);
}

async function findDailyQuizQuestionsByIds(ids: number[]): Promise<DailyQuizQuestion[]> {
    await ensureDailyQuizTables();
    if (ids.length === 0) return [];

    const rows = await queryMySQL<DailyQuizQuestionRow[]>(
        `SELECT * FROM daily_quiz_questions
         WHERE is_active = 1 AND id IN (${ids.map(() => "?").join(", ")})`,
        ids
    );

    return rows.map(mapQuestion);
}

async function findDailyQuizAttemptById(id: number): Promise<DailyQuizAttempt | null> {
    const rows = await queryMySQL<DailyQuizAttemptRow[]>(
        "SELECT * FROM daily_quiz_attempts WHERE id = ? LIMIT 1",
        [id]
    );
    return rows[0] ? mapAttempt(rows[0]) : null;
}

export async function findTodayDailyQuizAttempt(
    studentId: number,
    date = new Date()
): Promise<DailyQuizAttempt | null> {
    await ensureDailyQuizTables();
    const todayKey = getJakartaDateKey(date);
    const rows = await queryMySQL<DailyQuizAttemptRow[]>(
        `SELECT * FROM daily_quiz_attempts
         WHERE student_id = ?
            AND (quiz_date = ? OR (quiz_date IS NULL AND DATE(submitted_at) = ?))
         ORDER BY submitted_at DESC, id DESC
         LIMIT 1`,
        [studentId, todayKey, todayKey]
    );

    return rows[0] ? mapAttempt(rows[0]) : null;
}

async function findDailyQuizState(studentId: number): Promise<DailyQuizStateRow | null> {
    const rows = await queryMySQL<DailyQuizStateRow[]>(
        `SELECT
            student_id,
            current_streak,
            DATE_FORMAT(last_completed_date, '%Y-%m-%d') AS last_completed_date
         FROM daily_quiz_student_state
         WHERE student_id = ?
         LIMIT 1`,
        [studentId]
    );

    return rows[0] ?? null;
}

function getNextStreak(state: DailyQuizStateRow | null, todayKey: string): number {
    if (!state?.last_completed_date) return 1;
    if (state.last_completed_date === todayKey) {
        throw new Error(DAILY_QUIZ_COMPLETED_MESSAGE);
    }

    const yesterdayKey = getPreviousDateKey(todayKey);
    if (state.last_completed_date === yesterdayKey) {
        return Number(state.current_streak) + 1;
    }

    return 1;
}

export async function submitDailyQuizAttempt(input: {
    studentId: number;
    questionIds: number[];
    selectedAnswers: (number | null)[];
    responseTimes: number[];
}): Promise<DailyQuizAttempt> {
    await ensureDailyQuizTables();

    const questionIds = input.questionIds.map(Number);
    const selectedAnswers = input.selectedAnswers.map((answer) =>
        answer === null ? null : Number(answer)
    );
    const responseTimes = input.responseTimes.map((time) => Number(time));
    const uniqueQuestionIds = new Set(questionIds);
    const todayKey = getJakartaDateKey(new Date());
    const existingAttempt = await findTodayDailyQuizAttempt(input.studentId);

    if (existingAttempt) {
        throw new Error(DAILY_QUIZ_COMPLETED_MESSAGE);
    }

    if (
        questionIds.length !== DAILY_QUIZ_QUESTION_LIMIT ||
        questionIds.length !== selectedAnswers.length ||
        questionIds.length !== responseTimes.length ||
        uniqueQuestionIds.size !== questionIds.length ||
        questionIds.some((id) => !Number.isInteger(id) || id < 1) ||
        responseTimes.some((time) => !Number.isFinite(time) || time < 0)
    ) {
        throw new Error("Invalid daily quiz answers");
    }

    const questions = await findDailyQuizQuestionsByIds(questionIds);
    const questionById = new Map(questions.map((question) => [question.id, question]));
    const expectedQuestionIds = (
        await getDailyQuizQuestionsForDate(
            DAILY_QUIZ_QUESTION_LIMIT,
            new Date(),
            String(input.studentId)
        )
    ).map((question) => question.id);
    const expectedQuestionSet = new Set(expectedQuestionIds);

    if (questionById.size !== questionIds.length) {
        throw new Error("One or more daily quiz questions were not found");
    }

    if (!questionIds.every((id) => expectedQuestionSet.has(id))) {
        throw new Error("Invalid daily quiz question set");
    }

    const state = await findDailyQuizState(input.studentId);
    const currentStreak = getNextStreak(state, todayKey);
    const multiplier = getStreakMultiplier(currentStreak);
    const questionScores: number[] = [];
    let correctAnswers = 0;

    for (let i = 0; i < questionIds.length; i++) {
        const question = questionById.get(questionIds[i]);
        const selectedAnswer = selectedAnswers[i];
        const responseTime = Math.min(
            DAILY_QUIZ_TIME_LIMIT_SECONDS,
            Math.max(0, responseTimes[i])
        );
        const isTimedOut = responseTimes[i] > DAILY_QUIZ_TIME_LIMIT_SECONDS;
        const isCorrect =
            question !== undefined &&
            !isTimedOut &&
            selectedAnswer !== null &&
            Number.isInteger(selectedAnswer) &&
            selectedAnswer >= 0 &&
            selectedAnswer < question.options.length &&
            selectedAnswer === question.correctIndex;

        if (isCorrect) {
            correctAnswers += 1;
        }

        questionScores.push(getQuestionScore(isCorrect, responseTime));
    }

    const baseScore = questionScores.reduce((total, score) => total + score, 0);
    const score = Math.round(baseScore * multiplier);
    const result = await queryMySQL<ResultSetHeader>(
        `INSERT INTO daily_quiz_attempts
            (
                student_id,
                score,
                base_score,
                multiplier,
                current_streak,
                total_questions,
                correct_answers,
                question_ids,
                selected_answers,
                response_times,
                question_scores,
                quiz_date
            )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            input.studentId,
            score,
            baseScore,
            multiplier,
            currentStreak,
            questionIds.length,
            correctAnswers,
            JSON.stringify(questionIds),
            JSON.stringify(selectedAnswers),
            JSON.stringify(responseTimes.map((time) => Math.min(DAILY_QUIZ_TIME_LIMIT_SECONDS, Math.max(0, time)))),
            JSON.stringify(questionScores),
            todayKey,
        ]
    );

    await queryMySQL(
        `INSERT INTO daily_quiz_student_state
            (student_id, current_streak, last_completed_date)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
            current_streak = VALUES(current_streak),
            last_completed_date = VALUES(last_completed_date),
            updated_at = CURRENT_TIMESTAMP`,
        [input.studentId, currentStreak, todayKey]
    );

    const attempt = await findDailyQuizAttemptById(result.insertId);
    if (!attempt) {
        throw new Error("Failed to load created daily quiz attempt");
    }

    return attempt;
}

export async function findLatestDailyQuizAttempt(
    studentId: number
): Promise<DailyQuizAttempt | null> {
    await ensureDailyQuizTables();
    const rows = await queryMySQL<DailyQuizAttemptRow[]>(
        `SELECT * FROM daily_quiz_attempts
         WHERE student_id = ?
         ORDER BY submitted_at DESC, id DESC
         LIMIT 1`,
        [studentId]
    );
    return rows[0] ? mapAttempt(rows[0]) : null;
}

export async function getDailyQuizAttemptLeaderboard(
    limit = 10
): Promise<DailyQuizLeaderboardItem[]> {
    await ensureDailyQuizTables();
    const todayKey = getJakartaDateKey(new Date());
    // Split the `quiz_date = ? OR (quiz_date IS NULL AND DATE(submitted_at) = ?)` filter
    // into a UNION ALL of its two (mutually exclusive) branches so the common branch —
    // every attempt going forward has quiz_date set — can use idx_daily_quiz_attempts_quiz_date
    // instead of a full scan. The legacy NULL-quiz_date branch keeps its original DATE()
    // comparison unchanged, so results are identical to before.
    const rows = await queryMySQL<DailyQuizLeaderboardRow[]>(
        `SELECT
            t.student_id,
            COALESCE(u.username, u.email) AS student_name,
            MAX(t.score) AS best_score,
            COUNT(*) AS attempts
         FROM (
            SELECT student_id, score FROM daily_quiz_attempts WHERE quiz_date = ?
            UNION ALL
            SELECT student_id, score FROM daily_quiz_attempts WHERE quiz_date IS NULL AND DATE(submitted_at) = ?
         ) t
         JOIN users u ON u.id = t.student_id
         GROUP BY t.student_id, u.username, u.email
         ORDER BY best_score DESC, attempts ASC, student_name ASC
         LIMIT ?`,
        [todayKey, todayKey, limit]
    );

    return rows.map((row, index) => ({
        rank: index + 1,
        studentId: row.student_id,
        studentName: row.student_name,
        bestScore: Number(row.best_score),
        attempts: Number(row.attempts),
    }));
}
