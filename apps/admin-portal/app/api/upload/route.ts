import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
const UPLOAD_PUBLIC_PATH = process.env.UPLOAD_PUBLIC_PATH || "/uploads";
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
        const uploadDir = path.join(UPLOAD_DIR, folder);
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const extension = EXTENSIONS[file.type] || "jpg";
        const filename = `${timestamp}-${randomUUID()}.${extension}`;

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        // Return the URL path (relative to public folder)
        const url = `${UPLOAD_PUBLIC_PATH}/${folder}/${filename}`;

        return NextResponse.json({
            url,
            path: filepath,
            filename,
            size: file.size,
            type: file.type,
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}
