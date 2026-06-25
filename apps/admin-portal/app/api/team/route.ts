import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import type { Team, CreateTeamInput, TeamListResponse } from "@repo/types";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_DATE = "1970-01-01";

function toOptionalText(value: unknown): string | null {
    if (typeof value !== "string") return value == null ? null : String(value);
    const trimmed = value.trim();
    return trimmed || null;
}

function toRequiredText(value: unknown): string {
    if (typeof value !== "string") return value == null ? "" : String(value);
    return value.trim();
}

function toRequiredDate(value: unknown, fallback = DEFAULT_DATE): string {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : fallback;
}

/**
 * GET /api/team
 * List all team members with pagination
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await queryMySQL<RowDataPacket[]>(
            "SELECT COUNT(*) as total FROM team"
        );
        const total = countResult[0]?.total || 0;

        // Get paginated team members
        const teamMembers = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM team ORDER BY id DESC LIMIT ? OFFSET ?",
            [limit, offset]
        );

        const response: TeamListResponse = {
            data: teamMembers as Team[],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching team members:", error);
        return NextResponse.json(
            { error: "Failed to fetch team members" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/team
 * Create new team member
 */
export async function POST(request: NextRequest) {
    try {
        const body: CreateTeamInput = await request.json();

        const {
            photo,
            full_name,
            nickname,
            place_of_birth,
            birth_date,
            email,
            phone_number,
            team_group,
            division,
            jlpt_level,
            domicile,
            instagram,
            motto,
            fun_fact,
            favorites,
            join_date,
            last_date,
        } = body;

        const result = await queryMySQL<ResultSetHeader>(
            `INSERT INTO team (
                photo, full_name, nickname, place_of_birth, birth_date,
                email, phone_number, team_group, division, jlpt_level,
                domicile, instagram, motto, fun_fact, favorites,
                join_date, last_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                toOptionalText(photo),
                toRequiredText(full_name),
                toRequiredText(nickname),
                toOptionalText(place_of_birth),
                toRequiredDate(birth_date),
                toRequiredText(email),
                toRequiredText(phone_number),
                toOptionalText(team_group),
                toOptionalText(division),
                toOptionalText(jlpt_level),
                toOptionalText(domicile),
                toOptionalText(instagram),
                toOptionalText(motto),
                toOptionalText(fun_fact),
                toOptionalText(favorites),
                toRequiredDate(join_date, new Date().toISOString().slice(0, 10)),
                toRequiredDate(last_date, new Date().toISOString().slice(0, 10)),
            ]
        );

        const insertedId = result.insertId;

        // Fetch the created team member
        const teamMembers = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM team WHERE id = ?",
            [insertedId]
        );

        return NextResponse.json(
            { data: teamMembers[0] as Team },
            { status: 201 }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error creating team member:", error);
        return NextResponse.json(
            { error: "Failed to create team member", details: errorMessage },
            { status: 500 }
        );
    }
}
