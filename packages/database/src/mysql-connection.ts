import { Client } from "ssh2";
import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import net from "net";
import type { Duplex } from "stream";

interface MySQLConfig {
    ssh?: {
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

interface ConnectionError {
    code?: string;
    message?: string;
    fatal?: boolean;
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

function markConnectionClosed(client?: Client, server?: net.Server): void {
    const pool = cached.pool;
    cached.pool = null;
    cached.localPort = null;

    if (!client || cached.sshClient === client) {
        cached.sshClient = null;
    }

    if (!server || cached.server === server) {
        cached.server = null;
    }

    if (pool) {
        void pool.end().catch(() => undefined);
    }
}

function isRetryableConnectionError(error: unknown): boolean {
    const connectionError = error as ConnectionError;
    const message = connectionError.message || "";

    return Boolean(
        connectionError.fatal ||
            connectionError.code === "PROTOCOL_CONNECTION_LOST" ||
            connectionError.code === "ECONNRESET" ||
            connectionError.code === "ECONNREFUSED" ||
            connectionError.code === "ETIMEDOUT" ||
            message.includes("Connection lost") ||
            message.includes("Not connected") ||
            message.includes("connect ETIMEDOUT")
    );
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

    if (!mysqlUser || !mysqlPassword || !mysqlDatabase) {
        throw new Error(
            "Please define MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE environment variables"
        );
    }

    const config: MySQLConfig = {
        mysql: {
            host: mysqlHost,
            port: mysqlPort,
            user: mysqlUser,
            password: mysqlPassword,
            database: mysqlDatabase,
        },
    };

    if (sshHost && sshUsername && (sshPassword || sshPrivateKey)) {
        config.ssh = {
            host: sshHost,
            port: sshPort,
            username: sshUsername,
            password: sshPassword,
            privateKey: sshPrivateKey,
        };
    }

    return config;
}

function hasSshConfig(config: MySQLConfig): config is MySQLConfig & { ssh: NonNullable<MySQLConfig["ssh"]> } {
    return Boolean(config.ssh?.host && config.ssh.username && (config.ssh.password || config.ssh.privateKey));
}

function isLocalMysqlHost(host: string): boolean {
    return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

function shouldUseSshStream(config: MySQLConfig): boolean {
    return hasSshConfig(config) && (process.env.MYSQL_CONNECTION_MODE === "ssh-stream" || process.env.VERCEL === "1");
}

function shouldUseDirectConnection(config: MySQLConfig): boolean {
    return process.env.MYSQL_CONNECTION_MODE === "direct" || !hasSshConfig(config);
}

function getSshConnectConfig(config: MySQLConfig) {
    if (!hasSshConfig(config)) {
        throw new Error(
            "Please define SSH_HOST, SSH_USERNAME, and either SSH_PASSWORD or SSH_PRIVATE_KEY environment variables"
        );
    }

    const connectConfig: {
        host: string;
        port: number;
        username: string;
        password?: string;
        privateKey?: Buffer;
        readyTimeout: number;
    } = {
        host: config.ssh.host,
        port: config.ssh.port,
        username: config.ssh.username,
        readyTimeout: 10000,
    };

    if (config.ssh.privateKey) {
        connectConfig.privateKey = Buffer.from(config.ssh.privateKey.replace(/\\n/g, "\n"));
    } else if (config.ssh.password) {
        connectConfig.password = config.ssh.password;
    }

    return connectConfig;
}

async function createSshForwardStream(config: MySQLConfig): Promise<{ client: Client; stream: Duplex }> {
    return new Promise((resolve, reject) => {
        const sshClient = new Client();
        let settled = false;

        const fail = (error: Error) => {
            if (settled) {
                return;
            }
            settled = true;
            sshClient.end();
            reject(error);
        };

        sshClient.once("ready", () => {
            sshClient.forwardOut(
                "127.0.0.1",
                0,
                config.mysql.host,
                config.mysql.port,
                (error, stream) => {
                    if (error) {
                        fail(error);
                        return;
                    }

                    settled = true;
                    resolve({ client: sshClient, stream });
                }
            );
        });

        sshClient.once("error", fail);
        sshClient.connect(getSshConnectConfig(config));
    });
}

async function queryMySQLViaSshStream<T extends RowDataPacket[] | ResultSetHeader>(
    sql: string,
    params?: unknown[]
): Promise<T> {
    const config = getConfig();
    const { client, stream } = await createSshForwardStream(config);
    const connection = await mysql.createConnection({
        stream,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database,
        connectTimeout: 10000,
    });

    try {
        const [results] = await connection.query<T>(sql, params);
        return results;
    } finally {
        await connection.end().catch(() => undefined);
        client.end();
    }
}

function shouldUseSshStream(): boolean {
    return process.env.MYSQL_CONNECTION_MODE === "ssh-stream" || process.env.VERCEL === "1";
}

function getSshConnectConfig(config: MySQLConfig): {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: Buffer;
    readyTimeout: number;
} {
    const connectConfig = {
        host: config.ssh.host,
        port: config.ssh.port,
        username: config.ssh.username,
        readyTimeout: 10000,
    } as {
        host: string;
        port: number;
        username: string;
        password?: string;
        privateKey?: Buffer;
        readyTimeout: number;
    };

    if (config.ssh.privateKey) {
        connectConfig.privateKey = Buffer.from(config.ssh.privateKey);
    } else if (config.ssh.password) {
        connectConfig.password = config.ssh.password;
    }

    return connectConfig;
}

async function createSshForwardStream(config: MySQLConfig): Promise<{ client: Client; stream: Duplex }> {
    const client = new Client();

    await new Promise<void>((resolve, reject) => {
        let settled = false;
        const timeout = setTimeout(() => {
            if (settled) return;
            settled = true;
            client.end();
            reject(new Error("SSH connection timed out"));
        }, 12000);

        client.once("ready", () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            resolve();
        });

        client.once("error", (error) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            reject(error);
        });

        client.once("close", () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            reject(new Error("SSH connection closed before ready"));
        });

        client.connect(getSshConnectConfig(config));
    });

    try {
        const stream = await new Promise<Duplex>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("SSH forwardOut timed out"));
            }, 10000);

            client.forwardOut(
                "127.0.0.1",
                0,
                config.mysql.host,
                config.mysql.port,
                (error, forwardStream) => {
                    clearTimeout(timeout);
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(forwardStream as Duplex);
                }
            );
        });

        return { client, stream };
    } catch (error) {
        client.end();
        throw error;
    }
}

