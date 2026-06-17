import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import type {
    SeminarRegistration,
    CreateSeminarRegistrationInput,
    SeminarRegistrationListResponse,
} from "@repo/types";

const DEFAULT_PAGE_SIZE = 10;

/**
 * GET /api/seminar-registration
 * List all seminar registrations with pagination.
 * Supports optional ?theme= filter to fetch registrations for a specific seminar.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);
        const offset = (page - 1) * limit;
        const theme = searchParams.get("theme");

        let countSql = "SELECT COUNT(*) as total FROM seminar_registration";
        let dataSql =
            "SELECT * FROM seminar_registration ORDER BY id DESC LIMIT ? OFFSET ?";
        const params: (string | number)[] = [limit, offset];

        if (theme) {
            countSql += " WHERE theme = ?";
            dataSql =
                "SELECT * FROM seminar_registration WHERE theme = ? ORDER BY id DESC LIMIT ? OFFSET ?";
            params.unshift(theme);
        }

        // Get total count
        const countParams = theme ? [theme] : [];
        const countResult = await queryMySQL<RowDataPacket[]>(countSql, countParams);
        const total = countResult[0]?.total || 0;

        // Get paginated registrations
        const registrations = await queryMySQL<RowDataPacket[]>(dataSql, params);

        const response: SeminarRegistrationListResponse = {
            data: registrations as SeminarRegistration[],
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
        console.error("Error fetching seminar registrations:", error);
        return NextResponse.json(
            { error: "Failed to fetch seminar registrations", details: errorMessage },
            { status: 500 }
        );
    }
}

/**
 * POST /api/seminar-registration
 * Create a new seminar registration
 */
export async function POST(request: NextRequest) {
    try {
        const body: CreateSeminarRegistrationInput = await request.json();

        const {
            full_name,
            gender,
            age,
            domicile,
            whatsapp_number,
            source,
            question,
            theme,
        } = body;

        // Validate required fields
        if (
            !full_name ||
            !gender ||
            age === undefined ||
            age === null ||
            !domicile ||
            !whatsapp_number ||
            !source ||
            !theme
        ) {
            return NextResponse.json(
                {
                    error: "Missing required fields",
                    details:
                        "full_name, gender, age, domicile, whatsapp_number, source, and theme are required",
                },
                { status: 400 }
            );
        }

        const result = await queryMySQL<ResultSetHeader>(
            `INSERT INTO seminar_registration (full_name, gender, age, domicile, whatsapp_number, source, question, theme)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                full_name,
                gender,
                age,
                domicile,
                whatsapp_number,
                source,
                question ?? null,
                theme,
            ]
        );

        const insertedId = result.insertId;

        // Fetch the created registration
        const registrations = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM seminar_registration WHERE id = ?",
            [insertedId]
        );

        return NextResponse.json(
            { data: registrations[0] as SeminarRegistration },
            { status: 201 }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error creating seminar registration:", error);
        return NextResponse.json(
            { error: "Failed to create seminar registration", details: errorMessage },
            { status: 500 }
        );
    }
}
