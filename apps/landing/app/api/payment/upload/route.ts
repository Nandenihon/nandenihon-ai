import { NextRequest, NextResponse } from "next/server";
import { findStudentById, isValidNumericId, updateStudentPaymentProof } from "@repo/database";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { logInfo, logWarn, logError } from "@repo/utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const studentId = formData.get("studentId") as string;
        const file = formData.get("file") as File | null;

        // Validate studentId
        if (!studentId || studentId.trim() === "") {
            return NextResponse.json(
                { success: false, error: "Student ID is required" },
                { status: 400 }
            );
        }

        if (!isValidNumericId(studentId)) {
            return NextResponse.json(
                { success: false, error: "Invalid student ID" },
                { status: 400 }
            );
        }

        // Validate file presence
        if (!file) {
            return NextResponse.json(
                { success: false, error: "File is required" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: "Invalid file type. Allowed: jpg, png, pdf" },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: "File too large. Maximum size: 5MB" },
                { status: 400 }
            );
        }

        // Find student
        const student = await findStudentById(studentId);

        if (!student) {
            return NextResponse.json(
                { success: false, error: "Student not found" },
                { status: 404 }
            );
        }

        // Security gate: only passed students can upload
        if (student.passStatus !== "passed") {
            await logWarn("api/payment/upload", "Non-passed student attempted upload", { studentId, passStatus: student.passStatus });
            return NextResponse.json(
                { success: false, error: "Only passed students can upload payment proof" },
                { status: 403 }
            );
        }

        await logInfo("api/payment/upload", "Payment upload started", { studentId, email: student.email, fileType: file.type, fileSize: file.size });

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "payment");
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename using email prefix
        const emailPrefix = student.email.split("@")[0];
        const timestamp = Date.now();
        const extension = file.name.split(".").pop() || "jpg";
        const filename = `${emailPrefix}_${timestamp}.${extension}`;
        const filepath = path.join(uploadsDir, filename);

        // Write file to disk
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Update student record with payment proof URL
        const paymentProofUrl = `/uploads/payment/${filename}`;
        await updateStudentPaymentProof(student.id, paymentProofUrl);

        await logInfo("api/payment/upload", "Payment upload success", { studentId, email: student.email, filename, paymentProofUrl });

        return NextResponse.json({
            success: true,
            data: {
                paymentProofUrl,
                nextStep: "registration_form",
            },
        });
    } catch (error: any) {
        await logError("api/payment/upload", "Payment upload error", { error: error.message, stack: error.stack });
        console.error("Payment upload error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
