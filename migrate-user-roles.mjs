import { Client } from "ssh2";
import mysql from "mysql2/promise";
import net from "net";
import fs from "fs";
import { fileURLToPath } from "url";

// New role set the application code now uses.
const NEW_ROLES = ["super_admin", "student", "lecture", "medkom", "riset_jurnal", "admin_1", "admin_2"];

function parseEnumValues(columnType) {
    // columnType looks like: enum('super_admin','admin','teacher','student','admin-class','helpdesk')
    const match = /^enum\((.*)\)$/i.exec(columnType.trim());
    if (!match) return null;
    return match[1]
        .split(",")
        .map((raw) => raw.trim().replace(/^'/, "").replace(/'$/, "").replace(/''/g, "'"));
}

async function migrateRoleColumn(pool) {
    const [columns] = await pool.query("SHOW COLUMNS FROM users LIKE 'role'");
    if (columns.length === 0) {
        console.log("No `role` column found on `users` — nothing to do.");
        return;
    }

    const columnType = columns[0].Type;
    console.log(`Current role column type: ${columnType}`);

    const currentEnumValues = parseEnumValues(columnType);
    if (!currentEnumValues) {
        console.log("`role` is not an ENUM (probably VARCHAR) — it already accepts any string. Nothing to migrate.");
        return;
    }

    // Purely additive: keep every existing enum value so no current row can be truncated,
    // and add whichever new role values are missing.
    const mergedValues = [...new Set([...currentEnumValues, ...NEW_ROLES])];
    const isAlreadyWide = NEW_ROLES.every((role) => currentEnumValues.includes(role));

    if (isAlreadyWide) {
        console.log("ENUM already contains all new role values — nothing to alter.");
    } else {
        const enumSql = mergedValues.map((v) => `'${v.replace(/'/g, "''")}'`).join(",");
        console.log(`Widening ENUM to: ${mergedValues.join(", ")}`);
        await pool.query(`ALTER TABLE users MODIFY COLUMN role ENUM(${enumSql}) NOT NULL DEFAULT 'student'`);
        console.log("ENUM widened successfully. Existing data was not touched.");
    }

    // Report any accounts still holding a retired role value, since the app no longer
    // lets you assign these — they should be manually reassigned via the Users page.
    const retiredRoles = currentEnumValues.filter((v) => !NEW_ROLES.includes(v));
    if (retiredRoles.length > 0) {
        const placeholders = retiredRoles.map(() => "?").join(",");
        const [rows] = await pool.query(
            `SELECT id, username, email, role FROM users WHERE role IN (${placeholders})`,
            retiredRoles
        );
        if (rows.length > 0) {
            console.log("\nAccounts still holding a retired role (reassign these in the Users page):");
            rows.forEach((r) => console.log(`  #${r.id} ${r.email} (${r.username}) — role: ${r.role}`));
        } else {
            console.log("\nNo accounts currently hold a retired role value.");
        }
    }
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
    const useDirectConnection = !config.ssh.host;

    try {
        if (useDirectConnection) {
            console.log("No SSH_HOST configured — connecting directly to MySQL...");
            pool = mysql.createPool({
                host: config.mysql.host,
                port: config.mysql.port,
                user: config.mysql.user,
                password: config.mysql.password,
                database: config.mysql.database,
            });
        } else {
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
        }

        await migrateRoleColumn(pool);
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
