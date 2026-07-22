import { NextRequest, NextResponse } from "next/server";
import { getContentTypeFromFilename, sanitizeUploadFolder, uploadFileToR2 } from "@repo/utils/r2-upload";

const MAX_FILE_SIZE = Number(process.env.UPLOAD_MAX_FILE_SIZE || 20 * 1024 * 1024); // 20MB

export function GET() {
    return NextResponse.json(
        { error: "Method not allowed. Use POST multipart/form-data to upload files." },
        {
            status: 405,
            headers: { Allow: "POST" },
        }
    );
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const folder = sanitizeUploadFolder(formData.get("folder"));

        // 1. Validasi File Ada
        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // 2. Validasi Ukuran File
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size is ${Math.floor(MAX_FILE_SIZE / 1024 / 1024)}MB` },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const upload = await uploadFileToR2({
            buffer: Buffer.from(bytes),
            contentType: file.type || getContentTypeFromFilename(file.name),
            folder,
            originalFilename: file.name,
        });

        return NextResponse.json({
            success: true,
            storage: upload.storage,
            bucket: upload.bucket,
            filename: upload.filename,
            key: upload.key,
            pathname: upload.pathname,
            url: upload.publicUrl,
            size: file.size,
            type: upload.contentType
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
