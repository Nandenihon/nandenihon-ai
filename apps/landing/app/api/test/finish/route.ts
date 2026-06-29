import { NextRequest, NextResponse } from "next/server";
import { findStudentById, finishStudentTest, isValidNumericId } from "@repo/database";
import { testFinishSchema } from "@repo/types";
import { getQuizConfig, isValidQuizLevel } from "@/lib/config/quiz";
import { logInfo, logWarn, logError } from "@repo/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = testFinishSchema.safeParse(body);

    if (!validation.success) {
      await logWarn("api/test/finish", "Validation failed", { error: validation.error.issues[0].message });
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { studentId } = validation.data;

    if (!isValidNumericId(studentId)) {
      await logWarn("api/test/finish", "Invalid student ID", { studentId });
      return NextResponse.json(
        { success: false, error: "Invalid student ID" },
        { status: 400 }
      );
    }

    const student = await findStudentById(studentId);

    if (!student) {
      await logWarn("api/test/finish", "Student not found", { studentId });
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Get level-specific quiz configuration
    const level = student.level;
    if (!level) {
      await logWarn("api/test/finish", "Missing student level", { studentId });
      return NextResponse.json(
        { success: false, error: "Invalid student level" },
        { status: 400 }
      );
    }

    if (!isValidQuizLevel(level)) {
      await logWarn("api/test/finish", "Invalid student level", { studentId, level });
      return NextResponse.json(
        { success: false, error: "Invalid student level" },
        { status: 400 }
      );
    }
    const config = getQuizConfig(level);

    if (student.answerHistory.length < config.totalQuestions) {
      await logWarn("api/test/finish", "Test incomplete", {
        studentId,
        answered: student.answerHistory.length,
        required: config.totalQuestions
      });
      return NextResponse.json(
        {
          success: false,
          error: `Test incomplete. Answered ${student.answerHistory.length}/${config.totalQuestions} questions.`,
        },
        { status: 400 }
      );
    }

    const correctAnswers = student.answerHistory.filter(
      (a: { isCorrect: boolean }) => a.isCorrect
    ).length;

    const score = Math.round((correctAnswers / config.totalQuestions) * 100);

    const passStatus = score >= config.passThreshold ? "passed" : "failed";

    await finishStudentTest({
      studentId: student.id,
      score,
      passStatus,
    });

    // Log quiz completion with result
    await logInfo("api/test/finish", `Quiz completed - ${passStatus.toUpperCase()}`, {
      studentId,
      email: student.email,
      level,
      score,
      correctAnswers,
      totalQuestions: config.totalQuestions,
      passThreshold: config.passThreshold,
      passStatus
    });

    return NextResponse.json({
      success: true,
      data: {
        score,
        passStatus,
        correctAnswers,
        totalQuestions: config.totalQuestions,
        nextStep:
          passStatus === "passed" ? "registration_form" : "result_page_fail",
      },
    });
  } catch (error: any) {
    await logError("api/test/finish", "Quiz finish error", {
      error: error.message,
      stack: error.stack
    });
    console.error("Finish test error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
