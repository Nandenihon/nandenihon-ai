import { NextRequest, NextResponse } from "next/server";
import {
  addStudentAnswer,
  findQuestionById,
  findStudentById,
  isValidNumericId,
} from "@repo/database";
import { testSubmitSchema } from "@repo/types";
import { logInfo, logWarn, logError } from "@repo/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = testSubmitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { studentId, questionId, selectedValue } = validation.data;

    if (!isValidNumericId(studentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid student ID" },
        { status: 400 }
      );
    }

    if (!isValidNumericId(questionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid question ID" },
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

    const alreadyAnswered = student.answerHistory.some(
      (a) => String(a.questionId) === questionId
    );

    if (alreadyAnswered) {
      return NextResponse.json(
        { success: false, error: "Question already answered" },
        { status: 400 }
      );
    }

    const question = await findQuestionById(questionId);

    if (!question) {
      return NextResponse.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    const isCorrect =
      selectedValue !== null && selectedValue === question.correctAnswer;

    const answersCount = await addStudentAnswer({
      studentId: student.id,
      questionId: question.id,
      selectedValue,
      isCorrect,
    });

    // Log answer submission
    await logInfo("api/test/submit", `Answer submitted - ${isCorrect ? "CORRECT" : "INCORRECT"}`, {
      studentId,
      questionId,
      questionNumber: answersCount,
      isCorrect,
      selectedValue: selectedValue || "(timeout/skipped)"
    });

    return NextResponse.json({
      success: true,
      data: {
        recorded: true,
        answersCount,
      },
    });
  } catch (error: any) {
    await logError("api/test/submit", "Answer submission error", {
      error: error.message,
      stack: error.stack
    });
    console.error("Submit answer error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
