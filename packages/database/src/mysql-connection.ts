import { Client } from "ssh2";
import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import net from "net";

interface MySQLConfig {
    ssh: {
        host: string;
        port: number;
        username: string;
        password?: string;
        privateKey?: string;
    };
    mysql: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
    };
}

interface MySQLCache {
    pool: Pool | null;
    sshClient: Client | null;
    server: net.Server | null;
    localPort: number | null;
}

declare global {
    var mysqlCache: MySQLCache | undefined;
}

const cached: MySQLCache = global.mysqlCache || {
    pool: null,
    sshClient: null,
    server: null,
    localPort: null,
};

if (!global.mysqlCache) {
    global.mysqlCache = cached;
}

function getConfig(): MySQLConfig {
    const sshHost = process.env.SSH_HOST;
    const sshPort = parseInt(process.env.SSH_PORT || "22", 10);
    const sshUsername = process.env.SSH_USERNAME;
    const sshPassword = process.env.SSH_PASSWORD;
    const sshPrivateKey = process.env.SSH_PRIVATE_KEY;

    const mysqlHost = process.env.MYSQL_HOST || "127.0.0.1";
    const mysqlPort = parseInt(process.env.MYSQL_PORT || "3306", 10);
    const mysqlUser = process.env.MYSQL_USER;
    const mysqlPassword = process.env.MYSQL_PASSWORD;
    const mysqlDatabase = process.env.MYSQL_DATABASE;

    if (!sshHost || !sshUsername) {
        throw new Error(
            "Please define SSH_HOST and SSH_USERNAME environment variables"
        );
    }

    if (!sshPassword && !sshPrivateKey) {
        throw new Error(
            "Please define either SSH_PASSWORD or SSH_PRIVATE_KEY environment variable"
        );
    }

    if (!mysqlUser || !mysqlPassword || !mysqlDatabase) {
        throw new Error(
            "Please define MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE environment variables"
        );
    }

    return {
        ssh: {
            host: sshHost,
            port: sshPort,
            username: sshUsername,
            password: sshPassword,
            privateKey: sshPrivateKey,
        },
        mysql: {
            host: mysqlHost,
            port: mysqlPort,
            user: mysqlUser,
            password: mysqlPassword,
            database: mysqlDatabase,
        },
    };
}

/**
 * Create SSH tunnel and local proxy server
 * Returns the local port to connect to
 */
async function createSSHTunnel(config: MySQLConfig): Promise<{ client: Client; server: net.Server; localPort: number }> {
    return new Promise((resolve, reject) => {
        const sshClient = new Client();

        sshClient.on("ready", () => {
            // Create a local TCP server that forwards connections through SSH
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

            // Listen on a random available port
            server.listen(0, "127.0.0.1", () => {
                const address = server.address();
                if (address && typeof address === "object") {
                    resolve({ client: sshClient, server, localPort: address.port });
                } else {
                    reject(new Error("Failed to get server address"));
                }
            });

            server.on("error", (err) => {
                sshClient.end();
                reject(err);
            });
        });

        sshClient.on("error", (err: Error) => {
            reject(err);
        });

        const connectConfig: {
            host: string;
            port: number;
            username: string;
            password?: string;
            privateKey?: Buffer;
        } = {
            host: config.ssh.host,
            port: config.ssh.port,
            username: config.ssh.username,
        };

        if (config.ssh.privateKey) {
            connectConfig.privateKey = Buffer.from(config.ssh.privateKey);
        } else if (config.ssh.password) {
            connectConfig.password = config.ssh.password;
        }

        sshClient.connect(connectConfig);
    });
}

/**
 * Get MySQL connection pool with SSH tunnel
 * Uses connection caching for serverless environments
 */
export async function connectMySQL(): Promise<Pool> {
    if (cached.pool) {
        return cached.pool;
    }

    const config = getConfig();

    try {
        // Create SSH tunnel
        const { client, server, localPort } = await createSSHTunnel(config);
        cached.sshClient = client;
        cached.server = server;
        cached.localPort = localPort;

        // Create MySQL connection pool through the tunnel
        cached.pool = mysql.createPool({
            host: "127.0.0.1",
            port: localPort,
            user: config.mysql.user,
            password: config.mysql.password,
            database: config.mysql.database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        return cached.pool;
    } catch (error) {
        // Clean up on error
        await closeMySQLConnection();
        throw error;
    }
}

/**
 * Execute a query using the MySQL pool
 * Uses pool.query which handles LIMIT/OFFSET parameters correctly
 */
export async function queryMySQL<T extends RowDataPacket[] | ResultSetHeader>(
    sql: string,
    params?: unknown[]
): Promise<T> {
    const pool = await connectMySQL();
    const [results] = await pool.query<T>(sql, params);
    return results;
}

/**
 * Get a single connection from the pool (for transactions)
 */
export async function getConnection(): Promise<PoolConnection> {
    const pool = await connectMySQL();
    return pool.getConnection();
}

/**
 * Close MySQL connection and SSH tunnel
 */
export async function closeMySQLConnection(): Promise<void> {
    if (cached.pool) {
        await cached.pool.end();
        cached.pool = null;
    }

    if (cached.server) {
        cached.server.close();
        cached.server = null;
    }

    if (cached.sshClient) {
        cached.sshClient.end();
        cached.sshClient = null;
    }

    cached.localPort = null;
}

// Re-export types for convenience
export type { Pool, PoolConnection, RowDataPacket, ResultSetHeader };
