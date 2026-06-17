import { NextRequest, NextResponse } from "next/server";
import { log, type LogLevel } from "@repo/utils";

/**
 * POST /api/log
 * Receives log messages from client-side components and writes to log files.
 * Body: { level, source, message, data? }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { level, source, message, data } = body;

        // Validate required fields
        if (!level || !source || !message) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: level, source, message" },
                { status: 400 }
            );
        }

        // Validate log level
        const validLevels: LogLevel[] = ["INFO", "WARN", "ERROR", "DEBUG"];
        if (!validLevels.includes(level)) {
            return NextResponse.json(
                { success: false, error: "Invalid log level. Must be INFO, WARN, ERROR, or DEBUG" },
                { status: 400 }
            );
        }

        // Write log entry
        await log(level as LogLevel, source, message, data);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Log API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to write log" },
            { status: 500 }
        );
    }
}
