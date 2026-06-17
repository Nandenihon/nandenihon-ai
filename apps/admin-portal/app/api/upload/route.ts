import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/upload
 * Upload image file and return the URL
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

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
        await mkdir(UPLOAD_DIR, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split(".").pop() || "jpg";
        const filename = `${timestamp}-${randomSuffix}.${extension}`;

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filepath = path.join(UPLOAD_DIR, filename);
        await writeFile(filepath, buffer);

        // Return the URL path (relative to public folder)
        const url = `/uploads/${filename}`;

        return NextResponse.json({
            url,
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

/**
 * Export config to handle file uploads (disable body parsing)
 */
export const config = {
    api: {
        bodyParser: false,
    },
};
