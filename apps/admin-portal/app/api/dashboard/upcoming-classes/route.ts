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

        const jakartaDateKey = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const now = new Date();
        const todayStr = jakartaDateKey.format(now);
        const tomorrowStr = jakartaDateKey.format(new Date(now.getTime() + 24 * 60 * 60 * 1000));

        const classes = rows.map((row) => {
            const start = new Date(row.register_start);
            const startStr = jakartaDateKey.format(start);

            let dateLabel: string;
            if (startStr === todayStr) {
                dateLabel = "Hari ini";
            } else if (startStr === tomorrowStr) {
                dateLabel = "Besok";
            } else {
                dateLabel = start.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    timeZone: "Asia/Jakarta",
                });
            }

            const timeLabel = start.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Asia/Jakarta",
            });

            const end = new Date(row.register_end);
            const endTimeLabel = end.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Asia/Jakarta",
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
