import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import type { Team, UpdateTeamInput, TeamResponse } from "@repo/types";

interface RouteParams {
    params: Promise<{ id: string }>;
}

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

function normalizeTeamValue(key: keyof UpdateTeamInput, value: unknown): string | number | null {
    switch (key) {
        case "full_name":
        case "nickname":
        case "email":
        case "phone_number":
            return toRequiredText(value);
        case "birth_date":
            return toRequiredDate(value);
        case "join_date":
        case "last_date":
            return toRequiredDate(value, new Date().toISOString().slice(0, 10));
        case "photo":
        case "place_of_birth":
        case "team_group":
        case "division":
        case "jlpt_level":
        case "domicile":
        case "instagram":
        case "motto":
        case "fun_fact":
        case "favorites":
            return toOptionalText(value);
        default:
            return null;
    }
}

/**
 * GET /api/team/:id
 * Get single team member by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const teamId = parseInt(id, 10);

        if (isNaN(teamId)) {
            return NextResponse.json(
                { error: "Invalid team member ID" },
                { status: 400 }
            );
        }

        const teamMembers = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM team WHERE id = ?",
            [teamId]
        );

        if (teamMembers.length === 0) {
            return NextResponse.json(
                { error: "Team member not found" },
                { status: 404 }
            );
        }

        const response: TeamResponse = {
            data: teamMembers[0] as Team,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching team member:", error);
        return NextResponse.json(
            { error: "Failed to fetch team member" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/team/:id
 * Update team member by ID
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const teamId = parseInt(id, 10);

        if (isNaN(teamId)) {
            return NextResponse.json(
                { error: "Invalid team member ID" },
                { status: 400 }
            );
        }

        const body: UpdateTeamInput = await request.json();

        // Build dynamic update query based on provided fields
        const updateFields: string[] = [];
        const updateValues: (string | number | null)[] = [];

        const fieldMappings: { key: keyof UpdateTeamInput; column: string }[] = [
            { key: "photo", column: "photo" },
            { key: "full_name", column: "full_name" },
            { key: "nickname", column: "nickname" },
            { key: "place_of_birth", column: "place_of_birth" },
            { key: "birth_date", column: "birth_date" },
            { key: "email", column: "email" },
            { key: "phone_number", column: "phone_number" },
            { key: "team_group", column: "team_group" },
            { key: "division", column: "division" },
            { key: "jlpt_level", column: "jlpt_level" },
            { key: "domicile", column: "domicile" },
            { key: "instagram", column: "instagram" },
            { key: "motto", column: "motto" },
            { key: "fun_fact", column: "fun_fact" },
            { key: "favorites", column: "favorites" },
            { key: "join_date", column: "join_date" },
            { key: "last_date", column: "last_date" },
        ];

        for (const mapping of fieldMappings) {
            if (body[mapping.key] !== undefined) {
                updateFields.push(`${mapping.column} = ?`);
                updateValues.push(normalizeTeamValue(mapping.key, body[mapping.key]));
            }
        }

        if (updateFields.length === 0) {
            return NextResponse.json(
                { error: "No fields to update" },
                { status: 400 }
            );
        }

        updateValues.push(teamId);

        await queryMySQL<ResultSetHeader>(
            `UPDATE team SET ${updateFields.join(", ")} WHERE id = ?`,
            updateValues
        );

        // Fetch the updated team member
        const teamMembers = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM team WHERE id = ?",
            [teamId]
        );

        if (teamMembers.length === 0) {
            return NextResponse.json(
                { error: "Team member not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: teamMembers[0] as Team });
    } catch (error) {
        console.error("Error updating team member:", error);
        return NextResponse.json(
            { error: "Failed to update team member" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/team/:id
 * Delete team member by ID
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const teamId = parseInt(id, 10);

        if (isNaN(teamId)) {
            return NextResponse.json(
                { error: "Invalid team member ID" },
                { status: 400 }
            );
        }

        // Check if team member exists
        const teamMembers = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM team WHERE id = ?",
            [teamId]
        );

        if (teamMembers.length === 0) {
            return NextResponse.json(
                { error: "Team member not found" },
                { status: 404 }
            );
        }

        await queryMySQL<ResultSetHeader>(
            "DELETE FROM team WHERE id = ?",
            [teamId]
        );

        return NextResponse.json({ message: "Team member deleted successfully" });
    } catch (error) {
        console.error("Error deleting team member:", error);
        return NextResponse.json(
            { error: "Failed to delete team member" },
            { status: 500 }
        );
    }
}
