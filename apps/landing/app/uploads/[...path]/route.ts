import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { fetchR2Object } from "@repo/utils/r2-upload";

const FALLBACK_IMAGE_PATH = path.join(process.cwd(), "public", "images", "Rectangle 6.png");
const IMAGE_EXTENSIONS = new Set(["gif", "jpeg", "jpg", "png", "svg", "webp"]);

interface RouteParams {
    params: Promise<{ path: string[] }>;
}

function isImagePath(pathname: string) {
    const extension = pathname.split(".").pop()?.toLowerCase() || "";
    return IMAGE_EXTENSIONS.has(extension);
}

async function getFallbackImageResponse() {
    const file = await readFile(FALLBACK_IMAGE_PATH);

    return new NextResponse(new Uint8Array(file), {
        headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=3600",
        },
    });
}

async function notFoundResponse(key: string) {
    if (isImagePath(key)) {
        return getFallbackImageResponse();
    }

    return NextResponse.json({ error: "File not found" }, { status: 404 });
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
    const { path: filePathParts } = await params;
    const key = filePathParts.join("/");

    try {
        const r2Response = await fetchR2Object(key);
        if (!r2Response?.body) {
            return notFoundResponse(key);
        }

        const headers = new Headers();
        const contentType = r2Response.headers.get("content-type");
        const contentLength = r2Response.headers.get("content-length");
        const contentDisposition = r2Response.headers.get("content-disposition");
        const etag = r2Response.headers.get("etag");

        if (contentType) headers.set("Content-Type", contentType);
        if (contentLength) headers.set("Content-Length", contentLength);
        if (contentDisposition) headers.set("Content-Disposition", contentDisposition);
        if (etag) headers.set("ETag", etag);
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        return new NextResponse(r2Response.body, { headers });
    } catch (error) {
        if (error instanceof Error && error.message.includes("Invalid R2 object key")) {
            return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
        }

        return notFoundResponse(key);
    }
}
