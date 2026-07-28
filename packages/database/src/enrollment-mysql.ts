import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getConnection, queryMySQL } from "./mysql-connection";

export type PortalClassStatus = "draft" | "published" | "closed" | "archived";
export type ApplicationStatus = "draft" | "submitted" | "under_review" | "accepted" | "rejected" | "withdrawn";

export interface PortalClassInput {
    code: string;
    name: string;
    description: string;
    level: string;
    program: string;
    schedule: string;
    capacity: number;
    enrollmentOpenAt: string;
    enrollmentCloseAt: string;
    startAt: string;
    endAt: string;
    ownerTeacherId: number;
}

type ApplicationRow = RowDataPacket & {
    id: number;
    class_id: number;
    pre_student_id: number;
    accepted_user_id: number | null;
    status: ApplicationStatus;
};

type ClassRow = RowDataPacket & {
    id: number;
    capacity: number;
    occupied_seats: number;
    status: PortalClassStatus;
};

async function addColumnIfMissing(table: string, column: string, definition: string) {
    const rows = await queryMySQL<RowDataPacket[]>(
        `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
        [table, column]
    );
    if (!rows[0]) await queryMySQL(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
}

export async function ensureEnrollmentTables(): Promise<void> {
    // Keep the module independently bootstrappable. The registration module
    // owns these records, but admin class setup may run before the first signup.
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS pre_students (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            nickname VARCHAR(100) NULL,
            email VARCHAR(255) NOT NULL,
            phone_number VARCHAR(30) NULL,
            domicile VARCHAR(255) NULL,
            motivation TEXT NULL,
            japanese_level ENUM('BEGINNER','N5','N4','N3','N2','N1') NULL,
            password_hash VARCHAR(255) NULL,
            avatar_url VARCHAR(1000) NULL,
            email_verified_at DATETIME NULL,
            registration_completed_at DATETIME NULL,
            promoted_user_id BIGINT UNSIGNED NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_pre_students_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS enrollment_classes (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            level VARCHAR(50) NOT NULL,
            program VARCHAR(150) NOT NULL,
            schedule TEXT NOT NULL,
            capacity INT UNSIGNED NOT NULL,
            occupied_seats INT UNSIGNED NOT NULL DEFAULT 0,
            enrollment_open_at DATETIME NOT NULL,
            enrollment_close_at DATETIME NOT NULL,
            start_at DATETIME NOT NULL,
            end_at DATETIME NOT NULL,
            status ENUM('draft','published','closed','archived') NOT NULL DEFAULT 'draft',
            enrollment_closed TINYINT(1) NOT NULL DEFAULT 0,
            owner_teacher_id BIGINT UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_enrollment_classes_code (code),
            INDEX idx_enrollment_classes_catalog (status, enrollment_closed, enrollment_open_at, enrollment_close_at),
            INDEX idx_enrollment_classes_owner (owner_teacher_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS class_teachers (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            class_id BIGINT UNSIGNED NOT NULL,
            teacher_id BIGINT UNSIGNED NOT NULL,
            role ENUM('owner','teacher','assistant') NOT NULL DEFAULT 'teacher',
            active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_class_teacher (class_id, teacher_id),
            INDEX idx_class_teachers_teacher (teacher_id, active),
            CONSTRAINT fk_class_teachers_class FOREIGN KEY (class_id) REFERENCES enrollment_classes(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS applications (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            class_id BIGINT UNSIGNED NOT NULL,
            pre_student_id BIGINT UNSIGNED NOT NULL,
            accepted_user_id BIGINT UNSIGNED NULL,
            status ENUM('draft','submitted','under_review','accepted','rejected','withdrawn') NOT NULL DEFAULT 'draft',
            profile_snapshot JSON NOT NULL,
            documents JSON NULL,
            submitted_at DATETIME NULL,
            decided_at DATETIME NULL,
            decided_by BIGINT UNSIGNED NULL,
            rejection_reason TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_application_class_candidate (class_id, pre_student_id),
            INDEX idx_applications_queue (status, submitted_at),
            CONSTRAINT fk_applications_class FOREIGN KEY (class_id) REFERENCES enrollment_classes(id),
            CONSTRAINT fk_applications_candidate FOREIGN KEY (pre_student_id) REFERENCES pre_students(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS user_roles (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT UNSIGNED NOT NULL,
            role VARCHAR(50) NOT NULL,
            source VARCHAR(100) NOT NULL,
            granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_user_role (user_id, role),
            INDEX idx_user_roles_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS class_groups (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            class_id BIGINT UNSIGNED NOT NULL,
            name VARCHAR(255) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_class_group_class (class_id),
            CONSTRAINT fk_class_groups_class FOREIGN KEY (class_id) REFERENCES enrollment_classes(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS class_memberships (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            group_id BIGINT UNSIGNED NOT NULL,
            class_id BIGINT UNSIGNED NOT NULL,
            user_id BIGINT UNSIGNED NOT NULL,
            status ENUM('active','completed','removed') NOT NULL DEFAULT 'active',
            joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME NULL,
            removed_at DATETIME NULL,
            source_application_id BIGINT UNSIGNED NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_membership_class_user (class_id, user_id),
            INDEX idx_memberships_group_status (group_id, status),
            INDEX idx_memberships_user_status (user_id, status),
            CONSTRAINT fk_memberships_group FOREIGN KEY (group_id) REFERENCES class_groups(id),
            CONSTRAINT fk_memberships_class FOREIGN KEY (class_id) REFERENCES enrollment_classes(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            actor_id BIGINT NULL,
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id BIGINT UNSIGNED NOT NULL,
            before_data JSON NULL,
            after_data JSON NULL,
            notes TEXT NULL,
            request_id VARCHAR(100) NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_audit_entity (entity_type, entity_id),
            INDEX idx_audit_actor (actor_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS notification_outbox (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            event_type VARCHAR(100) NOT NULL,
            recipient_user_id BIGINT NULL,
            recipient_pre_student_id BIGINT UNSIGNED NULL,
            payload JSON NOT NULL,
            status ENUM('pending','processing','sent','failed') NOT NULL DEFAULT 'pending',
            attempts INT UNSIGNED NOT NULL DEFAULT 0,
            available_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            processed_at DATETIME NULL,
            last_error TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_outbox_dispatch (status, available_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS idempotency_keys (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            scope VARCHAR(100) NOT NULL,
            idempotency_key VARCHAR(255) NOT NULL,
            entity_id BIGINT UNSIGNED NOT NULL,
            response_data JSON NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_idempotency_scope_key (scope, idempotency_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await addColumnIfMissing("pre_students", "promoted_user_id", "promoted_user_id BIGINT UNSIGNED NULL AFTER registration_completed_at");
}

export async function createPortalClass(input: PortalClassInput, actorId: number) {
    await ensureEnrollmentTables();
    const result = await queryMySQL<ResultSetHeader>(
        `INSERT INTO enrollment_classes
         (code, name, description, level, program, schedule, capacity,
          enrollment_open_at, enrollment_close_at, start_at, end_at, owner_teacher_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [input.code.toUpperCase(), input.name, input.description, input.level, input.program, input.schedule,
            input.capacity, input.enrollmentOpenAt, input.enrollmentCloseAt, input.startAt, input.endAt, input.ownerTeacherId]
    );
    await queryMySQL("INSERT INTO class_teachers (class_id, teacher_id, role) VALUES (?, ?, 'owner')", [result.insertId, input.ownerTeacherId]);
    await queryMySQL("INSERT INTO class_groups (class_id, name) VALUES (?, ?)", [result.insertId, `${input.name} — Main Group`]);
    await queryMySQL(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data)
         VALUES (?, 'class_created', 'class', ?, ?)`,
        [actorId, result.insertId, JSON.stringify(input)]
    );
    return findPortalClass(result.insertId);
}

export async function findPortalClass(classId: number) {
    await ensureEnrollmentTables();
    const rows = await queryMySQL<RowDataPacket[]>(
        `SELECT c.*, u.username AS teacher_name, GREATEST(c.capacity - c.occupied_seats, 0) AS available_seats
         FROM enrollment_classes c LEFT JOIN users u ON u.id = c.owner_teacher_id
         WHERE c.id = ? LIMIT 1`,
        [classId]
    );
    return rows[0] ?? null;
}

export async function listPortalClasses(options: { publicOnly?: boolean; search?: string; status?: string; teacherId?: number; level?: string }) {
    await ensureEnrollmentTables();
    const where: string[] = [];
    const params: unknown[] = [];
    if (options.publicOnly) {
        where.push("c.status = 'published'", "c.enrollment_closed = 0", "UTC_TIMESTAMP() BETWEEN c.enrollment_open_at AND c.enrollment_close_at", "c.occupied_seats < c.capacity");
    }
    if (options.search) {
        where.push("(c.name LIKE ? OR c.code LIKE ? OR c.description LIKE ?)");
        const term = `%${options.search}%`; params.push(term, term, term);
    }
    if (options.status) { where.push("c.status = ?"); params.push(options.status); }
    if (options.teacherId) { where.push("EXISTS (SELECT 1 FROM class_teachers ct WHERE ct.class_id = c.id AND ct.teacher_id = ? AND ct.active = 1)"); params.push(options.teacherId); }
    if (options.level) { where.push("c.level = ?"); params.push(options.level); }
    return queryMySQL<RowDataPacket[]>(
        `SELECT c.*, u.username AS teacher_name, GREATEST(c.capacity - c.occupied_seats, 0) AS available_seats
         FROM enrollment_classes c LEFT JOIN users u ON u.id = c.owner_teacher_id
         ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
         ORDER BY c.start_at ASC, c.id DESC`,
        params
    );
}

export async function updatePortalClass(classId: number, input: Partial<PortalClassInput>, actorId: number) {
    await ensureEnrollmentTables();
    const before = await findPortalClass(classId);
    if (!before) throw new Error("CLASS_NOT_FOUND");
    const mapping: Record<string, string> = {
        code: "code", name: "name", description: "description", level: "level", program: "program",
        schedule: "schedule", capacity: "capacity", enrollmentOpenAt: "enrollment_open_at",
        enrollmentCloseAt: "enrollment_close_at", startAt: "start_at", endAt: "end_at",
        ownerTeacherId: "owner_teacher_id",
    };
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, column] of Object.entries(mapping)) {
        const value = input[key as keyof PortalClassInput];
        if (value !== undefined) { fields.push(`\`${column}\` = ?`); values.push(key === "code" ? String(value).toUpperCase() : value); }
    }
    if (!fields.length) return before;
    if (input.capacity !== undefined && input.capacity < Number(before.occupied_seats)) throw new Error("CAPACITY_BELOW_OCCUPIED");
    values.push(classId);
    await queryMySQL(`UPDATE enrollment_classes SET ${fields.join(", ")} WHERE id = ?`, values);
    if (input.ownerTeacherId !== undefined) {
        await queryMySQL(
            `INSERT INTO class_teachers (class_id, teacher_id, role, active) VALUES (?, ?, 'owner', 1)
             ON DUPLICATE KEY UPDATE role = 'owner', active = 1`,
            [classId, input.ownerTeacherId]
        );
    }
    const after = await findPortalClass(classId);
    await queryMySQL(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, before_data, after_data)
         VALUES (?, 'class_updated', 'class', ?, ?, ?)`,
        [actorId, classId, JSON.stringify(before), JSON.stringify(after)]
    );
    return after;
}

export async function transitionPortalClass(classId: number, action: "publish" | "close-enrollment" | "close" | "archive", actorId: number) {
    const current = await findPortalClass(classId);
    if (!current) throw new Error("CLASS_NOT_FOUND");
    if (action === "publish") {
        if (!current.code || !current.name || !current.description || !current.level || !current.program || !current.schedule || !current.owner_teacher_id) throw new Error("CLASS_INCOMPLETE");
        if (Number(current.capacity) < 1 || new Date(current.enrollment_open_at) >= new Date(current.enrollment_close_at) || new Date(current.start_at) >= new Date(current.end_at)) throw new Error("INVALID_CLASS_DATES");
        await queryMySQL("UPDATE enrollment_classes SET status = 'published', enrollment_closed = 0 WHERE id = ?", [classId]);
    } else if (action === "close-enrollment") {
        await queryMySQL("UPDATE enrollment_classes SET enrollment_closed = 1 WHERE id = ?", [classId]);
    } else if (action === "close") {
        await queryMySQL("UPDATE enrollment_classes SET status = 'closed', enrollment_closed = 1 WHERE id = ?", [classId]);
    } else {
        await queryMySQL("UPDATE enrollment_classes SET status = 'archived', enrollment_closed = 1 WHERE id = ?", [classId]);
    }
    const after = await findPortalClass(classId);
    await queryMySQL(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, before_data, after_data)
         VALUES (?, ?, 'class', ?, ?, ?)`,
        [actorId, `class_${action.replace("-", "_")}`, classId, JSON.stringify(current), JSON.stringify(after)]
    );
    return after;
}

