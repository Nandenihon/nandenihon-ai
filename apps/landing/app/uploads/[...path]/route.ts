import { NextRequest, NextResponse } from "next/server";
import { fetchR2Object } from "@repo/utils/r2-upload";

interface RouteParams {
    params: Promise<{ path: string[] }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
    const { path: filePathParts } = await params;
    const key = filePathParts.join("/");

    try {
        const r2Response = await fetchR2Object(key);
        if (!r2Response?.body) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
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

        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
}
