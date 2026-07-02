import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "./mysql-connection";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Normalised view of a counseling registration — uses our canonical field names. */
export interface CounselingRegistration {
    id: number;
    full_name: string;
    email: string;
    /** Our own 'phone' column (inserted by this app). */
    phone: string;
    /** Legacy 'phone_number' column (created by external schema). */
    phone_number: string;
    /** Our own 'birth_place' column. */
    birth_place: string;
    /** Legacy 'place_of_birth' column. */
    place_of_birth: string;
    /** Our own 'birth_date' column. */
    birth_date: string | null;
    /** Legacy 'date_of_birth' column. */
    date_of_birth: string | null;
    domicile: string;
    last_education: string;
    topic: string;
    /** Legacy 'theme' column. */
    theme: string;
    story: string;
    /** Our own 'consultation_time' column. */
    consultation_time: string | null;
    /** Legacy 'appointment_time' column. */
    appointment_time: string | null;
    terms_and_conditions: number;
    created_at: Date | string | null;
}

export interface CreateCounselingInput {
    full_name: string;
    email: string;
    phone: string;
    birth_place: string;
    birth_date: string;
    domicile: string;
    last_education: string;
    topic: string;
    story: string;
    consultation_time: string;
}

const VALID_EDUCATION_LEVELS = ["SD", "SMP/SLTP", "SMA/SMK/SLTA", "D3", "S1", "S2", "S3"] as const;
const VALID_TOPICS = ["Pendidikan", "Karir", "Keluarga", "Relationship"] as const;

export type EducationLevel = (typeof VALID_EDUCATION_LEVELS)[number];
export type CounselingTopic = (typeof VALID_TOPICS)[number];

// ---------------------------------------------------------------------------
// Helpers: resolved field values across dual-column schema
// ---------------------------------------------------------------------------

/** Phone: prefer our 'phone' column; fall back to legacy 'phone_number'. */
export function resolvePhone(reg: CounselingRegistration): string {
    return reg.phone || reg.phone_number || "";
}

/** Birth place: prefer our 'birth_place'; fall back to legacy 'place_of_birth'. */
export function resolveBirthPlace(reg: CounselingRegistration): string {
    return reg.birth_place || reg.place_of_birth || "";
}

/** Birth date: prefer our 'birth_date'; fall back to legacy 'date_of_birth'. */
export function resolveBirthDate(reg: CounselingRegistration): string {
    return reg.birth_date || reg.date_of_birth || "";
}

/** Topic: prefer our 'topic'; fall back to legacy 'theme'. */
export function resolveTopic(reg: CounselingRegistration): string {
    return reg.topic || reg.theme || "";
}

/** Consultation time: prefer our 'consultation_time'; fall back to legacy 'appointment_time'. */
export function resolveConsultationTime(reg: CounselingRegistration): string {
    return reg.consultation_time || reg.appointment_time || "";
}

// ---------------------------------------------------------------------------
// Schema management
// ---------------------------------------------------------------------------

/** Module-level cache — table is only created/migrated once per server process lifetime. */
let tableReady: Promise<void> | null = null;
let tableColumns: Promise<Set<string>> | null = null;

/**
 * Columns that may be missing in older table versions — added via ALTER if absent.
 * Each entry: [column_name, ALTER TABLE fragment].
 */
const REQUIRED_COLUMNS: [string, string][] = [
    ["phone",             "ADD COLUMN phone              VARCHAR(30)  NOT NULL DEFAULT '' AFTER email"],
    ["birth_place",       "ADD COLUMN birth_place        VARCHAR(255) NOT NULL DEFAULT '' AFTER phone"],
    ["birth_date",        "ADD COLUMN birth_date         DATE         NOT NULL DEFAULT '1970-01-01' AFTER birth_place"],
    ["domicile",          "ADD COLUMN domicile           VARCHAR(255) NOT NULL DEFAULT '' AFTER birth_date"],
    ["last_education",    "ADD COLUMN last_education     VARCHAR(20)  NOT NULL DEFAULT '' AFTER domicile"],
    ["topic",             "ADD COLUMN topic              VARCHAR(50)  NOT NULL DEFAULT '' AFTER last_education"],
    ["story",             "ADD COLUMN story              TEXT         NOT NULL AFTER last_education"],
    ["consultation_time", "ADD COLUMN consultation_time  DATETIME     NOT NULL DEFAULT '1970-01-01 00:00:00' AFTER story"],
    ["terms_and_conditions", "ADD COLUMN terms_and_conditions TINYINT(1) NOT NULL DEFAULT 0"],
];

/**
 * MODIFY statements to set DEFAULT values on pre-existing NOT NULL columns
 * that lack a default (would cause INSERT to fail if field not supplied).
 */
