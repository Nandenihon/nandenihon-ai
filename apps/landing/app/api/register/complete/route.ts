import { NextRequest, NextResponse } from "next/server";
import {
  completeStudentRegistration,
  findStudentById,
  isValidNumericId,
} from "@repo/database";
import { registerCompleteSchema } from "@repo/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerCompleteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { studentId, nickname, whatsapp, age, domicile, motivation, level } =
      validation.data;

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

    if (student.passStatus !== "passed") {
      return NextResponse.json(
        {
          success: false,
          error: "Only passed students can complete registration",
        },
        { status: 403 }
      );
    }

    await completeStudentRegistration({
      id: student.id,
      nickname,
      whatsapp,
      age,
      domicile,
      motivation,
      level,
    });

    return NextResponse.json({
      success: true,
      data: {
        nextStep: "payment_page",
      },
    });
  } catch (error) {
    console.error("Complete registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
