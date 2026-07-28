import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { queryMySQL } from "./mysql-connection";
import { ensureEnrollmentTables } from "./enrollment-mysql";

export async function ensureAssignmentTables() {
    await ensureEnrollmentTables();
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS assignments (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            class_id BIGINT UNSIGNED NOT NULL,
            creator_id BIGINT UNSIGNED NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            subject VARCHAR(150) NOT NULL,
            deadline_at DATETIME NOT NULL,
            max_score DECIMAL(8,2) NOT NULL,
            attachment_key VARCHAR(1000) NULL,
            allow_resubmission TINYINT(1) NOT NULL DEFAULT 0,
            status ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
            published_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_assignments_class_status (class_id, status, deadline_at),
            CONSTRAINT fk_assignments_class FOREIGN KEY (class_id) REFERENCES enrollment_classes(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS submissions (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            assignment_id BIGINT UNSIGNED NOT NULL,
            student_id BIGINT UNSIGNED NOT NULL,
            version INT UNSIGNED NOT NULL,
            file_key VARCHAR(1000) NOT NULL,
            original_filename VARCHAR(255) NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            size BIGINT UNSIGNED NOT NULL,
            checksum CHAR(64) NOT NULL,
            submitted_at DATETIME NOT NULL,
            status ENUM('pending_upload','submitted','late','resubmitted','graded') NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_submission_version (assignment_id, student_id, version),
            INDEX idx_submissions_assignment_status (assignment_id, status),
            CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS grades (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            submission_id BIGINT UNSIGNED NOT NULL,
            score DECIMAL(8,2) NOT NULL,
            feedback TEXT NULL,
            graded_by BIGINT UNSIGNED NOT NULL,
            graded_at DATETIME NOT NULL,
            published_at DATETIME NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_grade_submission (submission_id),
            CONSTRAINT fk_grades_submission FOREIGN KEY (submission_id) REFERENCES submissions(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS in_app_notifications (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NULL,
            pre_student_id BIGINT UNSIGNED NULL,
            event_type VARCHAR(100) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            payload JSON NOT NULL,
            read_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_notifications_user (user_id, read_at, created_at),
            INDEX idx_notifications_candidate (pre_student_id, read_at, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

export async function teacherCanManageClass(actorId: number, classId: number) {
    await ensureAssignmentTables();
    const rows = await queryMySQL<RowDataPacket[]>(
        "SELECT 1 FROM class_teachers WHERE class_id = ? AND teacher_id = ? AND active = 1 LIMIT 1",
        [classId, actorId]
    );
    return Boolean(rows[0]);
}

export async function studentHasActiveMembership(userId: number, classId: number) {
    await ensureAssignmentTables();
    const rows = await queryMySQL<RowDataPacket[]>(
        "SELECT 1 FROM class_memberships WHERE class_id = ? AND user_id = ? AND status = 'active' LIMIT 1",
        [classId, userId]
    );
    return Boolean(rows[0]);
}

export async function createAssignment(input: {
    classId: number; creatorId: number; title: string; description: string; subject: string;
    deadlineAt: string; maxScore: number; attachmentKey?: string; allowResubmission?: boolean;
}) {
    await ensureAssignmentTables();
    const classRows = await queryMySQL<RowDataPacket[]>("SELECT status FROM enrollment_classes WHERE id = ? LIMIT 1", [input.classId]);
    if (!classRows[0] || classRows[0].status !== "published") throw new Error("CLASS_NOT_ACTIVE");
    const result = await queryMySQL<ResultSetHeader>(
        `INSERT INTO assignments
         (class_id, creator_id, title, description, subject, deadline_at, max_score, attachment_key, allow_resubmission)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [input.classId, input.creatorId, input.title, input.description, input.subject, input.deadlineAt,
            input.maxScore, input.attachmentKey || null, input.allowResubmission ? 1 : 0]
    );
    return result.insertId;
}

export async function publishAssignment(assignmentId: number, actorId: number) {
    await ensureAssignmentTables();
    const rows = await queryMySQL<RowDataPacket[]>(
        `SELECT a.*, c.name AS class_name FROM assignments a
         JOIN enrollment_classes c ON c.id = a.class_id WHERE a.id = ? LIMIT 1`,
        [assignmentId]
    );
    const item = rows[0];
    if (!item || item.status !== "draft") throw new Error("ASSIGNMENT_NOT_PUBLISHABLE");
    await queryMySQL("UPDATE assignments SET status = 'published', published_at = UTC_TIMESTAMP() WHERE id = ?", [assignmentId]);
    await queryMySQL(
        `INSERT INTO notification_outbox (event_type, payload)
         VALUES ('assignment_published', ?)`,
        [JSON.stringify({ assignmentId, classId: item.class_id, title: item.title, deadlineAt: item.deadline_at })]
    );
    await queryMySQL(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data)
         VALUES (?, 'assignment_published', 'assignment', ?, ?)`,
        [actorId, assignmentId, JSON.stringify({ status: "published" })]
    );
}

export async function closeAssignment(assignmentId: number, actorId: number) {
    const result = await queryMySQL<ResultSetHeader>(
        "UPDATE assignments SET status = 'closed' WHERE id = ? AND status = 'published'",
        [assignmentId]
    );
    if (result.affectedRows !== 1) throw new Error("ASSIGNMENT_NOT_CLOSABLE");
    await queryMySQL(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data)
         VALUES (?, 'assignment_closed', 'assignment', ?, ?)`,
        [actorId, assignmentId, JSON.stringify({ status: "closed" })]
    );
}

export async function findAssignment(assignmentId: number) {
    await ensureAssignmentTables();
    const rows = await queryMySQL<RowDataPacket[]>(
        `SELECT a.*, c.name AS class_name, c.code AS class_code
         FROM assignments a JOIN enrollment_classes c ON c.id = a.class_id
         WHERE a.id = ? LIMIT 1`,
        [assignmentId]
    );
    return rows[0] ?? null;
}

export async function listAssignmentsForTeacher(actorId: number | null, classId?: number) {
    await ensureAssignmentTables();
    const teacherJoin = actorId
        ? "JOIN class_teachers ct ON ct.class_id = a.class_id AND ct.teacher_id = ? AND ct.active = 1"
        : "";
    const params: unknown[] = actorId ? [actorId] : [];
    if (classId) params.push(classId);
    return queryMySQL<RowDataPacket[]>(
        `SELECT a.*, c.name AS class_name, c.code AS class_code,
                COUNT(DISTINCT s.student_id) AS submission_count
         FROM assignments a JOIN enrollment_classes c ON c.id = a.class_id
         ${teacherJoin}
         LEFT JOIN submissions s ON s.assignment_id = a.id
         ${classId ? "WHERE a.class_id = ?" : ""}
         GROUP BY a.id ORDER BY a.deadline_at DESC`,
        params
    );
}

export async function listAssignmentsForStudent(userId: number) {
    await ensureAssignmentTables();
    return queryMySQL<RowDataPacket[]>(
        `SELECT a.*, c.name AS class_name, c.code AS class_code,
                latest.id AS submission_id, latest.status AS submission_status,
                g.score, g.feedback
         FROM assignments a
         JOIN enrollment_classes c ON c.id = a.class_id
         JOIN class_memberships m ON m.class_id = a.class_id AND m.user_id = ? AND m.status = 'active'
         LEFT JOIN submissions latest ON latest.id = (
             SELECT s2.id FROM submissions s2 WHERE s2.assignment_id = a.id AND s2.student_id = ?
             ORDER BY s2.version DESC LIMIT 1
         )
         LEFT JOIN grades g ON g.submission_id = latest.id
         WHERE a.status IN ('published','closed') ORDER BY a.deadline_at ASC`,
        [userId, userId]
    );
}

export async function recordSubmission(input: {
    assignmentId: number; studentId: number; fileKey: string; originalFilename: string;
    mimeType: string; size: number; checksum: string;
}) {
    await ensureAssignmentTables();
    const assignment = await findAssignment(input.assignmentId);
    if (!assignment || assignment.status !== "published") throw new Error("ASSIGNMENT_NOT_OPEN");
    if (!(await studentHasActiveMembership(input.studentId, Number(assignment.class_id)))) throw new Error("NOT_CLASS_MEMBER");
    const versions = await queryMySQL<RowDataPacket[]>(
        "SELECT MAX(version) AS version FROM submissions WHERE assignment_id = ? AND student_id = ?",
        [input.assignmentId, input.studentId]
    );
    const previousVersion = Number(versions[0]?.version || 0);
    if (previousVersion && !assignment.allow_resubmission) throw new Error("RESUBMISSION_DISABLED");
    const version = previousVersion + 1;
    const isLate = Date.now() > new Date(assignment.deadline_at).getTime();
    const status = previousVersion ? "resubmitted" : isLate ? "late" : "submitted";
    const result = await queryMySQL<ResultSetHeader>(
        `INSERT INTO submissions
         (assignment_id, student_id, version, file_key, original_filename, mime_type, size, checksum, submitted_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), ?)`,
        [input.assignmentId, input.studentId, version, input.fileKey, input.originalFilename,
            input.mimeType, input.size, input.checksum, status]
    );
    await queryMySQL(
        "INSERT INTO notification_outbox (event_type, payload) VALUES ('submission_received', ?)",
        [JSON.stringify({ submissionId: result.insertId, assignmentId: input.assignmentId, studentId: input.studentId, status })]
    );
    return { id: result.insertId, version, status };
}

export async function listAssignmentSubmissions(assignmentId: number) {
    await ensureAssignmentTables();
    const assignment = await findAssignment(assignmentId);
    if (!assignment) throw new Error("ASSIGNMENT_NOT_FOUND");
    return queryMySQL<RowDataPacket[]>(
        `SELECT m.user_id AS student_id, u.username AS student_name, u.email,
                s.id AS submission_id, s.version, s.original_filename, s.size, s.submitted_at,
                s.status, g.score, g.feedback, g.graded_at
         FROM class_memberships m JOIN users u ON u.id = m.user_id
         LEFT JOIN submissions s ON s.id = (
             SELECT s2.id FROM submissions s2 WHERE s2.assignment_id = ? AND s2.student_id = m.user_id
             ORDER BY s2.version DESC LIMIT 1
         )
         LEFT JOIN grades g ON g.submission_id = s.id
         WHERE m.class_id = ? AND m.status = 'active' ORDER BY u.username`,
        [assignmentId, assignment.class_id]
    );
}

export async function gradeSubmission(input: {
    submissionId: number; score: number; feedback: string; gradedBy: number;
}) {
    await ensureAssignmentTables();
    const rows = await queryMySQL<RowDataPacket[]>(
        `SELECT s.id, s.student_id, s.assignment_id, a.max_score
         FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE s.id = ? LIMIT 1`,
        [input.submissionId]
    );
    const submission = rows[0];
    if (!submission) throw new Error("SUBMISSION_NOT_FOUND");
    if (!Number.isFinite(input.score) || input.score < 0 || input.score > Number(submission.max_score)) throw new Error("INVALID_SCORE");
    await queryMySQL(
        `INSERT INTO grades (submission_id, score, feedback, graded_by, graded_at, published_at)
         VALUES (?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE score = VALUES(score), feedback = VALUES(feedback),
             graded_by = VALUES(graded_by), graded_at = UTC_TIMESTAMP(), published_at = UTC_TIMESTAMP()`,
        [input.submissionId, input.score, input.feedback || null, input.gradedBy]
    );
    await queryMySQL("UPDATE submissions SET status = 'graded' WHERE id = ?", [input.submissionId]);
    await queryMySQL(
        "INSERT INTO notification_outbox (event_type, recipient_user_id, payload) VALUES ('grade_published', ?, ?)",
        [submission.student_id, JSON.stringify({ submissionId: input.submissionId, assignmentId: submission.assignment_id, score: input.score })]
    );
    return { submissionId: input.submissionId, score: input.score };
}

export async function getAcademicReport() {
    await ensureAssignmentTables();
    return queryMySQL<RowDataPacket[]>(
        `SELECT c.id AS class_id, c.code, c.name,
                COUNT(DISTINCT m.user_id) AS active_members,
                COUNT(DISTINCT a.id) AS assignments,
                COUNT(DISTINCT s.id) AS submissions,
                SUM(s.status = 'late') AS late_submissions,
                AVG(g.score / NULLIF(a.max_score, 0) * 100) AS average_percentage
         FROM enrollment_classes c
         LEFT JOIN class_memberships m ON m.class_id = c.id AND m.status = 'active'
         LEFT JOIN assignments a ON a.class_id = c.id
         LEFT JOIN submissions s ON s.assignment_id = a.id
         LEFT JOIN grades g ON g.submission_id = s.id
         GROUP BY c.id ORDER BY c.start_at DESC`
    );
}

export async function processNotificationOutbox(limit = 50) {
    await ensureAssignmentTables();
    const events = await queryMySQL<RowDataPacket[]>(
        "SELECT * FROM notification_outbox WHERE status = 'pending' AND available_at <= UTC_TIMESTAMP() ORDER BY id LIMIT ?",
        [limit]
    );
    for (const event of events) {
        try {
            const payload = typeof event.payload === "string" ? JSON.parse(event.payload) : event.payload;
            const title = String(event.event_type).replaceAll("_", " ");
            const message = JSON.stringify(payload);
            if (event.recipient_user_id || event.recipient_pre_student_id) {
                await queryMySQL(
                    `INSERT INTO in_app_notifications (user_id, pre_student_id, event_type, title, message, payload)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [event.recipient_user_id || null, event.recipient_pre_student_id || null, event.event_type, title, message, JSON.stringify(payload)]
                );
            } else if (event.event_type === "assignment_published") {
                await queryMySQL(
                    `INSERT INTO in_app_notifications (user_id, event_type, title, message, payload)
                     SELECT m.user_id, ?, ?, ?, ? FROM class_memberships m
                     WHERE m.class_id = ? AND m.status = 'active'`,
                    [event.event_type, "Tugas baru dipublikasikan", message, JSON.stringify(payload), payload.classId]
                );
            } else if (event.event_type === "submission_received") {
                await queryMySQL(
                    `INSERT INTO in_app_notifications (user_id, event_type, title, message, payload)
                     SELECT ct.teacher_id, ?, ?, ?, ? FROM class_teachers ct
                     JOIN assignments a ON a.class_id = ct.class_id
                     WHERE a.id = ? AND ct.active = 1`,
                    [event.event_type, "Submission baru diterima", message, JSON.stringify(payload), payload.assignmentId]
                );
            }
            await queryMySQL("UPDATE notification_outbox SET status = 'sent', processed_at = UTC_TIMESTAMP(), attempts = attempts + 1 WHERE id = ?", [event.id]);
        } catch (error) {
            await queryMySQL(
                "UPDATE notification_outbox SET status = 'failed', attempts = attempts + 1, last_error = ? WHERE id = ?",
                [error instanceof Error ? error.message.slice(0, 1000) : "Unknown error", event.id]
            );
        }
    }
    return events.length;
}

export async function listNotifications(userId: number | null, preStudentId: number | null) {
    await processNotificationOutbox();
    return queryMySQL<RowDataPacket[]>(
        `SELECT * FROM in_app_notifications
         WHERE (user_id = ? AND ? IS NOT NULL) OR (pre_student_id = ? AND ? IS NOT NULL)
         ORDER BY created_at DESC LIMIT 50`,
        [userId, userId, preStudentId, preStudentId]
    );
}
