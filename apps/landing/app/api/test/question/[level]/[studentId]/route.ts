import { NextRequest, NextResponse } from "next/server";
import { connectDB, Student, Question } from "@repo/database";
import { Types } from "mongoose";
import { getQuizConfig, isValidQuizLevel } from "@/lib/config/quiz";

const VALID_LEVELS = ["N5", "N4"];

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ level: string; studentId: string }> }
) {
    try {
        await connectDB();

        const { level, studentId } = await params;

        // Validate level
        if (!VALID_LEVELS.includes(level)) {
            return NextResponse.json(
                { success: false, error: "Invalid level. Supported levels: N5, N4" },
                { status: 400 }
            );
        }

        // Validate studentId format
        if (!Types.ObjectId.isValid(studentId)) {
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

        const student = await Student.findById(studentId);

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
            (a: { questionId: Types.ObjectId }) => a.questionId
        );

        // Get a random unanswered question for the specified level
        const questions = await Question.aggregate([
            {
                $match: {
                    _id: { $nin: answeredQuestionIds },
                    level: level
                }
            },
            { $sample: { size: 1 } },
        ]);

        if (questions.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    question: null,
                    nextStep: "finish_calculation",
                },
            });
        }

        const question = questions[0];

        // Ensure testStartedAt is set to prevent timer reset
        let testStartedAt = student.testStartedAt;
        if (!testStartedAt) {
            testStartedAt = new Date();
            student.testStartedAt = testStartedAt;
            await student.save();
        }

        // Calculate time remaining using config
        const startTime = new Date(testStartedAt).getTime();
        const currentTime = Date.now();
        const secondsElapsed = Math.floor((currentTime - startTime) / 1000);
        const timeLeft = Math.max(0, config.quizTimerSeconds - secondsElapsed);

        return NextResponse.json({
            success: true,
            data: {
                question: {
                    id: question._id.toString(),
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
