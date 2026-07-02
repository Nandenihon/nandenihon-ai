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
// Table metadata
// ---------------------------------------------------------------------------

let tableColumns: Promise<Set<string>> | null = null;

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

function firstExistingColumn(columns: Set<string>, columnNames: string[]): string | null {
    return columnNames.find((columnName) => columns.has(columnName)) || null;
}

function requiredColumn(columns: Set<string>, columnNames: string[], label: string): string {
    const column = firstExistingColumn(columns, columnNames);

    if (!column) {
        throw new Error(`counseling_registration table is missing a ${label} column`);
    }

    return column;
}

function addInsertColumn(
    insertColumns: string[],
    values: unknown[],
    columns: Set<string>,
    columnNames: string[],
    value: unknown
): void {
    for (const columnName of columnNames) {
        if (!columns.has(columnName)) {
            continue;
        }

        insertColumns.push(columnName);
        values.push(value);
    }
}

function buildCounselingSelectFields(columns: Set<string>): string {
    return [
        `${columnSql(columns, "id", "0")} AS id`,
        `${textValueSql(columns, ["full_name"])} AS full_name`,
        `${textValueSql(columns, ["email"])} AS email`,
        `${textValueSql(columns, ["phone", "phone_number"])} AS phone`,
        `${textValueSql(columns, ["phone_number", "phone"])} AS phone_number`,
        `${textValueSql(columns, ["birth_place", "place_of_birth"])} AS birth_place`,
        `${textValueSql(columns, ["place_of_birth", "birth_place"])} AS place_of_birth`,
        `${dateValueSql(columns, ["birth_date", "date_of_birth"])} AS birth_date`,
        `${dateValueSql(columns, ["date_of_birth", "birth_date"])} AS date_of_birth`,
        `${textValueSql(columns, ["domicile"])} AS domicile`,
        `${textValueSql(columns, ["last_education"])} AS last_education`,
        `${textValueSql(columns, ["topic", "theme"])} AS topic`,
        `${textValueSql(columns, ["theme", "topic"])} AS theme`,
        `${textValueSql(columns, ["story"])} AS story`,
        `${dateTimeValueSql(columns, ["consultation_time", "appointment_time"])} AS consultation_time`,
        `${dateTimeValueSql(columns, ["appointment_time", "consultation_time"])} AS appointment_time`,
        `${columnSql(columns, "terms_and_conditions", "0")} AS terms_and_conditions`,
        `${columnSql(columns, "created_at", "NULL")} AS created_at`,
    ].join(",\n            ");
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export async function createCounselingRegistration(
    input: CreateCounselingInput
): Promise<CounselingRegistration> {
    const columns = await getCounselingTableColumns();

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

    const insertColumns = [
        requiredColumn(columns, ["full_name"], "full name"),
        requiredColumn(columns, ["email"], "email"),
    ];
    const values: unknown[] = [full_name, email];

    addInsertColumn(insertColumns, values, columns, ["phone", "phone_number"], phone);
    addInsertColumn(insertColumns, values, columns, ["birth_place", "place_of_birth"], birth_place);
    addInsertColumn(insertColumns, values, columns, ["birth_date", "date_of_birth"], birth_date);
    addInsertColumn(insertColumns, values, columns, ["domicile"], domicile);
    addInsertColumn(insertColumns, values, columns, ["last_education"], last_education);
    addInsertColumn(insertColumns, values, columns, ["topic", "theme"], topic);
    addInsertColumn(insertColumns, values, columns, ["story"], story);
    addInsertColumn(insertColumns, values, columns, ["consultation_time", "appointment_time"], consultation_time);
    addInsertColumn(insertColumns, values, columns, ["terms_and_conditions"], 1);

    const escapedColumns = insertColumns.map((column) => `\`${column}\``).join(", ");
    const placeholders = insertColumns.map(() => "?").join(", ");
    const result = await queryMySQL<ResultSetHeader>(
        `INSERT INTO counseling_registration (${escapedColumns}) VALUES (${placeholders})`,
        values
    );

    if (columns.has("id") && result.insertId) {
        const rows = await queryMySQL<RowDataPacket[]>(
            `SELECT
                ${buildCounselingSelectFields(columns)}
             FROM counseling_registration
             WHERE \`id\` = ?
             LIMIT 1`,
            [result.insertId]
        );

        if (rows[0]) {
            return rows[0] as CounselingRegistration;
        }
    }

    return {
        id: result.insertId,
        full_name,
        email,
        phone,
        phone_number: phone,
        birth_place,
        place_of_birth: birth_place,
        birth_date,
        date_of_birth: birth_date,
        domicile,
        last_education,
        topic,
        theme: topic,
        story,
        consultation_time,
        appointment_time: consultation_time,
        terms_and_conditions: columns.has("terms_and_conditions") ? 1 : 0,
        created_at: null,
    };
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
            ${buildCounselingSelectFields(columns)}
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
