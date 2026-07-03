import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";

async function getSession(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
}

/**
 * GET /api/attendance
 * Get student attendance list for a class on a specific date.
 */
export async function GET(request: NextRequest) {
    const session = await getSession(request);
    if (!session) {
        return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const classId = searchParams.get("classId");
        const date = searchParams.get("date"); // YYYY-MM-DD

        if (!classId || !date) {
            return NextResponse.json({ error: "classId dan date wajib disertakan" }, { status: 400 });
        }

        // Fetch class details to know its level
        const classRes = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM `class` WHERE id = ? LIMIT 1",
            [classId]
        );
        if (classRes.length === 0) {
            return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
        }

        const classItem = classRes[0];
        const classLevel = classItem.level;

        // Fetch students of matching level
        let studentsQuery = "SELECT id, full_name, email, level FROM students";
        const queryParams: unknown[] = [];
        if (classLevel && classLevel !== "All") {
            studentsQuery += " WHERE level = ?";
            queryParams.push(classLevel);
        }

        const students = await queryMySQL<RowDataPacket[]>(studentsQuery, queryParams);

        // Fetch existing attendance records for the class and date
        const attendanceRecords = await queryMySQL<RowDataPacket[]>(
            "SELECT student_id, status, notes FROM class_attendance WHERE class_id = ? AND attendance_date = ?",
            [classId, date]
        );

        const attendanceMap = new Map<number, { status: string; notes: string | null }>();
        attendanceRecords.forEach((rec) => {
            attendanceMap.set(Number(rec.student_id), {
                status: rec.status,
                notes: rec.notes
            });
        });

        // Merge student info and attendance status
        const studentAttendanceList = students.map((std) => {
            const att = attendanceMap.get(Number(std.id));
            return {
                studentId: std.id,
                full_name: std.full_name,
                email: std.email,
                level: std.level,
                status: att ? att.status : null, // null means not recorded yet
                notes: att ? att.notes : ""
            };
        });

        return NextResponse.json({ data: studentAttendanceList });

    } catch (error) {
        console.error("Error fetching attendance list:", error);
        return NextResponse.json({ error: "Gagal mengambil data absensi" }, { status: 500 });
    }
}

/**
 * POST /api/attendance
 * Save attendance records for a class on a specific date.
 */
export async function POST(request: NextRequest) {
    const session = await getSession(request);
    if (!session) {
        return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    if (!["admin-class", "admin", "super_admin"].includes(session.role)) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { classId, date, attendance } = body; // attendance is an array of { studentId, status, notes }

        if (!classId || !date || !Array.isArray(attendance)) {
            return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 });
        }

        // Upsert each record
        for (const item of attendance) {
            const { studentId, status, notes } = item;
            if (!studentId || !status) continue;

            await queryMySQL(
                `INSERT INTO class_attendance (class_id, student_id, attendance_date, status, notes)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes)`,
                [classId, studentId, date, status, notes || null]
            );
        }

        return NextResponse.json({ message: "Absensi berhasil disimpan" });

    } catch (error) {
        console.error("Error saving attendance:", error);
        return NextResponse.json({ error: "Gagal menyimpan absensi" }, { status: 500 });
    }
}
