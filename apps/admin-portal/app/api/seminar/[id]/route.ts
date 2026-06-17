import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import type { Seminar, UpdateSeminarInput, SeminarResponse } from "@repo/types";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/seminar/:id
 * Get single seminar by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const seminarId = parseInt(id, 10);

        if (isNaN(seminarId)) {
            return NextResponse.json(
                { error: "Invalid seminar ID" },
                { status: 400 }
            );
        }

        const seminars = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM seminar WHERE id = ?",
            [seminarId]
        );

        if (seminars.length === 0) {
            return NextResponse.json(
                { error: "Seminar not found" },
                { status: 404 }
            );
        }

        const response: SeminarResponse = {
            data: seminars[0] as Seminar,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching seminar:", error);
        return NextResponse.json(
            { error: "Failed to fetch seminar" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/seminar/:id
 * Update seminar by ID
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const seminarId = parseInt(id, 10);

        if (isNaN(seminarId)) {
            return NextResponse.json(
                { error: "Invalid seminar ID" },
                { status: 400 }
            );
        }

        const body: UpdateSeminarInput = await request.json();

        // Build dynamic update query based on provided fields
        const updateFields: string[] = [];
        const updateValues: (string | number | null)[] = [];

        const fieldMappings: { key: keyof UpdateSeminarInput; column: string }[] = [
            { key: "theme", column: "theme" },
            { key: "speaker", column: "speaker" },
            { key: "event_date", column: "event_date" },
            { key: "event_time", column: "event_time" },
            { key: "image_banner", column: "image_banner" },
            { key: "status", column: "status" },
        ];

        for (const mapping of fieldMappings) {
            if (body[mapping.key] !== undefined) {
                updateFields.push(`${mapping.column} = ?`);
                updateValues.push(body[mapping.key] ?? null);
            }
        }

        if (updateFields.length === 0) {
            return NextResponse.json(
                { error: "No fields to update" },
                { status: 400 }
            );
        }

        updateValues.push(seminarId);

        await queryMySQL<ResultSetHeader>(
            `UPDATE seminar SET ${updateFields.join(", ")} WHERE id = ?`,
            updateValues
        );

        // Fetch the updated seminar
        const seminars = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM seminar WHERE id = ?",
            [seminarId]
        );

        if (seminars.length === 0) {
            return NextResponse.json(
                { error: "Seminar not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: seminars[0] as Seminar });
    } catch (error) {
        console.error("Error updating seminar:", error);
        return NextResponse.json(
            { error: "Failed to update seminar" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/seminar/:id
 * Delete seminar by ID
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const seminarId = parseInt(id, 10);

        if (isNaN(seminarId)) {
            return NextResponse.json(
                { error: "Invalid seminar ID" },
                { status: 400 }
            );
        }

        // Check if seminar exists
        const seminars = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM seminar WHERE id = ?",
            [seminarId]
        );

        if (seminars.length === 0) {
            return NextResponse.json(
                { error: "Seminar not found" },
                { status: 404 }
            );
        }

        await queryMySQL<ResultSetHeader>(
            "DELETE FROM seminar WHERE id = ?",
            [seminarId]
        );

        return NextResponse.json({ message: "Seminar deleted successfully" });
    } catch (error) {
        console.error("Error deleting seminar:", error);
        return NextResponse.json(
            { error: "Failed to delete seminar" },
            { status: 500 }
        );
    }
}
