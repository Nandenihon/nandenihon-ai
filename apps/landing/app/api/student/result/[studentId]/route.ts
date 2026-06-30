import { NextRequest, NextResponse } from "next/server";
import { findStudentById, isValidNumericId } from "@repo/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    if (!isValidNumericId(studentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid student ID" },
        { status: 400 }
      );
    }

    const student = await findStudentById(studentId);

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    const baseResponse = {
      score: student.score,
      status: student.passStatus,
      testStatus: student.testStatus,
      registrationComplete: student.registrationComplete,
      studentInfo: {
        fullName: student.fullName,
        nickname: student.nickname,
        email: student.email,
        level: student.level,
        whatsapp: student.whatsapp,
        age: student.age,
        domicile: student.domicile,
        motivation: student.motivation,
      },
    };

    if (student.passStatus === "passed" && student.registrationComplete) {
      return NextResponse.json({
        success: true,
        data: {
          ...baseResponse,
          qrCodeUrl: `/api/payment/qr/${studentId}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: baseResponse,
    });
  } catch (error) {
    console.error("Get result error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
