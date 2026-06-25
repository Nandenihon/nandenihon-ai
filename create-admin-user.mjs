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
    return new Set(columns.map((column) => column.Field));
}

async function upsertAdminUser(pool, adminEmail, adminPassword) {
    const columns = await getTableColumns(pool, "users");
    const hashedPw = md5(adminPassword);
    const displayColumn = columns.has("name") ? "name" : columns.has("username") ? "username" : null;
    const activeColumn = columns.has("is_active") ? "is_active" : null;

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [adminEmail]);

    if (existing.length > 0) {
        console.log(`Admin user with email "${adminEmail}" already exists. Updating password to default...`);
        const updates = ["password = ?", "role = ?"];
        const values = [hashedPw, "super_admin"];

        if (displayColumn) {
            updates.push(`\`${displayColumn}\` = ?`);
            values.push("Super Admin");
        }

        if (activeColumn) {
            updates.push(`\`${activeColumn}\` = ?`);
            values.push(1);
        }

        values.push(adminEmail);
        await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE email = ?`, values);
        console.log("Password and role updated successfully.");
        return;
    }

    console.log(`Creating new admin user with email "${adminEmail}"...`);
    const insertColumns = ["email", "password", "role"];
    const insertValues = [adminEmail, hashedPw, "super_admin"];

    if (displayColumn) {
        insertColumns.unshift(displayColumn);
        insertValues.unshift("Super Admin");
    }

    if (activeColumn) {
        insertColumns.push(activeColumn);
        insertValues.push(1);
    }

    const placeholders = insertColumns.map(() => "?").join(", ");
    const escapedColumns = insertColumns.map((column) => `\`${column}\``).join(", ");
    await pool.query(
        `INSERT INTO users (${escapedColumns}) VALUES (${placeholders})`,
        insertValues
    );
    console.log("Admin user created successfully.");
}

// Read and parse env file
const envPath = fileURLToPath(new URL("./apps/admin-portal/.env.local", import.meta.url));
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

function createSSHTunnel() {
    return new Promise((resolve, reject) => {
        const sshClient = new Client();

        sshClient.on("ready", () => {
            console.log("SSH Connection established successfully.");
            const server = net.createServer((socket) => {
                sshClient.forwardOut(
                    "127.0.0.1",
                    0,
                    config.mysql.host,
                    config.mysql.port,
                    (err, stream) => {
                        if (err) {
                            socket.end();
                            return;
                        }
                        socket.pipe(stream).pipe(socket);
                    }
                );
            });

            server.listen(0, "127.0.0.1", () => {
                const address = server.address();
                resolve({ client: sshClient, server, localPort: address.port });
            });

            server.on("error", (err) => {
                sshClient.end();
                reject(err);
            });
        });

        sshClient.on("error", (err) => {
            reject(err);
        });

        sshClient.connect({
            host: config.ssh.host,
            port: config.ssh.port,
            username: config.ssh.username,
            password: config.ssh.password,
        });
    });
}

async function run() {
    let sshClient, server, pool;
    try {
        console.log("Creating SSH tunnel...");
        const tunnel = await createSSHTunnel();
        sshClient = tunnel.client;
        server = tunnel.server;
        const localPort = tunnel.localPort;
        console.log(`SSH tunnel forwarding local port ${localPort} to remote MySQL.`);

        console.log("Connecting to MySQL database...");
        pool = mysql.createPool({
            host: "127.0.0.1",
            port: localPort,
            user: config.mysql.user,
            password: config.mysql.password,
            database: config.mysql.database,
        });

        // Ensure users table exists or create it
        console.log("Ensuring users table exists...");
        await pool.query(`
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

        const adminEmail = "admin@nandenihon.com";
        const adminPassword = "NandeNihonAdmin@2025";
        await upsertAdminUser(pool, adminEmail, adminPassword);

        console.log("-----------------------------------------");
        console.log("Admin Login Credentials:");
        console.log(`Email:    ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log("-----------------------------------------");

    } catch (error) {
        console.error("Error occurred:", error);
    } finally {
        if (pool) await pool.end();
        if (server) server.close();
        if (sshClient) sshClient.end();
        console.log("Connections closed.");
        process.exit(0);
    }
}

run();
