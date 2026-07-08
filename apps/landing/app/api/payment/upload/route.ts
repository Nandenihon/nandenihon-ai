import { NextRequest, NextResponse } from "next/server";
import { findStudentById, isValidNumericId, updateStudentPaymentProof } from "@repo/database";
import { logInfo, logWarn, logError } from "@repo/utils";
import { getContentTypeFromFilename, sanitizeFilenamePrefix, uploadFileToR2 } from "@repo/utils/r2-upload";

const MAX_FILE_SIZE = Number(process.env.UPLOAD_MAX_FILE_SIZE || 20 * 1024 * 1024); // 20MB

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

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: `File too large. Maximum size: ${Math.floor(MAX_FILE_SIZE / 1024 / 1024)}MB` },
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

        const emailPrefix = student.email.split("@")[0];
        const bytes = await file.arrayBuffer();
        const upload = await uploadFileToR2({
            buffer: Buffer.from(bytes),
            contentType: file.type || getContentTypeFromFilename(file.name),
            filenamePrefix: sanitizeFilenamePrefix(emailPrefix),
            folder: "payment",
            originalFilename: file.name,
        });

        // Update student record with payment proof URL
        const paymentProofUrl = upload.pathname;
        await updateStudentPaymentProof(student.id, paymentProofUrl);

        await logInfo("api/payment/upload", "Payment upload success", {
            studentId,
            email: student.email,
            filename: upload.filename,
            key: upload.key,
            paymentProofUrl,
        });

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
