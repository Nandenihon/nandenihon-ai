import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import type { Team, CreateTeamInput, TeamListResponse } from "@repo/types";

const DEFAULT_PAGE_SIZE = 10;

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
                photo || null,
                full_name || null,
                nickname || null,
                place_of_birth || null,
                birth_date || null,
                email || null,
                phone_number || null,
                team_group || null,
                division || null,
                jlpt_level || null,
                domicile || null,
                instagram || null,
                motto || null,
                fun_fact || null,
                favorites || null,
                join_date || null,
                last_date || null,
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