async function queryMySQLViaSshStream<T extends RowDataPacket[] | ResultSetHeader>(
    sql: string,
    params?: unknown[]
): Promise<T> {
    const config = getConfig();
    const { client, stream } = await createSshForwardStream(config);

    const connection = await mysql.createConnection({
        stream,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database,
        connectTimeout: 10000,
    });

    try {
        const [results] = await connection.query<T>(sql, params);
        return results;
    } finally {
        await connection.end().catch(() => undefined);
        client.end();
    }
}

/**
 * Create SSH tunnel and local proxy server
 * Returns the local port to connect to
 */
async function createSSHTunnel(config: MySQLConfig): Promise<{ client: Client; server: net.Server; localPort: number }> {
    return new Promise((resolve, reject) => {
        const sshClient = new Client();
        let server: net.Server | null = null;
        let isReady = false;

        sshClient.on("ready", () => {
            isReady = true;
            // Create a local TCP server that forwards connections through SSH
            server = net.createServer((socket) => {
                if (!isReady) {
                    socket.end();
                    return;
                }

                try {
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
                } catch {
                    socket.end();
                }
            });

            // Listen on a random available port
            server.listen(0, "127.0.0.1", () => {
                const activeServer = server;
                const address = activeServer?.address();
                if (activeServer && address && typeof address === "object") {
                    resolve({ client: sshClient, server: activeServer, localPort: address.port });
                } else {
                    reject(new Error("Failed to get server address"));
                }
            });

            server.on("error", (err) => {
                sshClient.end();
                reject(err);
            });
        });

        sshClient.on("close", () => {
            isReady = false;
            if (server) {
                markConnectionClosed(sshClient, server);
            }
        });

        sshClient.on("error", (err: Error) => {
            isReady = false;
            reject(err);
        });

        sshClient.connect(getSshConnectConfig(config));
    });
}

