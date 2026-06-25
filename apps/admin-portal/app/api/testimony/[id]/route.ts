import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import type { Testimony, UpdateTestimonyInput, TestimonyResponse } from "@repo/types";

interface RouteParams {
    params: Promise<{ id: string }>;
}

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
 * GET /api/testimony/:id
 * Get single testimony by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const testimonyId = parseInt(id, 10);

        if (isNaN(testimonyId)) {
            return NextResponse.json(
                { error: "Invalid testimony ID" },
                { status: 400 }
            );
        }

        const testimonies = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM testimony WHERE id = ?",
            [testimonyId]
        );

        if (testimonies.length === 0) {
            return NextResponse.json(
                { error: "Testimony not found" },
                { status: 404 }
            );
        }

        const response: TestimonyResponse = {
            data: testimonies[0] as Testimony,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching testimony:", error);
        return NextResponse.json(
            { error: "Failed to fetch testimony" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/testimony/:id
 * Update testimony by ID
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const testimonyId = parseInt(id, 10);

        if (isNaN(testimonyId)) {
            return NextResponse.json(
                { error: "Invalid testimony ID" },
                { status: 400 }
            );
        }

        const body: UpdateTestimonyInput = await request.json();
        const parsedAge = body.age !== undefined ? parseAge(body.age) : undefined;

        if (body.testimonial_text !== undefined && !optionalText(body.testimonial_text)) {
            return NextResponse.json(
                { error: "Testimonial text is required" },
                { status: 400 }
            );
        }

        if (parsedAge === null) {
            return NextResponse.json(
                { error: "Age must be a valid number between 0 and 150" },
                { status: 400 }
            );
        }

        // Build dynamic update query based on provided fields
        const updateFields: string[] = [];
        const updateValues: (string | number | null)[] = [];

        if (body.photo !== undefined) {
            updateFields.push("photo = ?");
            updateValues.push(optionalText(body.photo));
        }
        if (body.nickname !== undefined) {
            updateFields.push("nickname = ?");
            updateValues.push(optionalText(body.nickname));
        }
        if (body.email !== undefined) {
            updateFields.push("email = ?");
            updateValues.push(optionalText(body.email));
        }
        if (parsedAge !== undefined) {
            updateFields.push("age = ?");
            updateValues.push(parsedAge);
        }
        if (body.testimonial_text !== undefined) {
            updateFields.push("testimonial_text = ?");
            updateValues.push(optionalText(body.testimonial_text));
        }

        if (updateFields.length === 0) {
            return NextResponse.json(
                { error: "No fields to update" },
                { status: 400 }
            );
        }

        updateValues.push(testimonyId);

        await queryMySQL<ResultSetHeader>(
            `UPDATE testimony SET ${updateFields.join(", ")} WHERE id = ?`,
            updateValues
        );

        // Fetch the updated testimony
        const testimonies = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM testimony WHERE id = ?",
            [testimonyId]
        );

        if (testimonies.length === 0) {
            return NextResponse.json(
                { error: "Testimony not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: testimonies[0] as Testimony });
    } catch (error) {
        console.error("Error updating testimony:", error);
        return NextResponse.json(
            { error: "Failed to update testimony" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/testimony/:id
 * Delete testimony by ID
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const testimonyId = parseInt(id, 10);

        if (isNaN(testimonyId)) {
            return NextResponse.json(
                { error: "Invalid testimony ID" },
                { status: 400 }
            );
        }

        // Check if testimony exists
        const testimonies = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM testimony WHERE id = ?",
            [testimonyId]
        );

        if (testimonies.length === 0) {
            return NextResponse.json(
                { error: "Testimony not found" },
                { status: 404 }
            );
        }

        await queryMySQL<ResultSetHeader>(
            "DELETE FROM testimony WHERE id = ?",
            [testimonyId]
        );

        return NextResponse.json({ message: "Testimony deleted successfully" });
    } catch (error) {
        console.error("Error deleting testimony:", error);
        return NextResponse.json(
            { error: "Failed to delete testimony" },
            { status: 500 }
        );
    }
}
