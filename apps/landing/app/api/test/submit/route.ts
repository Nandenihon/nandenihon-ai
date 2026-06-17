import { NextRequest, NextResponse } from "next/server";
import { connectDB, Student, Question } from "@repo/database";
import { testSubmitSchema } from "@repo/types";
import { Types } from "mongoose";
import { logInfo, logWarn, logError } from "@repo/utils";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validation = testSubmitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { studentId, questionId, selectedValue } = validation.data;

    if (!Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid student ID" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(questionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid question ID" },
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

    const alreadyAnswered = student.answerHistory.some(
      (a: { questionId: Types.ObjectId }) => a.questionId.toString() === questionId
    );

    if (alreadyAnswered) {
      return NextResponse.json(
        { success: false, error: "Question already answered" },
        { status: 400 }
      );
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return NextResponse.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    const isCorrect =
      selectedValue !== null && selectedValue === question.correctAnswer;

    student.answerHistory.push({
      questionId: new Types.ObjectId(questionId),
      selectedValue,
      isCorrect,
      answeredAt: new Date(),
    });

    if (student.testStatus === "not_started") {
      student.testStatus = "in_progress";
    }

    await student.save();

    // Log answer submission
    await logInfo("api/test/submit", `Answer submitted - ${isCorrect ? "CORRECT" : "INCORRECT"}`, {
      studentId,
      questionId,
      questionNumber: student.answerHistory.length,
      isCorrect,
      selectedValue: selectedValue || "(timeout/skipped)"
    });

    return NextResponse.json({
      success: true,
      data: {
        recorded: true,
        answersCount: student.answerHistory.length,
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
