import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/app/lib/auth";
import crypto from "crypto";

function md5(str: string): string {
    return crypto.createHash("md5").update(str).digest("hex");
}

async function getUserColumns(): Promise<Set<string>> {
    const columns = await queryMySQL<RowDataPacket[]>("SHOW COLUMNS FROM users");
    return new Set(columns.map((column) => String(column.Field)));
}

async function seedDefaultAdmin() {
    const columns = await getUserColumns();
    const defaultEmail = "admin@nandenihon.com";
    const defaultPw = md5("NandeNihonAdmin@2025");
    const displayColumn = columns.has("name") ? "name" : columns.has("username") ? "username" : null;
    const activeColumn = columns.has("is_active") ? "is_active" : null;
    const insertColumns = ["email", "password", "role"];
    const insertValues: unknown[] = [defaultEmail, defaultPw, "super_admin"];

    if (displayColumn) {
        insertColumns.unshift(displayColumn);
        insertValues.unshift("Super Admin");
    }

    if (activeColumn) {
        insertColumns.push(activeColumn);
        insertValues.push(1);
    }

    const escapedColumns = insertColumns.map((column) => `\`${column}\``).join(", ");
    const placeholders = insertColumns.map(() => "?").join(", ");

    await queryMySQL(
        `INSERT INTO users (${escapedColumns}) VALUES (${placeholders})`,
        insertValues
    );
}

/**
 * POST /api/auth/login
 * Authenticate user with email + password (MD5 hash comparison)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email dan password wajib diisi" },
                { status: 400 }
            );
        }

        // Query user by email (with auto-create table & auto-seed if not exists)
        let users: RowDataPacket[] = [];
        try {
            users = await queryMySQL<RowDataPacket[]>(
                "SELECT * FROM users WHERE email = ? LIMIT 1",
                [email]
            );
        } catch (dbError) {
            const errorMsg = dbError instanceof Error ? dbError.message : String(dbError);
            // If the table 'users' does not exist, create it and seed the default admin
            if (
                errorMsg.includes("doesn't exist") || 
                errorMsg.includes("Table") || 
                errorMsg.includes("not found")
            ) {
                console.log("Table 'users' doesn't exist. Creating and seeding...");
                await queryMySQL(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        username VARCHAR(255) NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password VARCHAR(255) NOT NULL,
                        role VARCHAR(50) DEFAULT 'admin',
                        is_active TINYINT(1) DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                `);
                
                await seedDefaultAdmin();
                
                // Retry querying
                users = await queryMySQL<RowDataPacket[]>(
                    "SELECT * FROM users WHERE email = ? LIMIT 1",
                    [email]
                );
            } else {
                throw dbError;
            }
        }

        // If the table exists but has no users, let's seed the default admin
        if ((!users || users.length === 0) && email === "admin@nandenihon.com") {
            const countRes = await queryMySQL<RowDataPacket[]>("SELECT COUNT(*) as count FROM users");
            if (countRes[0]?.count === 0) {
                console.log("Database has no users. Seeding default admin...");
                await seedDefaultAdmin();
                // Retry querying
                users = await queryMySQL<RowDataPacket[]>(
                    "SELECT * FROM users WHERE email = ? LIMIT 1",
                    [email]
                );
            }
        }

        if (!users || users.length === 0) {
            return NextResponse.json(
                { error: "Email atau password salah" },
                { status: 401 }
            );
        }

        const user = users[0];

        if (user.is_active === 0 || user.is_active === false) {
            return NextResponse.json(
                { error: "Akun tidak aktif" },
                { status: 403 }
            );
        }

        // Compare MD5 hashed password
        const hashedInput = md5(password);
        if (user.password !== hashedInput) {
            return NextResponse.json(
                { error: "Email atau password salah" },
                { status: 401 }
            );
        }

        // Build session payload
        const session = {
            id: user.id,
            name: user.name || user.username || user.display_name || user.full_name || "User",
            email: user.email,
            role: user.role || "admin",
        };

        const token = await signToken(session);

        // Set HTTP-only cookie
        const response = NextResponse.json({
            user: session,
            message: "Login berhasil",
        });

        response.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: COOKIE_MAX_AGE,
            path: "/",
        });

        return response;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan server", details: errorMessage },
            { status: 500 }
        );
    }
}
