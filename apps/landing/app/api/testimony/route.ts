import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import type { Testimony, TestimonyListResponse } from "@repo/types";

/**
 * GET /api/testimony
 * Fetch all testimonies for the landing page "Kata Mereka" section.
 * Supports optional pagination via `page` and `limit` query params.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await queryMySQL<RowDataPacket[]>(
            "SELECT COUNT(*) as total FROM testimony"
        );
        const total = countResult[0]?.total || 0;

        // Get paginated testimonies
        const testimonies = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM testimony ORDER BY id DESC LIMIT ? OFFSET ?",
            [limit, offset]
        );

        const response: TestimonyListResponse = {
            data: testimonies as Testimony[],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        console.error("Error fetching testimonies:", error);
        return NextResponse.json(
            { error: "Failed to fetch testimonies", details: errorMessage },
            { status: 500 }
        );
    }
}
