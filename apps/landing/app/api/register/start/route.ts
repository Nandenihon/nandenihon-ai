import { NextRequest, NextResponse } from "next/server";
import { createStudent, findStudentByEmail, resetStudentForRetry } from "@repo/database";
import { registerStartSchema } from "@repo/types";
import { logInfo, logWarn, logError } from "@repo/utils";

export async function POST(request: NextRequest) {
  try {
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

    const existingStudent = await findStudentByEmail(email);

    if (existingStudent) {
      if (existingStudent.passStatus === "passed") {
        await logWarn("api/register/start", "Passed student blocked", {
          email,
          studentId: String(existingStudent.id)
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
        studentId: String(existingStudent.id),
        previousStatus: existingStudent.passStatus,
        level
      });

      await resetStudentForRetry({
        id: existingStudent.id,
        level,
        japaneseLevel,
        testStartedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        data: {
          studentId: String(existingStudent.id),
          nextStep: "test_intro",
        },
      });
    }

    const newStudent = await createStudent({
      fullName,
      email,
      level,
      japaneseLevel,
      testStartedAt: new Date(),
    });

    await logInfo("api/register/start", "New student registered", {
      email,
      studentId: String(newStudent.id),
      fullName,
      level
    });

    return NextResponse.json({
      success: true,
      data: {
        studentId: String(newStudent.id),
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
