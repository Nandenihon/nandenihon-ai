import { NextRequest, NextResponse } from "next/server";
import {
    ensureStudentTestStarted,
    findRandomUnansweredQuestion,
    findStudentById,
    isValidNumericId,
    type QuizLevel,
} from "@repo/database";
import { getQuizConfig, isValidQuizLevel } from "@/lib/config/quiz";

const VALID_LEVELS = ["N5", "N4"];

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ level: string; studentId: string }> }
) {
    try {
        const { level, studentId } = await params;

        // Validate level
        if (!VALID_LEVELS.includes(level)) {
            return NextResponse.json(
                { success: false, error: "Invalid level. Supported levels: N5, N4" },
                { status: 400 }
            );
        }

        // Validate studentId format
        if (!isValidNumericId(studentId)) {
            return NextResponse.json(
                { success: false, error: "Invalid student ID" },
                { status: 400 }
            );
        }

        // Get level-specific quiz configuration
        if (!isValidQuizLevel(level)) {
            return NextResponse.json(
                { success: false, error: "Invalid level" },
                { status: 400 }
            );
        }
        const config = getQuizConfig(level);

        const student = await findStudentById(studentId);

        if (!student) {
            return NextResponse.json(
                { success: false, error: "Student not found" },
                { status: 404 }
            );
        }

        // Check if test is already complete
        if (student.answerHistory.length >= config.totalQuestions) {
            return NextResponse.json({
                success: true,
                data: {
                    question: null,
                    nextStep: "finish_calculation",
                },
            });
        }

        // Get answered question IDs
        const answeredQuestionIds = student.answerHistory.map(
            (a) => a.questionId
        );

        // Get a random unanswered question for the specified level
        const question = await findRandomUnansweredQuestion(level as QuizLevel, answeredQuestionIds);

        if (!question) {
            return NextResponse.json({
                success: true,
                data: {
                    question: null,
                    nextStep: "finish_calculation",
                },
            });
        }

        // Ensure testStartedAt is set to prevent timer reset
        const testStartedAt = await ensureStudentTestStarted(student.id);

        // Calculate time remaining using config
        const startTime = new Date(testStartedAt).getTime();
        const currentTime = Date.now();
        const secondsElapsed = Math.floor((currentTime - startTime) / 1000);
        const timeLeft = Math.max(0, config.quizTimerSeconds - secondsElapsed);

        return NextResponse.json({
            success: true,
            data: {
                question: {
                    id: String(question.id),
                    text: question.text,
                    options: question.options,
                    timeLimit: question.timeLimit,
                    category: question.category,
                },
                progress: {
                    current: student.answerHistory.length + 1,
                    total: config.totalQuestions,
                },
                timeLeft: timeLeft,
                nextStep: "question_display",
            },
        });
    } catch (error) {
        console.error("Get question error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
