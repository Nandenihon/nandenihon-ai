import { NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket } from "@repo/database";

/**
 * GET /api/dashboard/recent-students
 * Returns the 5 most recently registered students.
 */
export async function GET() {
    try {
        const rows = await queryMySQL<RowDataPacket[]>(
            `SELECT id, full_name, email, level, test_status
             FROM students
             ORDER BY created_at DESC
             LIMIT 5`
        );

        const students = rows.map((row) => ({
            id: row.id,
            name: row.full_name,
            email: row.email,
            level: row.level ?? "-",
            status: row.test_status === "completed" ? "Selesai" : "Aktif",
        }));

        return NextResponse.json({ data: students });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error fetching recent students:", error);
        return NextResponse.json(
            { error: "Failed to fetch recent students", details: message },
            { status: 500 }
        );
    }
}