/**
 * Get MySQL connection pool with SSH tunnel
 * Uses connection caching for serverless environments
 */
export async function connectMySQL(): Promise<Pool> {
    if (shouldUseSshStream()) {
        throw new Error("connectMySQL pool is disabled when MYSQL_CONNECTION_MODE=ssh-stream or VERCEL=1. Use queryMySQL instead.");
    }

    if (cached.pool) {
        return cached.pool;
    }

    const config = getConfig();

    try {
        if (shouldUseSshStream(config)) {
            throw new Error("connectMySQL pool is not available when MYSQL_CONNECTION_MODE=ssh-stream");
        }

        if (shouldUseDirectConnection(config)) {
            if (process.env.VERCEL === "1" && isLocalMysqlHost(config.mysql.host)) {
                throw new Error(
                    "Vercel cannot connect to a local MYSQL_HOST. Set SSH_* variables with MYSQL_CONNECTION_MODE=ssh-stream, or use a public MySQL host with MYSQL_CONNECTION_MODE=direct."
                );
            }

            cached.pool = mysql.createPool({
                host: config.mysql.host,
                port: config.mysql.port,
                user: config.mysql.user,
                password: config.mysql.password,
                database: config.mysql.database,
                waitForConnections: true,
                connectionLimit: process.env.VERCEL === "1" ? 1 : 10,
                queueLimit: 0,
                connectTimeout: 10000,
            });

            return cached.pool;
        }

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
    if (shouldUseSshStream()) {
        return await queryMySQLViaSshStream<T>(sql, params);
    }

    try {
        const config = getConfig();
        if (shouldUseSshStream(config)) {
            return queryMySQLViaSshStream<T>(sql, params);
        }

        const pool = await connectMySQL();
        const [results] = await pool.query<T>(sql, params);
        return results;
    } catch (error) {
        if (!isRetryableConnectionError(error)) {
            throw error;
        }

        await closeMySQLConnection();
        const pool = await connectMySQL();
        const [results] = await pool.query<T>(sql, params);
        return results;
    }
}

/**
 * Get a single connection from the pool (for transactions)
 */
export async function getConnection(): Promise<PoolConnection> {
    try {
        const config = getConfig();
        if (shouldUseSshStream(config)) {
            throw new Error("Transactions are not supported when MYSQL_CONNECTION_MODE=ssh-stream");
        }

        const pool = await connectMySQL();
        return pool.getConnection();
    } catch (error) {
        if (!isRetryableConnectionError(error)) {
            throw error;
        }

        await closeMySQLConnection();
        const pool = await connectMySQL();
        return pool.getConnection();
    }
}

/**
 * Close MySQL connection and SSH tunnel
 */
export async function closeMySQLConnection(): Promise<void> {
    if (cached.pool) {
        await cached.pool.end().catch(() => undefined);
        cached.pool = null;
    }

    if (cached.server) {
        try {
            cached.server.close();
        } catch {
            // Server may already be closed after an SSH disconnect.
        }
        cached.server = null;
    }

    if (cached.sshClient) {
        try {
            cached.sshClient.end();
        } catch {
            // SSH client may already be disconnected.
        }
        cached.sshClient = null;
    }

    cached.localPort = null;
}

// Re-export types for convenience
export type { Pool, PoolConnection, RowDataPacket, ResultSetHeader };
