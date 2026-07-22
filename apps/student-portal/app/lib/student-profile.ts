import { NextRequest } from "next/server";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import { COOKIE_NAME, verifyToken } from "./auth";

export async function getProfileSession(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    return token ? verifyToken(token) : null;
}

export async function ensureProfileTable() {
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS student_profiles (
            user_id INT NOT NULL PRIMARY KEY,
            phone VARCHAR(30) NULL,
            bio VARCHAR(500) NULL,
            avatar_url VARCHAR(1000) NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const columns = await queryMySQL<RowDataPacket[]>("SHOW COLUMNS FROM student_profiles");
    if (!columns.some((column) => String(column.Field) === "avatar_url")) {
        await queryMySQL("ALTER TABLE student_profiles ADD COLUMN avatar_url VARCHAR(1000) NULL AFTER bio");
    }
}
