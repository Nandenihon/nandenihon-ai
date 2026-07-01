import { NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket } from "@repo/database";

/**
 * GET /api/dashboard/upcoming-classes
 * Returns up to 4 active classes ordered by registration start date.
 */
export async function GET() {
    try {
        const rows = await queryMySQL<RowDataPacket[]>(
            `SELECT id, class_name, register_start, register_end, level, status
             FROM \`class\`
             WHERE status = 'active'
             ORDER BY register_start ASC
             LIMIT 4`
        );

        const now = new Date();
        const todayStr = now.toDateString();
        const tomorrowStr = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1
        ).toDateString();

        const classes = rows.map((row) => {
            const start = new Date(row.register_start);
            const startStr = start.toDateString();

            let dateLabel: string;
            if (startStr === todayStr) {
                dateLabel = "Hari ini";
            } else if (startStr === tomorrowStr) {
                dateLabel = "Besok";
            } else {
                dateLabel = start.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                });
            }

            const timeLabel = start.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });

            const end = new Date(row.register_end);
            const endTimeLabel = end.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });

            return {
                id: row.id,
                name: row.class_name,
                time: `${timeLabel} - ${endTimeLabel}`,
                level: row.level,
                date: dateLabel,
            };
        });

        return NextResponse.json({ data: classes });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error fetching upcoming classes:", error);
        return NextResponse.json(
            { error: "Failed to fetch upcoming classes", details: message },
            { status: 500 }
        );
    }
}
