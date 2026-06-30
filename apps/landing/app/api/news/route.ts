import { NextRequest, NextResponse } from "next/server";
import { listNews } from "@repo/database";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const search = searchParams.get("search") || undefined;
        const category = searchParams.get("category") || undefined;

        const news = await listNews({ page, limit, search, category });
        return NextResponse.json(news);
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        console.error("Error fetching news:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data news", details },
            { status: 500 }
        );
    }
}
