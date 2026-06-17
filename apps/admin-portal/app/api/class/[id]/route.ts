import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import type { Class, UpdateClassInput, ClassResponse } from "@repo/types";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/class/:id
 * Get single class by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const classId = parseInt(id, 10);

        if (isNaN(classId)) {
            return NextResponse.json(
                { error: "Invalid class ID" },
                { status: 400 }
            );
        }

        const classes = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM `class` WHERE id = ?",
            [classId]
        );

        if (classes.length === 0) {
            return NextResponse.json(
                { error: "Class not found" },
                { status: 404 }
            );
        }

        const response: ClassResponse = {
            data: classes[0] as Class,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching class:", error);
        return NextResponse.json(
            { error: "Failed to fetch class" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/class/:id
 * Update class by ID
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const classId = parseInt(id, 10);

        if (isNaN(classId)) {
            return NextResponse.json(
                { error: "Invalid class ID" },
                { status: 400 }
            );
        }

        const body: UpdateClassInput = await request.json();

        // Build dynamic update query based on provided fields
        const updateFields: string[] = [];
        const updateValues: (string | number | null)[] = [];

        const fieldMappings: { key: keyof UpdateClassInput; column: string }[] = [
            { key: "class_name", column: "class_name" },
            { key: "level", column: "level" },
            { key: "description", column: "description" },
            { key: "register_start", column: "register_start" },
            { key: "register_end", column: "register_end" },
            { key: "register_fee", column: "register_fee" },
            { key: "status", column: "status" },
            { key: "image_banner", column: "image_banner" },
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

        updateValues.push(classId);

        await queryMySQL<ResultSetHeader>(
            `UPDATE \`class\` SET ${updateFields.join(", ")} WHERE id = ?`,
            updateValues
        );

        // Fetch the updated class
        const classes = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM `class` WHERE id = ?",
            [classId]
        );

        if (classes.length === 0) {
            return NextResponse.json(
                { error: "Class not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: classes[0] as Class });
    } catch (error) {
        console.error("Error updating class:", error);
        return NextResponse.json(
            { error: "Failed to update class" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/class/:id
 * Delete class by ID
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const classId = parseInt(id, 10);

        if (isNaN(classId)) {
            return NextResponse.json(
                { error: "Invalid class ID" },
                { status: 400 }
            );
        }

        // Check if class exists
        const classes = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM `class` WHERE id = ?",
            [classId]
        );

        if (classes.length === 0) {
            return NextResponse.json(
                { error: "Class not found" },
                { status: 404 }
            );
        }

        await queryMySQL<ResultSetHeader>(
            "DELETE FROM `class` WHERE id = ?",
            [classId]
        );

        return NextResponse.json({ message: "Class deleted successfully" });
    } catch (error) {
        console.error("Error deleting class:", error);
        return NextResponse.json(
            { error: "Failed to delete class" },
            { status: 500 }
        );
    }
}
