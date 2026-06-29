import { NextRequest, NextResponse } from "next/server";
import { findNewsBySlug } from "@repo/database";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const news = await findNewsBySlug(slug);

        if (!news) {
            return NextResponse.json({ error: "News tidak ditemukan" }, { status: 404 });
        }

        return NextResponse.json({ data: news });
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        console.error("Error fetching news detail:", error);
        return NextResponse.json(
            { error: "Gagal mengambil detail news", details },
            { status: 500 }
        );
    }
}
