import { NextRequest, NextResponse } from "next/server";
import { fetchR2Object } from "@repo/utils/r2-upload";

interface RouteParams { params: Promise<{ path: string[] }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
    const { path } = await params;
    const key = path.join("/");
    try {
        const response = await fetchR2Object(key);
        if (!response?.body) return NextResponse.json({ error: "File not found" }, { status: 404 });
        const headers = new Headers();
        for (const name of ["content-type", "content-length", "content-disposition", "etag"]) {
            const value = response.headers.get(name);
            if (value) headers.set(name, value);
        }
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        return new NextResponse(response.body, { headers });
    } catch (error) {
        if (error instanceof Error && error.message.includes("Invalid R2 object key")) {
            return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
        }
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
}
