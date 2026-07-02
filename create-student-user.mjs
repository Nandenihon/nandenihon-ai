/**
 * create-student-user.mjs
 * ───────────────────────
 * Seeds sample student accounts in the `users` table so you can log in
 * to the Student Portal immediately.
 *
 * Usage (from monorepo root):
 *   node create-student-user.mjs
 *
 * Sample accounts created:
 *   student@nandenihon.com  / Siswa@2025
 *   hanako@nandenihon.com   / Siswa@2025
 *   tanaka@nandenihon.com   / Siswa@2025
 */

import { Client } from "ssh2";
import mysql from "mysql2/promise";
import net from "net";
import fs from "fs";
import { fileURLToPath } from "url";
import crypto from "crypto";

function md5(str) {
    return crypto.createHash("md5").update(str).digest("hex");
}

async function getTableColumns(pool, tableName) {
    const [columns] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\``);
    return new Set(columns.map((col) => col.Field));
}

async function upsertStudentUser(pool, { name, email, password }) {
    const columns = await getTableColumns(pool, "users");
    const hashedPw = md5(password);

    const displayColumn = columns.has("name")
        ? "name"
        : columns.has("username")
        ? "username"
        : null;
    const activeColumn = columns.has("is_active") ? "is_active" : null;

    // Check if user already exists
    const [existing] = await pool.query(
        "SELECT id, role FROM users WHERE email = ?",
        [email]
    );

    if (existing.length > 0) {
        const user = existing[0];
        if (user.role !== "student") {
            console.log(
                `⚠️  User "${email}" already exists but has role "${user.role}". Skipping to avoid overwriting.`
            );
            return;
        }

        console.log(
            `ℹ️  Student "${email}" already exists — resetting password...`
        );
        const updates = ["password = ?", "role = ?"];
        const values = [hashedPw, "student"];

        if (displayColumn) {
            updates.push(`\`${displayColumn}\` = ?`);
            values.push(name);
        }
        if (activeColumn) {
            updates.push(`\`${activeColumn}\` = ?`);
            values.push(1);
        }

        values.push(email);
        await pool.query(
            `UPDATE users SET ${updates.join(", ")} WHERE email = ?`,
            values
        );
        console.log(`   ✓ Password reset for "${email}".`);
        return;
    }

    // Insert new student
    const insertColumns = ["email", "password", "role"];
    const insertValues = [email, hashedPw, "student"];

    if (displayColumn) {
        insertColumns.unshift(displayColumn);
        insertValues.unshift(name);
    }
    if (activeColumn) {
        insertColumns.push(activeColumn);
        insertValues.push(1);
    }

    const placeholders = insertColumns.map(() => "?").join(", ");
    const escapedColumns = insertColumns.map((c) => `\`${c}\``).join(", ");

    await pool.query(
        `INSERT INTO users (${escapedColumns}) VALUES (${placeholders})`,
        insertValues
    );
    console.log(`   ✓ Created student: "${name}" <${email}>`);
}

// ── Read env ─────────────────────────────────────────────────────────────────
const envPath = fileURLToPath(
    new URL("./apps/admin-portal/.env.local", import.meta.url)
);
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
        env[key] = value;
    }
});

const config = {
    ssh: {
        host: env.SSH_HOST,
        port: parseInt(env.SSH_PORT || "22", 10),
        username: env.SSH_USERNAME,
        password: env.SSH_PASSWORD,
    },
    mysql: {
        host: env.MYSQL_HOST || "127.0.0.1",
        port: parseInt(env.MYSQL_PORT || "3306", 10),
        user: env.MYSQL_USER,
        password: env.MYSQL_PASSWORD,
        database: env.MYSQL_DATABASE,
    },
};

// ── SSH Tunnel ────────────────────────────────────────────────────────────────
function createSSHTunnel() {
    return new Promise((resolve, reject) => {
        const sshClient = new Client();

        sshClient.on("ready", () => {
            console.log("SSH connection established.");
            const server = net.createServer((socket) => {
                sshClient.forwardOut(
                    "127.0.0.1",
                    0,
                    config.mysql.host,
                    config.mysql.port,
                    (err, stream) => {
                        if (err) { socket.end(); return; }
                        socket.pipe(stream).pipe(socket);
                    }
                );
            });

            server.listen(0, "127.0.0.1", () => {
                const address = server.address();
                resolve({ client: sshClient, server, localPort: address.port });
            });

            server.on("error", (err) => { sshClient.end(); reject(err); });
        });

        sshClient.on("error", reject);
        sshClient.connect({
            host: config.ssh.host,
            port: config.ssh.port,
            username: config.ssh.username,
            password: config.ssh.password,
        });
    });
}

// ── Sample students ───────────────────────────────────────────────────────────
const STUDENTS = [
    { name: "Demo Student",   email: "student@nandenihon.com", password: "Siswa@2025" },
    { name: "Tanaka Hanako",  email: "hanako@nandenihon.com",  password: "Siswa@2025" },
    { name: "Sato Kenji",     email: "kenji@nandenihon.com",   password: "Siswa@2025" },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
    let sshClient, server, pool;
    try {
        console.log("\n🔑  Creating SSH tunnel...");
        const tunnel = await createSSHTunnel();
        sshClient = tunnel.client;
        server    = tunnel.server;
        console.log(`   Tunnel ready on local port ${tunnel.localPort}`);

        console.log("\n🗄️  Connecting to MySQL...");
        pool = mysql.createPool({
            host:     "127.0.0.1",
            port:     tunnel.localPort,
            user:     config.mysql.user,
            password: config.mysql.password,
            database: config.mysql.database,
        });

        // Ensure users table exists (same DDL as the admin script)
        console.log("\n📋  Ensuring `users` table exists...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                username   VARCHAR(255) NOT NULL,
                email      VARCHAR(255) UNIQUE NOT NULL,
                password   VARCHAR(255) NOT NULL,
                role       VARCHAR(50)  DEFAULT 'student',
                is_active  TINYINT(1)   DEFAULT 1,
                created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log("\n👩‍🎓  Seeding student accounts...");
        for (const student of STUDENTS) {
            await upsertStudentUser(pool, student);
        }

        console.log("\n" + "─".repeat(50));
        console.log("🎌  Student Portal Login Credentials");
        console.log("─".repeat(50));
        console.log("URL:       http://localhost:3001/login\n");
        for (const s of STUDENTS) {
            console.log(`Name:      ${s.name}`);
            console.log(`Email:     ${s.email}`);
            console.log(`Password:  ${s.password}`);
            console.log("");
        }
        console.log("─".repeat(50));

    } catch (error) {
        console.error("\n❌  Error:", error.message || error);
    } finally {
        if (pool)      await pool.end();
        if (server)    server.close();
        if (sshClient) sshClient.end();
        console.log("\n🔒  Connections closed.");
        process.exit(0);
    }
}

run();
