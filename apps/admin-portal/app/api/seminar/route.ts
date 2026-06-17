import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import type { Seminar, CreateSeminarInput, SeminarListResponse } from "@repo/types";

const DEFAULT_PAGE_SIZE = 10;

/**
 * GET /api/seminar
 * List all seminars with pagination
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await queryMySQL<RowDataPacket[]>(
            "SELECT COUNT(*) as total FROM seminar"
        );
        const total = countResult[0]?.total || 0;

        // Get paginated seminars
        const seminars = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM seminar ORDER BY id DESC LIMIT ? OFFSET ?",
            [limit, offset]
        );

        const response: SeminarListResponse = {
            data: seminars as Seminar[],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error fetching seminars:", error);
        return NextResponse.json(
            { error: "Failed to fetch seminars", details: errorMessage },
            { status: 500 }
        );
    }
}

/**
 * POST /api/seminar
 * Create a new seminar
 */
export async function POST(request: NextRequest) {
    try {
        const body: CreateSeminarInput = await request.json();

        const { theme, speaker, event_date, event_time, image_banner, status } = body;

        // Validate required fields
        if (!theme || !speaker || !event_date || !event_time || !image_banner || !status) {
            return NextResponse.json(
                {
                    error: "Missing required fields",
                    details:
                        "theme, speaker, event_date, event_time, image_banner, and status are required",
                },
                { status: 400 }
            );
        }

        const result = await queryMySQL<ResultSetHeader>(
            `INSERT INTO seminar (theme, speaker, event_date, event_time, image_banner, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [theme, speaker, event_date, event_time, image_banner, status]
        );

        const insertedId = result.insertId;

        // Fetch the created seminar
        const seminars = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM seminar WHERE id = ?",
            [insertedId]
        );

        return NextResponse.json(
            { data: seminars[0] as Seminar },
            { status: 201 }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error creating seminar:", error);
        return NextResponse.json(
            { error: "Failed to create seminar", details: errorMessage },
            { status: 500 }
        );
    }
}
