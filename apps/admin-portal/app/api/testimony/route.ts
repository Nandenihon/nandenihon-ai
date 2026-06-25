import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import type { Testimony, CreateTestimonyInput, TestimonyListResponse } from "@repo/types";

const DEFAULT_PAGE_SIZE = 10;

function optionalText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function parseAge(value: unknown): number | null {
    if (value === undefined || value === null || value === "") {
        return 0;
    }

    const age = Number(value);
    if (!Number.isInteger(age) || age < 0 || age > 150) {
        return null;
    }

    return age;
}

/**
 * GET /api/testimony
 * List all testimonies with pagination
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error fetching testimonies:", error);
        return NextResponse.json(
            { error: "Failed to fetch testimonies", details: errorMessage },
            { status: 500 }
        );
    }
}

/**
 * POST /api/testimony
 * Create new testimony
 */
export async function POST(request: NextRequest) {
    try {
        const body: CreateTestimonyInput = await request.json();

        const { photo, nickname, email, age, testimonial_text } = body;
        const normalizedAge = parseAge(age);
        const normalizedText = optionalText(testimonial_text);

        if (!normalizedText) {
            return NextResponse.json(
                { error: "Testimonial text is required" },
                { status: 400 }
            );
        }

        if (normalizedAge === null) {
            return NextResponse.json(
                { error: "Age must be a valid number between 0 and 150" },
                { status: 400 }
            );
        }

        const result = await queryMySQL<ResultSetHeader>(
            `INSERT INTO testimony (photo, nickname, email, age, testimonial_text) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                optionalText(photo),
                optionalText(nickname),
                optionalText(email),
                normalizedAge,
                normalizedText,
            ]
        );

        const insertedId = result.insertId;

        // Fetch the created testimony
        const testimonies = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM testimony WHERE id = ?",
            [insertedId]
        );

        return NextResponse.json(
            { data: testimonies[0] as Testimony },
            { status: 201 }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error creating testimony:", error);
        return NextResponse.json(
            { error: "Failed to create testimony", details: errorMessage },
            { status: 500 }
        );
    }
}
