import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "./mysql-connection";

// ─── Enums / Literals ─────────────────────────────────────────────────────────

export type CourseLevel = "N5" | "N4" | "N3";
export type EnrollmentStatus = "active" | "completed";
export type LessonContentType = "video" | "text" | "quiz";

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface LmsCourse {
    id: number;
    title: string;
    level: CourseLevel;
    description: string | null;
    thumbnail: string | null;
}

export interface LmsEnrollment {
    id: number;
    studentId: number;
    courseId: number;
    status: EnrollmentStatus;
    enrolledAt: Date;
}

export interface LmsLesson {
    id: number;
    courseId: number;
    title: string;
    contentType: LessonContentType;
    videoUrl: string | null;
    bodyText: string | null;
    orderIndex: number;
}

export interface LmsLessonProgress {
    id: number;
    studentId: number;
    lessonId: number;
    isCompleted: boolean;
    completedAt: Date | null;
}

export interface LmsQuizGrade {
    id: number;
    studentId: number;
    lessonId: number;
    score: number;
    submittedAt: Date;
}

// Aggregated dashboard data
export interface StudentDashboard {
    enrolledCourses: (LmsCourse & {
        enrollmentStatus: EnrollmentStatus;
        totalLessons: number;
        completedLessons: number;
        progressPercent: number;
    })[];
    overallProgressPercent: number;
}

// ─── Row Types (internal) ─────────────────────────────────────────────────────

interface CourseRow extends RowDataPacket {
    id: number;
    title: string;
    level: CourseLevel;
    description: string | null;
    thumbnail: string | null;
}

interface EnrollmentRow extends RowDataPacket {
    id: number;
    student_id: number;
    course_id: number;
    status: EnrollmentStatus;
    enrolled_at: Date;
}

interface LessonRow extends RowDataPacket {
    id: number;
    course_id: number;
    title: string;
    content_type: LessonContentType;
    video_url: string | null;
    body_text: string | null;
    order_index: number;
}

interface ProgressRow extends RowDataPacket {
    id: number;
    student_id: number;
    lesson_id: number;
    is_completed: number;
    completed_at: Date | null;
}

interface GradeRow extends RowDataPacket {
    id: number;
    student_id: number;
    lesson_id: number;
    score: number;
    submitted_at: Date;
}