export async function resolvePreStudentId(sessionId: number, email: string): Promise<number | null> {
    await ensureEnrollmentTables();
    const directId = sessionId < 0 ? Math.abs(sessionId) : null;
    const rows = await queryMySQL<RowDataPacket[]>(
        directId
            ? "SELECT id FROM pre_students WHERE id = ? AND email = ? AND registration_completed_at IS NOT NULL LIMIT 1"
            : `SELECT id, promoted_user_id FROM pre_students
               WHERE email = ? AND registration_completed_at IS NOT NULL
                 AND (promoted_user_id = ? OR promoted_user_id IS NULL)
               ORDER BY promoted_user_id = ? DESC
               LIMIT 1`,
        directId ? [directId, email] : [email, sessionId, sessionId]
    );
    if (!rows[0]) return null;
    const preStudentId = Number(rows[0].id);
    if (!directId && !rows[0].promoted_user_id) {
        await queryMySQL(
            "UPDATE pre_students SET promoted_user_id = ? WHERE id = ? AND promoted_user_id IS NULL",
            [sessionId, preStudentId]
        );
    }
    return preStudentId;
}

export async function submitApplication(classId: number, preStudentId: number, documents: unknown, requestId?: string) {
    await ensureEnrollmentTables();
    const candidates = await queryMySQL<RowDataPacket[]>("SELECT * FROM pre_students WHERE id = ? LIMIT 1", [preStudentId]);
    const candidate = candidates[0];
    if (!candidate) throw new Error("CANDIDATE_NOT_FOUND");
    const classItem = await findPortalClass(classId);
    if (!classItem || classItem.status !== "published" || classItem.enrollment_closed || Number(classItem.available_seats) < 1) throw new Error("CLASS_NOT_OPEN");
    const existing = await queryMySQL<RowDataPacket[]>("SELECT id, status FROM applications WHERE class_id = ? AND pre_student_id = ? LIMIT 1", [classId, preStudentId]);
    if (existing[0] && !["rejected", "withdrawn"].includes(String(existing[0].status))) throw new Error("ACTIVE_APPLICATION_EXISTS");
    const snapshot = {
        fullName: candidate.full_name, nickname: candidate.nickname, email: candidate.email,
        phoneNumber: candidate.phone_number, domicile: candidate.domicile,
        motivation: candidate.motivation, japaneseLevel: candidate.japanese_level,
    };
    let applicationId: number;
    if (existing[0]) {
        applicationId = Number(existing[0].id);
        await queryMySQL(
            `UPDATE applications SET status = 'submitted', profile_snapshot = ?, documents = ?,
             submitted_at = UTC_TIMESTAMP(), decided_at = NULL, decided_by = NULL, rejection_reason = NULL WHERE id = ?`,
            [JSON.stringify(snapshot), JSON.stringify(documents ?? []), applicationId]
        );
    } else {
        const result = await queryMySQL<ResultSetHeader>(
            `INSERT INTO applications (class_id, pre_student_id, status, profile_snapshot, documents, submitted_at)
             VALUES (?, ?, 'submitted', ?, ?, UTC_TIMESTAMP())`,
            [classId, preStudentId, JSON.stringify(snapshot), JSON.stringify(documents ?? [])]
        );
        applicationId = result.insertId;
    }
    await queryMySQL(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data, request_id)
         VALUES (?, 'application_submitted', 'application', ?, ?, ?)`,
        [-preStudentId, applicationId, JSON.stringify({ classId, status: "submitted" }), requestId ?? null]
    );
    await queryMySQL("INSERT INTO notification_outbox (event_type, payload) VALUES ('application_submitted', ?)", [JSON.stringify({ applicationId, classId, preStudentId })]);
    return applicationId;
}

export async function listCandidateApplications(preStudentId: number) {
    await ensureEnrollmentTables();
    return queryMySQL<RowDataPacket[]>(
        `SELECT a.*, c.code AS class_code, c.name AS class_name, c.start_at, c.schedule
         FROM applications a JOIN enrollment_classes c ON c.id = a.class_id
         WHERE a.pre_student_id = ? ORDER BY a.created_at DESC`,
        [preStudentId]
    );
}

export async function withdrawApplication(applicationId: number, preStudentId: number) {
    const result = await queryMySQL<ResultSetHeader>(
        `UPDATE applications SET status = 'withdrawn', updated_at = UTC_TIMESTAMP()
         WHERE id = ? AND pre_student_id = ? AND status IN ('draft','submitted')`,
        [applicationId, preStudentId]
    );
    if (result.affectedRows !== 1) throw new Error("APPLICATION_NOT_WITHDRAWABLE");
}

export async function listApplications(options: { status?: string; classId?: number; search?: string }) {
    await ensureEnrollmentTables();
    const where: string[] = [];
    const params: unknown[] = [];
    if (options.status) { where.push("a.status = ?"); params.push(options.status); }
    if (options.classId) { where.push("a.class_id = ?"); params.push(options.classId); }
    if (options.search) {
        where.push("(p.full_name LIKE ? OR p.email LIKE ? OR c.name LIKE ?)");
        const term = `%${options.search}%`; params.push(term, term, term);
    }
    return queryMySQL<RowDataPacket[]>(
        `SELECT a.*, p.full_name, p.nickname, p.email, p.phone_number, p.domicile, p.japanese_level,
                c.code AS class_code, c.name AS class_name
         FROM applications a JOIN pre_students p ON p.id = a.pre_student_id
         JOIN enrollment_classes c ON c.id = a.class_id
         ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
         ORDER BY FIELD(a.status, 'submitted','under_review','accepted','rejected','withdrawn'), a.submitted_at ASC`,
        params
    );
}

export async function reviewApplication(applicationId: number, actorId: number) {
    const result = await queryMySQL<ResultSetHeader>("UPDATE applications SET status = 'under_review' WHERE id = ? AND status = 'submitted'", [applicationId]);
    if (result.affectedRows !== 1) throw new Error("INVALID_APPLICATION_TRANSITION");
    await queryMySQL(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, before_data, after_data)
         VALUES (?, 'application_under_review', 'application', ?, ?, ?)`,
        [actorId, applicationId, JSON.stringify({ status: "submitted" }), JSON.stringify({ status: "under_review" })]
    );
}

