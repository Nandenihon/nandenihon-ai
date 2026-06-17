import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import type {
    SeminarRegistration,
    UpdateSeminarRegistrationInput,
    SeminarRegistrationResponse,
} from "@repo/types";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/seminar-registration/:id
 * Get single seminar registration by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const registrationId = parseInt(id, 10);

        if (isNaN(registrationId)) {
            return NextResponse.json(
                { error: "Invalid registration ID" },
                { status: 400 }
            );
        }

        const registrations = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM seminar_registration WHERE id = ?",
            [registrationId]
        );

        if (registrations.length === 0) {
            return NextResponse.json(
                { error: "Seminar registration not found" },
                { status: 404 }
            );
        }

        const response: SeminarRegistrationResponse = {
            data: registrations[0] as SeminarRegistration,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching seminar registration:", error);
        return NextResponse.json(
            { error: "Failed to fetch seminar registration" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/seminar-registration/:id
 * Update seminar registration by ID
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const registrationId = parseInt(id, 10);

        if (isNaN(registrationId)) {
            return NextResponse.json(
                { error: "Invalid registration ID" },
                { status: 400 }
            );
        }

        const body: UpdateSeminarRegistrationInput = await request.json();

        // Build dynamic update query based on provided fields
        const updateFields: string[] = [];
        const updateValues: (string | number | null)[] = [];

        const fieldMappings: {
            key: keyof UpdateSeminarRegistrationInput;
            column: string;
        }[] = [
            { key: "full_name", column: "full_name" },
            { key: "gender", column: "gender" },
            { key: "age", column: "age" },
            { key: "domicile", column: "domicile" },
            { key: "whatsapp_number", column: "whatsapp_number" },
            { key: "source", column: "source" },
            { key: "question", column: "question" },
            { key: "theme", column: "theme" },
        ];

        for (const mapping of fieldMappings) {
            if (body[mapping.key] !== undefined) {
                updateFields.push(`${mapping.column} = ?`);
                // Allow explicit null for the optional `question` field
                updateValues.push(body[mapping.key] ?? null);
            }
        }

        if (updateFields.length === 0) {
            return NextResponse.json(
                { error: "No fields to update" },
                { status: 400 }
            );
        }

        updateValues.push(registrationId);

        await queryMySQL<ResultSetHeader>(
            `UPDATE seminar_registration SET ${updateFields.join(", ")} WHERE id = ?`,
            updateValues
        );

        // Fetch the updated registration
        const registrations = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM seminar_registration WHERE id = ?",
            [registrationId]
        );

        if (registrations.length === 0) {
            return NextResponse.json(
                { error: "Seminar registration not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: registrations[0] as SeminarRegistration });
    } catch (error) {
        console.error("Error updating seminar registration:", error);
        return NextResponse.json(
            { error: "Failed to update seminar registration" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/seminar-registration/:id
 * Delete seminar registration by ID
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const registrationId = parseInt(id, 10);

        if (isNaN(registrationId)) {
            return NextResponse.json(
                { error: "Invalid registration ID" },
                { status: 400 }
            );
        }

        // Check if registration exists
        const registrations = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM seminar_registration WHERE id = ?",
            [registrationId]
        );

        if (registrations.length === 0) {
            return NextResponse.json(
                { error: "Seminar registration not found" },
                { status: 404 }
            );
        }

        await queryMySQL<ResultSetHeader>(
            "DELETE FROM seminar_registration WHERE id = ?",
            [registrationId]
        );

        return NextResponse.json({ message: "Seminar registration deleted successfully" });
    } catch (error) {
        console.error("Error deleting seminar registration:", error);
        return NextResponse.json(
            { error: "Failed to delete seminar registration" },
            { status: 500 }
        );
    }
}