export async function ensureLmsTables(): Promise<void> {
    return;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapCourse(row: CourseRow): LmsCourse {
    return {
        id: row.id,
        title: row.title,
        level: row.level,
        description: row.description,
        thumbnail: row.thumbnail,
    };
}

function mapLesson(row: LessonRow): LmsLesson {
    return {
        id: row.id,
        courseId: row.course_id,
        title: row.title,
        contentType: row.content_type,
        videoUrl: row.video_url,
        bodyText: row.body_text,
        orderIndex: row.order_index,
    };
}

function mapProgress(row: ProgressRow): LmsLessonProgress {
    return {
        id: row.id,
        studentId: row.student_id,
        lessonId: row.lesson_id,
        isCompleted: Boolean(row.is_completed),
        completedAt: row.completed_at,
    };
}

// ─── Course Queries ───────────────────────────────────────────────────────────

/** List all courses (for admin/teacher) */
export async function listCourses(): Promise<LmsCourse[]> {
    const rows = await queryMySQL<CourseRow[]>(
        "SELECT * FROM courses ORDER BY level, title"
    );
    return rows.map(mapCourse);
}

/** Get a single course by ID */
export async function findCourseById(courseId: number): Promise<LmsCourse | null> {
    const rows = await queryMySQL<CourseRow[]>(
        "SELECT * FROM courses WHERE id = ? LIMIT 1",
        [courseId]
    );
    return rows.length > 0 ? mapCourse(rows[0]) : null;
}

/** Create a course (teacher/admin) */
export async function createCourse(input: {
    title: string;
    level: CourseLevel;
    description?: string;
    thumbnail?: string;
}): Promise<LmsCourse> {
    const result = await queryMySQL<ResultSetHeader>(
        "INSERT INTO courses (title, level, description, thumbnail) VALUES (?, ?, ?, ?)",
        [input.title, input.level, input.description ?? null, input.thumbnail ?? null]
    );
    const rows = await queryMySQL<CourseRow[]>(
        "SELECT * FROM courses WHERE id = ? LIMIT 1",
        [result.insertId]
    );
    return mapCourse(rows[0]);
}

/** Update a course */
export async function updateCourse(
    courseId: number,
    input: Partial<{ title: string; level: CourseLevel; description: string; thumbnail: string }>
): Promise<void> {
    const fields = Object.keys(input)
        .map((k) => `\`${k}\` = ?`)
        .join(", ");
    const values = [...Object.values(input), courseId];
    await queryMySQL(`UPDATE courses SET ${fields} WHERE id = ?`, values);
}

/** Delete a course (cascades to lessons, progress, grades) */
export async function deleteCourse(courseId: number): Promise<void> {
    await queryMySQL("DELETE FROM courses WHERE id = ?", [courseId]);
}

// ─── Enrollment Queries ───────────────────────────────────────────────────────

/** Get all courses a student is enrolled in */
export async function findEnrollmentsByStudent(studentId: number): Promise<LmsEnrollment[]> {
    const rows = await queryMySQL<EnrollmentRow[]>(
        "SELECT * FROM enrollments WHERE student_id = ? ORDER BY enrolled_at DESC",
        [studentId]
    );
    return rows.map((r) => ({
        id: r.id,
        studentId: r.student_id,
        courseId: r.course_id,
        status: r.status,
        enrolledAt: r.enrolled_at,
    }));
}

/** Enroll a student in a course (idempotent) */
export async function enrollStudent(studentId: number, courseId: number): Promise<void> {
    await queryMySQL(
        `INSERT INTO enrollments (student_id, course_id, status)
         VALUES (?, ?, 'active')
         ON DUPLICATE KEY UPDATE status = IF(status = 'completed', 'completed', 'active')`,
        [studentId, courseId]
    );
}

/** Update enrollment status */
export async function updateEnrollmentStatus(
    studentId: number,
    courseId: number,
    status: EnrollmentStatus
): Promise<void> {
    await queryMySQL(
        "UPDATE enrollments SET status = ? WHERE student_id = ? AND course_id = ?",
        [status, studentId, courseId]
    );
}

// ─── Lesson Queries ───────────────────────────────────────────────────────────

/** Get all lessons for a course, ordered */
export async function findLessonsByCourse(courseId: number): Promise<LmsLesson[]> {
    const rows = await queryMySQL<LessonRow[]>(
        "SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC, id ASC",
        [courseId]
    );
    return rows.map(mapLesson);
}

/** Get a single lesson by ID */
export async function findLessonById(lessonId: number): Promise<LmsLesson | null> {
    const rows = await queryMySQL<LessonRow[]>(
        "SELECT * FROM lessons WHERE id = ? LIMIT 1",
        [lessonId]
    );
    return rows.length > 0 ? mapLesson(rows[0]) : null;
}

/** Create a lesson */
export async function createLesson(input: {
    courseId: number;
    title: string;
    contentType: LessonContentType;
    videoUrl?: string;
    bodyText?: string;
    orderIndex: number;
}): Promise<LmsLesson> {
    const result = await queryMySQL<ResultSetHeader>(
        `INSERT INTO lessons (course_id, title, content_type, video_url, body_text, order_index)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            input.courseId,
            input.title,
            input.contentType,
            input.videoUrl ?? null,
            input.bodyText ?? null,
            input.orderIndex,
        ]
    );
    const rows = await queryMySQL<LessonRow[]>(
        "SELECT * FROM lessons WHERE id = ? LIMIT 1",
        [result.insertId]
    );
    return mapLesson(rows[0]);
}

/** Update a lesson */
export async function updateLesson(
    lessonId: number,
    input: Partial<{
        title: string;
        contentType: LessonContentType;
        videoUrl: string | null;
        bodyText: string | null;
        orderIndex: number;
    }>
): Promise<void> {
    const columnMap: Record<string, string> = {
        title: "title",
        contentType: "content_type",
        videoUrl: "video_url",
        bodyText: "body_text",
        orderIndex: "order_index",
    };
    const setClauses = Object.keys(input)
        .map((k) => `\`${columnMap[k] ?? k}\` = ?`)
        .join(", ");
    const values = [...Object.values(input), lessonId];
    await queryMySQL(`UPDATE lessons SET ${setClauses} WHERE id = ?`, values);
}

/** Delete a lesson */
export async function deleteLesson(lessonId: number): Promise<void> {
    await queryMySQL("DELETE FROM lessons WHERE id = ?", [lessonId]);
}

// ─── Progress Queries ─────────────────────────────────────────────────────────

/** Get all lesson progress for a student in a course */
export async function findProgressByStudentAndCourse(
    studentId: number,
    courseId: number
): Promise<LmsLessonProgress[]> {
    const rows = await queryMySQL<ProgressRow[]>(
        `SELECT lp.*
         FROM lesson_progress lp
         JOIN lessons l ON lp.lesson_id = l.id
         WHERE lp.student_id = ? AND l.course_id = ?`,
        [studentId, courseId]
    );
    return rows.map(mapProgress);
}

/** Mark a lesson as complete for a student (upsert) */
export async function markLessonComplete(studentId: number, lessonId: number): Promise<void> {
    await queryMySQL(
        `INSERT INTO lesson_progress (student_id, lesson_id, is_completed, completed_at)
         VALUES (?, ?, 1, NOW())
         ON DUPLICATE KEY UPDATE is_completed = 1, completed_at = IF(is_completed = 0, NOW(), completed_at)`,
        [studentId, lessonId]
    );
}

// ─── Quiz Grade Queries ───────────────────────────────────────────────────────

/** Submit a quiz grade (always inserts — allows retakes) */
export async function submitQuizGrade(
    studentId: number,
    lessonId: number,
    score: number
): Promise<LmsQuizGrade> {
    const result = await queryMySQL<ResultSetHeader>(
        "INSERT INTO quiz_grades (student_id, lesson_id, score) VALUES (?, ?, ?)",
        [studentId, lessonId, score]
    );
    const rows = await queryMySQL<GradeRow[]>(
        "SELECT * FROM quiz_grades WHERE id = ? LIMIT 1",
        [result.insertId]
    );
    const r = rows[0];
    return {
        id: r.id,
        studentId: r.student_id,
        lessonId: r.lesson_id,
        score: r.score,
        submittedAt: r.submitted_at,
    };
}

/** Get latest quiz grade for a student on a lesson */
export async function findLatestQuizGrade(
    studentId: number,
    lessonId: number
): Promise<LmsQuizGrade | null> {
    const rows = await queryMySQL<GradeRow[]>(
        "SELECT * FROM quiz_grades WHERE student_id = ? AND lesson_id = ? ORDER BY submitted_at DESC LIMIT 1",
        [studentId, lessonId]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
        id: r.id,
        studentId: r.student_id,
        lessonId: r.lesson_id,
        score: r.score,
        submittedAt: r.submitted_at,
    };
}

// ─── Dashboard Aggregation ────────────────────────────────────────────────────

/**
 * Build full student dashboard data:
 * enrolled courses + per-course progress % + overall % 
 */
export async function getStudentDashboard(studentId: number): Promise<StudentDashboard> {
    // All enrollments with course info
    interface DashRow extends RowDataPacket {
        course_id: number;
        title: string;
        level: CourseLevel;
        description: string | null;
        thumbnail: string | null;
        status: EnrollmentStatus;
        total_lessons: number;
        completed_lessons: number;
    }

    const rows = await queryMySQL<DashRow[]>(
        `SELECT
            c.id AS course_id,
            c.title,
            c.level,
            c.description,
            c.thumbnail,
            e.status,
            COUNT(DISTINCT l.id) AS total_lessons,
            COUNT(DISTINCT CASE WHEN lp.is_completed = 1 THEN lp.lesson_id END) AS completed_lessons
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         LEFT JOIN lessons l ON l.course_id = c.id
         LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.student_id = e.student_id
         WHERE e.student_id = ?
         GROUP BY c.id, c.title, c.level, c.description, c.thumbnail, e.status
         ORDER BY e.enrolled_at DESC`,
        [studentId]
    );

    const enrolledCourses = rows.map((r) => {
        const total = Number(r.total_lessons);
        const completed = Number(r.completed_lessons);
        return {
            id: r.course_id,
            title: r.title,
            level: r.level,
            description: r.description,
            thumbnail: r.thumbnail,
            enrollmentStatus: r.status,
            totalLessons: total,
            completedLessons: completed,
            progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    });

    const totalAll = enrolledCourses.reduce((s, c) => s + c.totalLessons, 0);
    const completedAll = enrolledCourses.reduce((s, c) => s + c.completedLessons, 0);
    const overallProgressPercent = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;

    return { enrolledCourses, overallProgressPercent };
}

/** Get all courses a teacher is assigned to (via teacher_id on courses if exists, else all courses) */
export async function findCoursesByTeacher(teacherId: number): Promise<LmsCourse[]> {
    // Check if courses table has teacher_id column; if not, return all
    try {
        const rows = await queryMySQL<CourseRow[]>(
            "SELECT * FROM courses WHERE teacher_id = ? ORDER BY level, title",
            [teacherId]
        );
        return rows.map(mapCourse);
    } catch {
        // Column doesn't exist — teacher sees all courses
        return listCourses();
    }
}