export async function rejectApplication(applicationId: number, actorId: number, reason: string) {
    if (!reason.trim()) throw new Error("REJECTION_REASON_REQUIRED");
    const result = await queryMySQL<ResultSetHeader>(
        `UPDATE applications SET status = 'rejected', decided_at = UTC_TIMESTAMP(), decided_by = ?, rejection_reason = ?
         WHERE id = ? AND status IN ('submitted','under_review')`,
        [actorId, reason.trim(), applicationId]
    );
    if (result.affectedRows !== 1) throw new Error("INVALID_APPLICATION_TRANSITION");
    const rows = await queryMySQL<RowDataPacket[]>("SELECT pre_student_id, class_id FROM applications WHERE id = ?", [applicationId]);
    await queryMySQL(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data)
         VALUES (?, 'application_rejected', 'application', ?, ?)`,
        [actorId, applicationId, JSON.stringify({ status: "rejected", reason: reason.trim() })]
    );
    await queryMySQL(
        `INSERT INTO notification_outbox (event_type, recipient_pre_student_id, payload)
         VALUES ('application_rejected', ?, ?)`,
        [rows[0].pre_student_id, JSON.stringify({ applicationId, classId: rows[0].class_id, reason: reason.trim() })]
    );
}

async function promoteCandidate(connection: PoolConnection, preStudentId: number): Promise<number> {
    const [candidateRows] = await connection.query<RowDataPacket[]>("SELECT * FROM pre_students WHERE id = ? FOR UPDATE", [preStudentId]);
    const candidate = candidateRows[0];
    if (!candidate) throw new Error("CANDIDATE_NOT_FOUND");
    if (candidate.promoted_user_id) return Number(candidate.promoted_user_id);
    const [existingUsers] = await connection.query<RowDataPacket[]>("SELECT id FROM users WHERE email = ? LIMIT 1", [candidate.email]);
    let userId = existingUsers[0] ? Number(existingUsers[0].id) : 0;
    if (!userId) {
        const [result] = await connection.query<ResultSetHeader>(
            "INSERT INTO users (username, email, password, role, is_active) VALUES (?, ?, ?, 'student', 1)",
            [candidate.nickname || candidate.full_name, candidate.email, candidate.password_hash]
        );
        userId = result.insertId;
    }
    await connection.query(
        `INSERT INTO user_roles (user_id, role, source) VALUES (?, 'student', 'accepted_application')
         ON DUPLICATE KEY UPDATE source = VALUES(source)`,
        [userId]
    );
    await connection.query("UPDATE pre_students SET promoted_user_id = ? WHERE id = ?", [userId, preStudentId]);
    return userId;
}

export async function acceptApplication(applicationId: number, actorId: number, idempotencyKey: string, requestId?: string) {
    await ensureEnrollmentTables();
    const connection = await getConnection();
    try {
        await connection.beginTransaction();
        const [cachedRows] = await connection.query<RowDataPacket[]>(
            "SELECT response_data FROM idempotency_keys WHERE scope = 'application_accept' AND idempotency_key = ? LIMIT 1",
            [idempotencyKey]
        );
        if (cachedRows[0]) {
            await connection.commit();
            return typeof cachedRows[0].response_data === "string" ? JSON.parse(cachedRows[0].response_data) : cachedRows[0].response_data;
        }
        const [applicationRows] = await connection.query<ApplicationRow[]>("SELECT * FROM applications WHERE id = ? FOR UPDATE", [applicationId]);
        const application = applicationRows[0];
        if (!application) throw new Error("APPLICATION_NOT_FOUND");
        if (application.status === "accepted" && application.accepted_user_id) {
            const response = { applicationId, userId: application.accepted_user_id, alreadyAccepted: true };
            await connection.query(
                `INSERT IGNORE INTO idempotency_keys (scope, idempotency_key, entity_id, response_data)
                 VALUES ('application_accept', ?, ?, ?)`,
                [idempotencyKey, applicationId, JSON.stringify(response)]
            );
            await connection.commit();
            return response;
        }
        if (!["submitted", "under_review"].includes(application.status)) throw new Error("INVALID_APPLICATION_TRANSITION");
        const [classRows] = await connection.query<ClassRow[]>("SELECT * FROM enrollment_classes WHERE id = ? FOR UPDATE", [application.class_id]);
        const classItem = classRows[0];
        if (!classItem || classItem.status !== "published") throw new Error("CLASS_NOT_AVAILABLE");
        const userId = await promoteCandidate(connection, application.pre_student_id);
        const [membershipRows] = await connection.query<RowDataPacket[]>(
            "SELECT id, status FROM class_memberships WHERE class_id = ? AND user_id = ? FOR UPDATE",
            [application.class_id, userId]
        );
        const membership = membershipRows[0];
        const needsSeat = !membership || membership.status !== "active";
        if (needsSeat && Number(classItem.occupied_seats) >= Number(classItem.capacity)) throw new Error("CLASS_FULL");
        const [groupRows] = await connection.query<RowDataPacket[]>("SELECT id FROM class_groups WHERE class_id = ? LIMIT 1", [application.class_id]);
        let groupId = groupRows[0] ? Number(groupRows[0].id) : 0;
        if (!groupId) {
            const [groupResult] = await connection.query<ResultSetHeader>("INSERT INTO class_groups (class_id, name) VALUES (?, ?)", [application.class_id, `Class ${application.class_id} — Main Group`]);
            groupId = groupResult.insertId;
        }
        await connection.query(
            `INSERT INTO class_memberships (group_id, class_id, user_id, status, source_application_id)
             VALUES (?, ?, ?, 'active', ?)
             ON DUPLICATE KEY UPDATE group_id = VALUES(group_id), status = 'active',
                 source_application_id = VALUES(source_application_id), joined_at = UTC_TIMESTAMP(),
                 removed_at = NULL, completed_at = NULL`,
            [groupId, application.class_id, userId, applicationId]
        );
        if (needsSeat) await connection.query("UPDATE enrollment_classes SET occupied_seats = occupied_seats + 1 WHERE id = ?", [application.class_id]);
        await connection.query(
            `UPDATE applications SET status = 'accepted', accepted_user_id = ?, decided_at = UTC_TIMESTAMP(),
             decided_by = ?, rejection_reason = NULL WHERE id = ?`,
            [userId, actorId, applicationId]
        );
        const response = { applicationId, userId, membershipActive: true, alreadyAccepted: false };
        await connection.query(
            `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, before_data, after_data, request_id)
             VALUES (?, 'application_accepted', 'application', ?, ?, ?, ?)`,
            [actorId, applicationId, JSON.stringify({ status: application.status }), JSON.stringify(response), requestId ?? null]
        );
        await connection.query(
            `INSERT INTO notification_outbox (event_type, recipient_user_id, recipient_pre_student_id, payload)
             VALUES ('application_accepted', ?, ?, ?)`,
            [userId, application.pre_student_id, JSON.stringify({ applicationId, classId: application.class_id, userId })]
        );
        await connection.query(
            `INSERT INTO idempotency_keys (scope, idempotency_key, entity_id, response_data)
             VALUES ('application_accept', ?, ?, ?)`,
            [idempotencyKey, applicationId, JSON.stringify(response)]
        );
        await connection.commit();
        return response;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function listClassMembers(classId: number) {
    await ensureEnrollmentTables();
    return queryMySQL<RowDataPacket[]>(
        `SELECT m.id, m.user_id, m.status, m.joined_at, m.completed_at, m.removed_at,
                u.username AS name, u.email, m.source_application_id
         FROM class_memberships m JOIN users u ON u.id = m.user_id
         WHERE m.class_id = ? ORDER BY m.status, u.username`,
        [classId]
    );
}

export async function listClassTeachers(classId: number) {
    await ensureEnrollmentTables();
    return queryMySQL<RowDataPacket[]>(
        `SELECT ct.id, ct.teacher_id, ct.role, ct.active, ct.created_at,
                u.username AS name, u.email
         FROM class_teachers ct JOIN users u ON u.id = ct.teacher_id
         WHERE ct.class_id = ? AND ct.active = 1
         ORDER BY FIELD(ct.role, 'owner', 'teacher', 'assistant'), u.username`,
        [classId]
    );
}

export async function assignClassTeacher(classId: number, teacherId: number, actorId: number, role: "owner" | "teacher" | "assistant" = "teacher") {
    await ensureEnrollmentTables();
    const users = await queryMySQL<RowDataPacket[]>(
        "SELECT id, username, email, role FROM users WHERE id = ? AND role = 'teacher' AND is_active = 1 LIMIT 1",
        [teacherId]
    );
    if (!users[0]) throw new Error("TEACHER_NOT_FOUND");
    const classItem = await findPortalClass(classId);
    if (!classItem) throw new Error("CLASS_NOT_FOUND");
    await queryMySQL(
        `INSERT INTO class_teachers (class_id, teacher_id, role, active)
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE role = VALUES(role), active = 1`,
        [classId, teacherId, role]
    );
    if (role === "owner") {
        await queryMySQL("UPDATE enrollment_classes SET owner_teacher_id = ? WHERE id = ?", [teacherId, classId]);
    }
    await queryMySQL(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data)
         VALUES (?, 'class_teacher_assigned', 'class', ?, ?)`,
        [actorId, classId, JSON.stringify({ teacherId, role })]
    );
    return users[0];
}

