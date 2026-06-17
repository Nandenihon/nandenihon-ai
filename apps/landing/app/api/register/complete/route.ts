import { NextRequest, NextResponse } from "next/server";
import { connectDB, Student } from "@repo/database";
import { registerCompleteSchema } from "@repo/types";
import { Types } from "mongoose";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

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

    if (!Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid student ID" },
        { status: 400 }
      );
    }

    const student = await Student.findById(studentId);

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

    student.nickname = nickname;
    student.whatsapp = whatsapp;
    student.age = age;
    student.domicile = domicile;
    student.motivation = motivation;
    student.level = level;
    student.registrationComplete = true;
    await student.save();

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
