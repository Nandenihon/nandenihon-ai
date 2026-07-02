import { NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket } from "@repo/database";

/**
 * GET /api/dashboard/stats
 * Returns aggregated counts for the dashboard overview cards.
 */
export async function GET() {
    try {
        const [studentsRow, classesRow, seminarsRow, testimoniesRow] =
            await Promise.all([
                queryMySQL<RowDataPacket[]>(
                    "SELECT COUNT(*) as total FROM students"
                ),
                queryMySQL<RowDataPacket[]>(
                    "SELECT COUNT(*) as total FROM `class`"
                ),
                queryMySQL<RowDataPacket[]>(
                    "SELECT COUNT(*) as total FROM seminar WHERE status = 'ongoing' OR status = 'upcoming'"
                ),
                queryMySQL<RowDataPacket[]>(
                    "SELECT COUNT(*) as total FROM testimony"
                ),
            ]);

        return NextResponse.json({
            totalStudents: Number(studentsRow[0]?.total ?? 0),
            totalClasses: Number(classesRow[0]?.total ?? 0),
            activeSeminars: Number(seminarsRow[0]?.total ?? 0),
            totalTestimonies: Number(testimoniesRow[0]?.total ?? 0),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard stats", details: message },
            { status: 500 }
        );
    }
}