export async function removeClassTeacher(classId: number, teacherId: number, actorId: number) {
    await ensureEnrollmentTables();
    const classItem = await findPortalClass(classId);
    if (!classItem) throw new Error("CLASS_NOT_FOUND");
    if (Number(classItem.owner_teacher_id) === teacherId) throw new Error("OWNER_CANNOT_BE_REMOVED");
    const result = await queryMySQL<ResultSetHeader>(
        "UPDATE class_teachers SET active = 0 WHERE class_id = ? AND teacher_id = ? AND active = 1",
        [classId, teacherId]
    );
    if (result.affectedRows !== 1) throw new Error("TEACHER_ASSIGNMENT_NOT_FOUND");
    await queryMySQL(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data)
         VALUES (?, 'class_teacher_removed', 'class', ?, ?)`,
        [actorId, classId, JSON.stringify({ teacherId })]
    );
}

export async function listAvailableTeachers(search?: string) {
    await ensureEnrollmentTables();
    const params: unknown[] = [];
    let where = "WHERE role = 'teacher' AND is_active = 1";
    if (search) {
        where += " AND (username LIKE ? OR email LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }
    return queryMySQL<RowDataPacket[]>(
        `SELECT id, username AS name, email FROM users ${where} ORDER BY username LIMIT 100`,
        params
    );
}
