import "server-only";

import {
    ensureLmsTables,
    getStudentDashboard,
    queryMySQL,
    type RowDataPacket,
    type StudentDashboard,
} from "@repo/database";

export interface StudentGradeItem {
    id: number;
    score: number;
    submittedAt: Date;
    lessonTitle: string;
    courseTitle: string;
}

export interface LeaderboardItem {
    rank: number;
    studentId: number;
    studentName: string;
    bestScore: number;
    attempts: number;
}

interface GradeRow extends RowDataPacket {
    id: number;
    score: number;
    submitted_at: Date;
    lesson_title: string;
    course_title: string;
}

interface LeaderboardRow extends RowDataPacket {
    student_id: number;
    student_name: string;
    best_score: number;
    attempts: number;
}

export async function getStudentDashboardSafe(studentId: number): Promise<StudentDashboard> {
    try {
        await ensureLmsTables();
        return await getStudentDashboard(studentId);
    } catch {
        return { enrolledCourses: [], overallProgressPercent: 0 };
    }
}

export async function getStudentGrades(studentId: number, limit = 20): Promise<StudentGradeItem[]> {
    try {
        const rows = await queryMySQL<GradeRow[]>(
            `SELECT
                qg.id,
                qg.score,
                qg.submitted_at,
                l.title AS lesson_title,
                c.title AS course_title
             FROM quiz_grades qg
             JOIN lessons l ON l.id = qg.lesson_id
             JOIN courses c ON c.id = l.course_id
             WHERE qg.student_id = ?
             ORDER BY qg.submitted_at DESC, qg.id DESC
             LIMIT ?`,
            [studentId, limit]
        );

        return rows.map((row) => ({
            id: row.id,
            score: Number(row.score),
            submittedAt: row.submitted_at,
            lessonTitle: row.lesson_title,
            courseTitle: row.course_title,
        }));
    } catch {
        return [];
    }
}

export async function getDailyQuizLeaderboard(limit = 10): Promise<LeaderboardItem[]> {
    try {
        const rows = await queryMySQL<LeaderboardRow[]>(
            `SELECT
                qg.student_id,
                COALESCE(u.username, u.email) AS student_name,
                MAX(qg.score) AS best_score,
                COUNT(*) AS attempts
             FROM quiz_grades qg
             JOIN users u ON u.id = qg.student_id
             WHERE DATE(qg.submitted_at) = CURDATE()
             GROUP BY qg.student_id, u.username, u.email
             ORDER BY best_score DESC, attempts ASC, student_name ASC
             LIMIT ?`,
            [limit]
        );

        return rows.map((row, index) => ({
            rank: index + 1,
            studentId: row.student_id,
            studentName: row.student_name,
            bestScore: Number(row.best_score),
            attempts: Number(row.attempts),
        }));
    } catch {
        return [];
    }
}

export function getAttendanceSummary(dashboard: StudentDashboard) {
    const totalLessons = dashboard.enrolledCourses.reduce((sum, course) => sum + course.totalLessons, 0);
    const completedLessons = dashboard.enrolledCourses.reduce((sum, course) => sum + course.completedLessons, 0);
    const remainingLessons = Math.max(0, totalLessons - completedLessons);

    return {
        present: completedLessons,
        total: totalLessons,
        absent: 0,
        remaining: remainingLessons,
        percent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    };
}

export function getSchedulePreview(dashboard: StudentDashboard) {
    return dashboard.enrolledCourses.slice(0, 3).map((course, index) => ({
        id: course.id,
        title: course.title,
        level: course.level,
        time: index === 0 ? "Hari ini" : index === 1 ? "Besok" : "Minggu ini",
        description:
            course.completedLessons < course.totalLessons
                ? `${course.totalLessons - course.completedLessons} pelajaran tersisa`
                : "Kursus selesai",
    }));
}
