import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import type { Class, CreateClassInput, ClassListResponse } from "@repo/types";

const DEFAULT_PAGE_SIZE = 10;

/**
 * GET /api/class
 * List all classes with pagination
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await queryMySQL<RowDataPacket[]>(
            "SELECT COUNT(*) as total FROM `class`"
        );
        const total = countResult[0]?.total || 0;

        // Get paginated classes
        const classes = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM `class` ORDER BY id DESC LIMIT ? OFFSET ?",
            [limit, offset]
        );

        const response: ClassListResponse = {
            data: classes as Class[],
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
        console.error("Error fetching classes:", error);
        return NextResponse.json(
            { error: "Failed to fetch classes", details: errorMessage },
            { status: 500 }
        );
    }
}

/**
 * POST /api/class
 * Create a new class
 */
export async function POST(request: NextRequest) {
    try {
        const body: CreateClassInput = await request.json();

        const {
            class_name,
            level,
            description,
            register_start,
            register_end,
            register_fee,
            status,
            image_banner,
        } = body;

        // Validate required fields
        if (
            !class_name ||
            !level ||
            !description ||
            !register_start ||
            !register_end ||
            register_fee === undefined ||
            register_fee === null ||
            !status ||
            !image_banner
        ) {
            return NextResponse.json(
                {
                    error: "Missing required fields",
                    details:
                        "class_name, level, description, register_start, register_end, register_fee, status, and image_banner are required",
                },
                { status: 400 }
            );
        }

        const result = await queryMySQL<ResultSetHeader>(
            `INSERT INTO \`class\` (class_name, level, description, register_start, register_end, register_fee, status, image_banner)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                class_name,
                level,
                description,
                register_start,
                register_end,
                register_fee,
                status,
                image_banner,
            ]
        );

        const insertedId = result.insertId;

        // Fetch the created class
        const classes = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM `class` WHERE id = ?",
            [insertedId]
        );

        return NextResponse.json(
            { data: classes[0] as Class },
            { status: 201 }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error creating class:", error);
        return NextResponse.json(
            { error: "Failed to create class", details: errorMessage },
            { status: 500 }
        );
    }
}