const COLUMN_DEFAULT_FIXES: string[] = [
    "ALTER TABLE counseling_registration MODIFY COLUMN terms_and_conditions TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE counseling_registration MODIFY COLUMN phone_number         VARCHAR(30)  NOT NULL DEFAULT ''",
    "ALTER TABLE counseling_registration MODIFY COLUMN place_of_birth       VARCHAR(255) NOT NULL DEFAULT ''",
    "ALTER TABLE counseling_registration MODIFY COLUMN date_of_birth        DATE         NOT NULL DEFAULT '1970-01-01'",
    "ALTER TABLE counseling_registration MODIFY COLUMN domicile             VARCHAR(255) NOT NULL DEFAULT ''",
    "ALTER TABLE counseling_registration MODIFY COLUMN last_education       VARCHAR(20)  NOT NULL DEFAULT ''",
    "ALTER TABLE counseling_registration MODIFY COLUMN topic                VARCHAR(50)  NOT NULL DEFAULT ''",
    "ALTER TABLE counseling_registration MODIFY COLUMN story                TEXT         NOT NULL",
    "ALTER TABLE counseling_registration MODIFY COLUMN theme                VARCHAR(50)  NOT NULL DEFAULT ''",
    "ALTER TABLE counseling_registration MODIFY COLUMN appointment_time     DATETIME     NOT NULL DEFAULT '1970-01-01 00:00:00'",
];

