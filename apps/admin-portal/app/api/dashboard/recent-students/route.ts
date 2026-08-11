import { NextResponse } from "next/server";
import { ensureStudentsTable, queryMySQL, type RowDataPacket } from "@repo/database";

/**
 * GET /api/dashboard/recent-students
 * Returns the 5 most recently activated students (payment verified).
 */
export async function GET() {
    try {
        await ensureStudentsTable();
        const rows = await queryMySQL<RowDataPacket[]>(
            `SELECT id, full_name, email, japanese_level
             FROM students
             WHERE user_id IS NOT NULL
             ORDER BY activated_at DESC
             LIMIT 5`
        );

        const students = rows.map((row) => ({
            id: row.id,
            name: row.full_name,
            email: row.email,
            level: row.japanese_level ?? "-",
            status: "Aktif",
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
