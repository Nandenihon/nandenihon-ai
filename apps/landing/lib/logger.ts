import { appendFile, mkdir } from "fs/promises";
import path from "path";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

/**
 * Server-side logger that writes to daily rolling log files.
 * Log files are stored in the `logs/` directory at the project root.
 * 
 * Format: [TIMESTAMP] [LEVEL] [SOURCE] MESSAGE {DATA}
 */

const LOGS_DIR = path.join(process.cwd(), "logs");

/**
 * Get the current date formatted for the log filename (YYYY-MM-DD)
 */
function getDateString(): string {
    const now = new Date();
    return now.toISOString().split("T")[0];
}

/**
 * Get the current timestamp formatted for log entries
 */
function getTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Ensure the logs directory exists
 */
async function ensureLogsDir(): Promise<void> {
    try {
        await mkdir(LOGS_DIR, { recursive: true });
    } catch {
        // Directory already exists or cannot be created
    }
}

/**
 * Write a log entry to the daily log file
 * 
 * @param level - Log level (INFO, WARN, ERROR, DEBUG)
 * @param source - Source of the log (e.g., "confirm/page", "api/payment")
 * @param message - Log message
 * @param data - Optional additional data to include
 */
export async function log(
    level: LogLevel,
    source: string,
    message: string,
    data?: Record<string, unknown>
): Promise<void> {
    try {
        await ensureLogsDir();

        const timestamp = getTimestamp();
        const dateString = getDateString();
        const logFile = path.join(LOGS_DIR, `${dateString}.log`);

        let logEntry = `[${timestamp}] [${level}] [${source}] ${message}`;

        if (data) {
            logEntry += ` ${JSON.stringify(data)}`;
        }

        logEntry += "\n";

        await appendFile(logFile, logEntry, "utf-8");
    } catch (error) {
        // Fallback to console if file logging fails
        console.error("Logger error:", error);
        console.log(`[${level}] [${source}] ${message}`, data || "");
    }
}

/**
 * Log an info message
 */
export async function logInfo(source: string, message: string, data?: Record<string, unknown>): Promise<void> {
    return log("INFO", source, message, data);
}

/**
 * Log a warning message
 */
export async function logWarn(source: string, message: string, data?: Record<string, unknown>): Promise<void> {
    return log("WARN", source, message, data);
}

/**
 * Log an error message
 */
export async function logError(source: string, message: string, data?: Record<string, unknown>): Promise<void> {
    return log("ERROR", source, message, data);
}

/**
 * Log a debug message
 */
export async function logDebug(source: string, message: string, data?: Record<string, unknown>): Promise<void> {
    return log("DEBUG", source, message, data);
}