async function getCounselingTableColumns(): Promise<Set<string>> {
    if (!tableColumns) {
        tableColumns = queryMySQL<RowDataPacket[]>(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'counseling_registration'`
        )
            .then((rows) => {
                const columns = new Set(rows.map((row) => String(row.COLUMN_NAME)));
                if (columns.size === 0) {
                    throw new Error("Table counseling_registration does not exist or cannot be inspected");
                }
                return columns;
            })
            .catch((error) => {
                tableColumns = null;
                throw error;
            });
    }

    return tableColumns;
}

function columnSql(columns: Set<string>, columnName: string, fallback = "NULL"): string {
    return columns.has(columnName) ? `\`${columnName}\`` : fallback;
}

function textValueSql(columns: Set<string>, columnNames: string[]): string {
    const expressions = columnNames
        .filter((columnName) => columns.has(columnName))
        .map((columnName) => `NULLIF(\`${columnName}\`, '')`);

    return expressions.length > 0 ? `COALESCE(${expressions.join(", ")}, '')` : "''";
}

function dateValueSql(columns: Set<string>, columnNames: string[]): string {
    const expressions = columnNames
        .filter((columnName) => columns.has(columnName))
        .map((columnName) => `NULLIF(\`${columnName}\`, '1970-01-01')`);

    return expressions.length > 0 ? `COALESCE(${expressions.join(", ")})` : "NULL";
}

function dateTimeValueSql(columns: Set<string>, columnNames: string[]): string {
    const expressions = columnNames
        .filter((columnName) => columns.has(columnName))
        .map((columnName) => `NULLIF(\`${columnName}\`, '1970-01-01 00:00:00')`);

    return expressions.length > 0 ? `COALESCE(${expressions.join(", ")})` : "NULL";
}

function buildCounselingWhere(
    columns: Set<string>,
    options: ListCounselingOptions
): { whereSql: string; params: unknown[] } {
    const where: string[] = [];
    const params: unknown[] = [];

    if (options.topic) {
        const topicColumns = ["topic", "theme"].filter((columnName) => columns.has(columnName));

        if (topicColumns.length > 0) {
            where.push(`(${topicColumns.map((columnName) => `\`${columnName}\` = ?`).join(" OR ")})`);
            params.push(...topicColumns.map(() => options.topic));
        } else {
            where.push("1 = 0");
        }
    }

    return {
        whereSql: where.length > 0 ? ` WHERE ${where.join(" AND ")}` : "",
        params,
    };
}

async function ensureCounselingTable(): Promise<void> {
    if (tableReady) return tableReady;

    tableReady = (async () => {
        try {
            // 1. Create table if it doesn't exist
            await queryMySQL<ResultSetHeader>(
                `CREATE TABLE IF NOT EXISTS counseling_registration (
                    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
                    full_name       VARCHAR(255) NOT NULL,
                    email           VARCHAR(255) NOT NULL,
                    phone           VARCHAR(30)  NOT NULL DEFAULT '',
                    birth_place     VARCHAR(255) NOT NULL DEFAULT '',
                    birth_date      DATE         NOT NULL DEFAULT '1970-01-01',
                    domicile        VARCHAR(255) NOT NULL DEFAULT '',
                    last_education  VARCHAR(20)  NOT NULL DEFAULT '',
                    topic           VARCHAR(50)  NOT NULL,
                    story           TEXT         NOT NULL,
                    consultation_time DATETIME   NOT NULL,
                    terms_and_conditions TINYINT(1) NOT NULL DEFAULT 0,
                    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    KEY idx_email (email),
                    KEY idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
            );

            // 2. Detect and add any columns that are missing (handles stale table schema)
            const existingCols = await queryMySQL<RowDataPacket[]>(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'counseling_registration'`
            );
            const existingSet = new Set(existingCols.map((r) => r.COLUMN_NAME as string));

            for (const [colName, alterFragment] of REQUIRED_COLUMNS) {
                if (!existingSet.has(colName)) {
                    await queryMySQL<ResultSetHeader>(
                        `ALTER TABLE counseling_registration ${alterFragment}`
                    );
                    existingSet.add(colName);
                    tableColumns = null;
                }
            }

            // 3. Fix defaults on columns that already exist but may lack a DEFAULT
            for (const sql of COLUMN_DEFAULT_FIXES) {
                try {
                    await queryMySQL<ResultSetHeader>(sql);
                } catch {
                    // ignore — column may not exist on fresh installs, or TEXT can't have DEFAULT
                }
            }
        } catch (err) {
            tableReady = null;
            const msg = err instanceof Error ? err.message : String(err);
            throw new Error(
                `Failed to initialize counseling_registration table. ` +
                `Ensure the DB user has CREATE, ALTER, and SELECT privileges. Details: ${msg}`
            );
        }
    })();

    return tableReady;
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export async function createCounselingRegistration(
    input: CreateCounselingInput
): Promise<CounselingRegistration> {
    await ensureCounselingTable();

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
    } = input;

    const result = await queryMySQL<ResultSetHeader>(
        `INSERT INTO counseling_registration
         (full_name, email, phone, birth_place, birth_date, domicile, last_education, topic, story, consultation_time, terms_and_conditions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [full_name, email, phone, birth_place, birth_date, domicile, last_education, topic, story, consultation_time]
    );

    const rows = await queryMySQL<RowDataPacket[]>(
        "SELECT * FROM counseling_registration WHERE id = ?",
        [result.insertId]
    );

    return rows[0] as CounselingRegistration;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export interface ListCounselingOptions {
    page?: number;
    limit?: number;
    topic?: string;
}

export interface ListCounselingResult {
    data: CounselingRegistration[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export async function listCounselingRegistrations(
    options: ListCounselingOptions = {}
): Promise<ListCounselingResult> {
    const columns = await getCounselingTableColumns();

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;
    const { whereSql, params } = buildCounselingWhere(columns, options);
    const orderBy = columns.has("created_at")
        ? "`created_at` DESC"
        : columns.has("id")
            ? "`id` DESC"
            : "1 DESC";

    const countRows = await queryMySQL<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM counseling_registration${whereSql}`,
        params
    );
    const total = Number(countRows[0]?.total ?? 0);

    // Build a schema-aware SELECT so the dashboard can read canonical and legacy tables.
    const rows = await queryMySQL<RowDataPacket[]>(
        `SELECT
            ${columnSql(columns, "id", "0")} AS id,
            ${textValueSql(columns, ["full_name"])} AS full_name,
            ${textValueSql(columns, ["email"])} AS email,
            ${textValueSql(columns, ["phone", "phone_number"])} AS phone,
            ${textValueSql(columns, ["phone_number", "phone"])} AS phone_number,
            ${textValueSql(columns, ["birth_place", "place_of_birth"])} AS birth_place,
            ${textValueSql(columns, ["place_of_birth", "birth_place"])} AS place_of_birth,
            ${dateValueSql(columns, ["birth_date", "date_of_birth"])} AS birth_date,
            ${dateValueSql(columns, ["date_of_birth", "birth_date"])} AS date_of_birth,
            ${textValueSql(columns, ["domicile"])} AS domicile,
            ${textValueSql(columns, ["last_education"])} AS last_education,
            ${textValueSql(columns, ["topic", "theme"])} AS topic,
            ${textValueSql(columns, ["theme", "topic"])} AS theme,
            ${textValueSql(columns, ["story"])} AS story,
            ${dateTimeValueSql(columns, ["consultation_time", "appointment_time"])} AS consultation_time,
            ${dateTimeValueSql(columns, ["appointment_time", "consultation_time"])} AS appointment_time,
            ${columnSql(columns, "terms_and_conditions", "0")} AS terms_and_conditions,
            ${columnSql(columns, "created_at", "NULL")} AS created_at
         FROM counseling_registration${whereSql}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    return {
        data: rows as CounselingRegistration[],
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
}

export { VALID_EDUCATION_LEVELS, VALID_TOPICS };
