import { NextRequest, NextResponse } from "next/server";
import { connectDB, Student } from "@repo/database";

/**
 * POST /api/student/check-email
 * Check if an email exists in the database and return status information
 * Body: { email: string, level: string }
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { email, level } = body;

        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { success: false, error: "Email is required" },
                { status: 400 }
            );
        }

        if (!level || typeof level !== "string") {
            return NextResponse.json(
                { success: false, error: "Level is required" },
                { status: 400 }
            );
        }

        const existingStudent = await Student.findOne({ email: email.toLowerCase() });

        if (!existingStudent) {
            return NextResponse.json({
                success: true,
                data: {
                    exists: false,
                },
            });
        }

        // Case 1: User completed test and passed
        if (existingStudent.testStatus === "completed" && existingStudent.passStatus === "passed") {
            return NextResponse.json({
                success: true,
                data: {
                    exists: true,
                    status: "passed",
                    studentId: existingStudent._id.toString(),
                    fullName: existingStudent.fullName,
                    level: existingStudent.level,
                },
            });
        }

        // Case 2: User completed test and failed
        if (existingStudent.testStatus === "completed" && existingStudent.passStatus === "failed") {
            return NextResponse.json({
                success: true,
                data: {
                    exists: true,
                    status: "failed",
                },
            });
        }

        // Case 3: User registered with different level
        if (existingStudent.level && existingStudent.level !== level) {
            return NextResponse.json({
                success: true,
                data: {
                    exists: true,
                    status: "level_mismatch",
                    registeredLevel: existingStudent.level,
                },
            });
        }

        // Case 4: User has pending or in-progress test (allow retry)
        return NextResponse.json({
            success: true,
            data: {
                exists: true,
                status: "in_progress",
                studentId: existingStudent._id.toString(),
            },
        });

    } catch (error) {
        console.error("Check email error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
