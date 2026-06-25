import { readFile, stat } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
const CONTENT_TYPES: Record<string, string> = {
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
};

interface RouteParams {
    params: Promise<{ path: string[] }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
    const { path: filePathParts } = await params;
    const safePath = filePathParts.join(path.sep);
    const fullPath = path.resolve(UPLOAD_DIR, safePath);
    const uploadRoot = path.resolve(UPLOAD_DIR);

    if (!fullPath.startsWith(`${uploadRoot}${path.sep}`)) {
        return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    try {
        const fileStat = await stat(fullPath);
        if (!fileStat.isFile()) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        const file = await readFile(fullPath);
        const contentType = CONTENT_TYPES[path.extname(fullPath).toLowerCase()] || "application/octet-stream";

        return new NextResponse(file, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
}
