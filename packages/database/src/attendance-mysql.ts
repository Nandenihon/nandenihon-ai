import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getConnection, queryMySQL } from "./mysql-connection";
import { ensureEnrollmentTables } from "./enrollment-mysql";

export type AttendanceStatus = "present" | "late" | "excused" | "absent";
export const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = ["present", "late", "excused", "absent"];

/** Classes whose attendance can still be recorded; archived and draft classes are read-only. */
const RECORDABLE_CLASS_STATUSES = new Set(["published", "closed"]);

let attendanceTablesReady: Promise<void> | null = null;

/**
 * Attendance for enrollment-portal classes. Replaces the legacy `class_attendance` table, which
 * keyed rows on the marketing `class` table and the legacy `students` table.
 */
export async function ensureAttendanceTables() {
    if (!attendanceTablesReady) {
        attendanceTablesReady = ensureAttendanceTablesUncached().catch((error) => {
            attendanceTablesReady = null;
            throw error;
        });
    }
    await attendanceTablesReady;
}

async function ensureAttendanceTablesUncached() {
    await ensureEnrollmentTables();
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS enrollment_attendance (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            class_id BIGINT UNSIGNED NOT NULL,
            user_id BIGINT UNSIGNED NOT NULL,
            attendance_date DATE NOT NULL,
            status ENUM('present','late','excused','absent') NOT NULL,
            notes VARCHAR(500) NULL,
            recorded_by BIGINT UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_attendance_class_user_date (class_id, user_id, attendance_date),
            INDEX idx_attendance_user (user_id, attendance_date),
            CONSTRAINT fk_attendance_class FOREIGN KEY (class_id) REFERENCES enrollment_classes(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

export function isAttendanceStatus(value: unknown): value is AttendanceStatus {
    return typeof value === "string" && (ATTENDANCE_STATUSES as readonly string[]).includes(value);
}

/** Active members of a class with their attendance on one date (status is null when not recorded yet). */
export async function listClassAttendance(classId: number, date: string) {
    await ensureAttendanceTables();
    return queryMySQL<RowDataPacket[]>(
        `SELECT m.user_id, u.username AS student_name, u.email,
                a.status, a.notes, a.updated_at, recorder.username AS recorded_by_name
         FROM class_memberships m
         JOIN users u ON u.id = m.user_id
         LEFT JOIN enrollment_attendance a
             ON a.class_id = m.class_id AND a.user_id = m.user_id AND a.attendance_date = ?
         LEFT JOIN users recorder ON recorder.id = a.recorded_by
         WHERE m.class_id = ? AND m.status = 'active'
         ORDER BY u.username`,
        [date, classId]
    );
}

/**
 * Upserts attendance for one class session. Every entry must belong to an active member of the class;
 * the whole save is rejected otherwise so a partial roll call is never stored.
 */
export async function saveClassAttendance(input: {
    classId: number; date: string; recordedBy: number;
    entries: { userId: number; status: AttendanceStatus; notes?: string | null }[];
}) {
    await ensureAttendanceTables();
    const connection = await getConnection();
    try {
        await connection.beginTransaction();
        const [classRows] = await connection.query<RowDataPacket[]>(
            "SELECT status FROM enrollment_classes WHERE id = ? LIMIT 1",
            [input.classId]
        );
        if (!classRows[0]) throw new Error("CLASS_NOT_FOUND");
        if (!RECORDABLE_CLASS_STATUSES.has(String(classRows[0].status))) throw new Error("CLASS_NOT_RECORDABLE");

        const [memberRows] = await connection.query<RowDataPacket[]>(
            "SELECT user_id FROM class_memberships WHERE class_id = ? AND status = 'active'",
            [input.classId]
        );
        const memberIds = new Set(memberRows.map((row) => Number(row.user_id)));
        if (input.entries.some((entry) => !memberIds.has(entry.userId))) throw new Error("NOT_CLASS_MEMBER");

        for (const entry of input.entries) {
            await connection.query<ResultSetHeader>(
                `INSERT INTO enrollment_attendance (class_id, user_id, attendance_date, status, notes, recorded_by)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes), recorded_by = VALUES(recorded_by)`,
                [input.classId, entry.userId, input.date, entry.status, entry.notes?.trim() || null, input.recordedBy]
            );
        }
        await connection.query(
            `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data)
             VALUES (?, 'attendance_recorded', 'enrollment_class', ?, ?)`,
            [input.recordedBy, input.classId, JSON.stringify({ date: input.date, entries: input.entries.length })]
        );
        await connection.commit();
        return { saved: input.entries.length };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/** Per-class attendance totals plus the most recent sessions, for the student portal. */
export async function getStudentAttendance(userId: number, recentLimit = 30) {
    await ensureAttendanceTables();
    const classes = await queryMySQL<RowDataPacket[]>(
        `SELECT c.id AS class_id, c.code, c.name, c.level, c.schedule,
                COUNT(a.id) AS total,
                COALESCE(SUM(a.status = 'present'), 0) AS present,
                COALESCE(SUM(a.status = 'late'), 0) AS late,
                COALESCE(SUM(a.status = 'excused'), 0) AS excused,
                COALESCE(SUM(a.status = 'absent'), 0) AS absent
         FROM class_memberships m
         JOIN enrollment_classes c ON c.id = m.class_id
         LEFT JOIN enrollment_attendance a ON a.class_id = m.class_id AND a.user_id = m.user_id
         WHERE m.user_id = ? AND m.status IN ('active','completed')
         GROUP BY c.id, c.code, c.name, c.level, c.schedule
         ORDER BY c.start_at DESC`,
        [userId]
    );
    const recent = await queryMySQL<RowDataPacket[]>(
        `SELECT a.id, DATE_FORMAT(a.attendance_date, '%Y-%m-%d') AS attendance_date, a.status, a.notes,
                c.code AS class_code, c.name AS class_name
         FROM enrollment_attendance a JOIN enrollment_classes c ON c.id = a.class_id
         WHERE a.user_id = ?
         ORDER BY a.attendance_date DESC, a.id DESC
         LIMIT ?`,
        [userId, recentLimit]
    );
    return {
        classes: classes.map((row) => ({
            classId: Number(row.class_id), code: String(row.code), name: String(row.name),
            level: String(row.level), schedule: String(row.schedule ?? ""),
            total: Number(row.total), present: Number(row.present), late: Number(row.late),
            excused: Number(row.excused), absent: Number(row.absent),
        })),
        recent: recent.map((row) => ({
            id: Number(row.id), date: String(row.attendance_date), status: row.status as AttendanceStatus,
            notes: row.notes ? String(row.notes) : null, classCode: String(row.class_code), className: String(row.class_name),
        })),
    };
}

/**
 * Everything needed to export one class's attendance over a date range: the class, its students
 * (active members plus anyone with a record in the range, e.g. students removed later) and every record.
 */
export async function getClassAttendanceExport(classId: number, from: string, to: string) {
    await ensureAttendanceTables();
    const classRows = await queryMySQL<RowDataPacket[]>(
        "SELECT id, code, name, level FROM enrollment_classes WHERE id = ? LIMIT 1",
        [classId]
    );
    if (!classRows[0]) return null;
    const students = await queryMySQL<RowDataPacket[]>(
        `SELECT u.id AS user_id, u.username AS student_name, u.email
         FROM users u
         WHERE u.id IN (
             SELECT m.user_id FROM class_memberships m WHERE m.class_id = ? AND m.status = 'active'
             UNION
             SELECT a.user_id FROM enrollment_attendance a
             WHERE a.class_id = ? AND a.attendance_date BETWEEN ? AND ?
         )
         ORDER BY u.username`,
        [classId, classId, from, to]
    );
    const records = await queryMySQL<RowDataPacket[]>(
        `SELECT a.user_id, DATE_FORMAT(a.attendance_date, '%Y-%m-%d') AS attendance_date, a.status, a.notes,
                recorder.username AS recorded_by_name, a.updated_at
         FROM enrollment_attendance a
         LEFT JOIN users recorder ON recorder.id = a.recorded_by
         WHERE a.class_id = ? AND a.attendance_date BETWEEN ? AND ?
         ORDER BY a.attendance_date, a.user_id`,
        [classId, from, to]
    );
    return {
        classInfo: { id: Number(classRows[0].id), code: String(classRows[0].code), name: String(classRows[0].name), level: String(classRows[0].level) },
        students: students.map((row) => ({ userId: Number(row.user_id), name: String(row.student_name), email: String(row.email) })),
        records: records.map((row) => ({
            userId: Number(row.user_id), date: String(row.attendance_date), status: row.status as AttendanceStatus,
            notes: row.notes ? String(row.notes) : "", recordedBy: row.recorded_by_name ? String(row.recorded_by_name) : "",
            updatedAt: row.updated_at as Date,
        })),
    };
}
