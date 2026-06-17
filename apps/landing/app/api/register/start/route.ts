import { NextRequest, NextResponse } from "next/server";
import { connectDB, Student } from "@repo/database";
import { registerStartSchema } from "@repo/types";
import { logInfo, logWarn, logError } from "@repo/utils";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validation = registerStartSchema.safeParse(body);

    if (!validation.success) {
      await logWarn("api/register/start", "Validation failed", { error: validation.error.issues[0].message });
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { fullName, email, level, japaneseLevel } = validation.data;

    await logInfo("api/register/start", "Registration attempt", { email, level, japaneseLevel });

    const existingStudent = await Student.findOne({ email });

    if (existingStudent) {
      if (existingStudent.passStatus === "passed") {
        await logWarn("api/register/start", "Passed student blocked", {
          email,
          studentId: existingStudent._id.toString()
        });
        return NextResponse.json(
          {
            success: false,
            error: "Email ini sudah lulus kuis. Silakan gunakan email lain jika ingin mengambil kuis kembali."
          },
          { status: 400 }
        );
      }

      await logInfo("api/register/start", "Returning student - quiz retry", {
        email,
        studentId: existingStudent._id.toString(),
        previousStatus: existingStudent.passStatus,
        level
      });

      existingStudent.testStatus = "not_started";
      existingStudent.passStatus = "pending";
      existingStudent.score = 0;
      existingStudent.answerHistory = [];
      existingStudent.level = level;
      existingStudent.japaneseLevel = japaneseLevel;
      existingStudent.testStartedAt = new Date();
      await existingStudent.save();

      return NextResponse.json({
        success: true,
        data: {
          studentId: existingStudent._id.toString(),
          nextStep: "test_intro",
        },
      });
    }

    const newStudent = await Student.create({
      fullName,
      email,
      level,
      japaneseLevel,
      testStatus: "not_started",
      passStatus: "pending",
      score: 0,
      answerHistory: [],
      registrationComplete: false,
      testStartedAt: new Date(),
    });

    await logInfo("api/register/start", "New student registered", {
      email,
      studentId: newStudent._id.toString(),
      fullName,
      level
    });

    return NextResponse.json({
      success: true,
      data: {
        studentId: newStudent._id.toString(),
        nextStep: "test_intro",
      },
    });
  } catch (error: any) {
    await logError("api/register/start", "Registration error", {
      error: error.message,
      stack: error.stack
    });
    console.error("Register start error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
