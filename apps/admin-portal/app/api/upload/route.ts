import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { Client, type ConnectConfig, type SFTPWrapper } from "ssh2";

const DEFAULT_UPLOAD_DIR = "/var/www/nandenihon-ai/uploads";
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || DEFAULT_UPLOAD_DIR);
const UPLOAD_PUBLIC_PATH = process.env.UPLOAD_PUBLIC_PATH || "/uploads";
const UPLOAD_PUBLIC_BASE_URL =
    process.env.UPLOAD_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_UPLOAD_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://nandenihon.com";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const EXTENSIONS: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

function sanitizeFolder(folder: FormDataEntryValue | null): string {
    if (typeof folder !== "string") return "images";
    const sanitized = folder.toLowerCase().replace(/[^a-z0-9-_]/g, "");
    return sanitized || "images";
}

function getSafeUploadPath(folder: string, filename: string): { directory: string; filepath: string } {
    const directory = path.resolve(UPLOAD_DIR, folder);
    const filepath = path.resolve(directory, filename);

    if (!directory.startsWith(`${UPLOAD_DIR}${path.sep}`) || !filepath.startsWith(`${directory}${path.sep}`)) {
        throw new Error("Invalid upload path");
    }

    return { directory, filepath };
}

function hasSshUploadConfig(): boolean {
    return Boolean(process.env.SSH_HOST && process.env.SSH_USERNAME && (process.env.SSH_PASSWORD || process.env.SSH_PRIVATE_KEY));
}

function getSshConfig(): ConnectConfig {
    const config: ConnectConfig = {
        host: process.env.SSH_HOST,
        port: Number(process.env.SSH_PORT || 22),
        username: process.env.SSH_USERNAME,
        readyTimeout: 10000,
    };

    if (process.env.SSH_PRIVATE_KEY) {
        config.privateKey = Buffer.from(process.env.SSH_PRIVATE_KEY);
    } else {
        config.password = process.env.SSH_PASSWORD;
    }

    return config;
}

function connectSsh(): Promise<Client> {
    return new Promise((resolve, reject) => {
        const client = new Client();
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
            resolve(client);
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
        client.connect(getSshConfig());
    });
}

function execSsh(client: Client, command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error(`SSH command timed out: ${command}`));
        }, 10000);

        client.exec(command, (error, stream) => {
            if (error) {
                clearTimeout(timeout);
                reject(error);
                return;
            }

            let stderr = "";
            stream.resume();
            stream.stderr.on("data", (data: Buffer) => {
                stderr += data.toString();
            });
            stream.on("close", (code: number) => {
                clearTimeout(timeout);
                if (code === 0) {
                    resolve();
                    return;
                }
                reject(new Error(stderr || `SSH command failed: ${command}`));
            });
        });
    });
}

function openSftp(client: Client): Promise<SFTPWrapper> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("SFTP open timed out"));
        }, 10000);

        client.sftp((error, sftp) => {
            clearTimeout(timeout);
            if (error) {
                reject(error);
                return;
            }
            resolve(sftp);
        });
    });
}

function writeRemoteFile(sftp: SFTPWrapper, filepath: string, buffer: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error(`SFTP write timed out: ${filepath}`));
        }, 15000);

        sftp.writeFile(filepath, buffer, (error) => {
            clearTimeout(timeout);
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}

async function uploadToVps(directory: string, filepath: string, buffer: Buffer): Promise<void> {
    const client = await connectSsh();
    try {
        await execSsh(client, `mkdir -p ${JSON.stringify(directory)}`);
        const sftp = await openSftp(client);
        try {
            await writeRemoteFile(sftp, filepath, buffer);
        } finally {
            sftp.end();
        }
    } finally {
        client.end();
    }
}

async function uploadFile(directory: string, filepath: string, buffer: Buffer): Promise<"sftp" | "local"> {
    if (hasSshUploadConfig()) {
        await uploadToVps(directory, filepath, buffer);
        return "sftp";
    }

    await mkdir(directory, { recursive: true });
    await writeFile(filepath, buffer);
    return "local";
}

/**
 * POST /api/upload
 * Upload image file and return the URL
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const folder = sanitizeFolder(formData.get("folder"));

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: jpg, png, webp, gif" },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 5MB" },
                { status: 400 }
            );
        }

        // Ensure upload directory exists
        const timestamp = Date.now();
        const extension = EXTENSIONS[file.type] || "jpg";
        const filename = `${timestamp}-${randomUUID()}.${extension}`;
        const { directory, filepath } = getSafeUploadPath(folder, filename);

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const storage = await uploadFile(directory, filepath, buffer);

        // Return the URL path (relative to public folder)
        const pathname = `${UPLOAD_PUBLIC_PATH}/${folder}/${filename}`;
        const url = `${UPLOAD_PUBLIC_BASE_URL.replace(/\/$/, "")}${pathname}`;

        return NextResponse.json({
            url,
            pathname,
            path: filepath,
            filename,
            size: file.size,
            type: file.type,
            storage,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error uploading file:", error);
        return NextResponse.json(
            { error: "Failed to upload file", details: message },
            { status: 500 }
        );
    }
}
