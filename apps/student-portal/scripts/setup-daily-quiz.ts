import { loadEnvConfig } from "@next/env";
import fs from "node:fs";
import path from "node:path";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

import {
    closeMySQLConnection,
    replaceDailyQuizQuestions,
    type DailyQuizQuestionSeed,
} from "@repo/database";

interface SourceDailyQuizQuestion {
    id: number;
    category: string;
    question: string;
    options: string[];
    answer_index: number;
    explanation?: string;
}

function assertValidQuestion(
    question: SourceDailyQuizQuestion,
    index: number
): asserts question is SourceDailyQuizQuestion {
    if (!Number.isInteger(question.id) || question.id < 1) {
        throw new Error(`Question at index ${index} has an invalid id`);
    }

    if (!question.category || !question.question) {
        throw new Error(`Question ${question.id} is missing category or question text`);
    }

    if (!Array.isArray(question.options) || question.options.length < 2) {
        throw new Error(`Question ${question.id} must have at least two options`);
    }

    if (
        !Number.isInteger(question.answer_index) ||
        question.answer_index < 0 ||
        question.answer_index >= question.options.length
    ) {
        throw new Error(`Question ${question.id} has an invalid answer_index`);
    }
}

async function setupDailyQuiz() {
    const dataPath = path.join(projectDir, "data", "daily-quiz.json");
    const source = JSON.parse(
        fs.readFileSync(dataPath, "utf8")
    ) as SourceDailyQuizQuestion[];

    if (!Array.isArray(source)) {
        throw new Error("Daily quiz seed file must contain an array");
    }

    const seenIds = new Set<number>();
    const questions: DailyQuizQuestionSeed[] = source.map((question, index) => {
        assertValidQuestion(question, index);

        if (seenIds.has(question.id)) {
            throw new Error(`Duplicate question id ${question.id}`);
        }
        seenIds.add(question.id);

        return {
            id: question.id,
            category: question.category,
            question: question.question,
            options: question.options,
            answerIndex: question.answer_index,
            explanation: question.explanation ?? null,
        };
    });

    const total = await replaceDailyQuizQuestions(questions);
    console.log(`Daily quiz tables are ready. Seeded ${total} questions.`);
}

setupDailyQuiz()
    .catch((error) => {
        console.error("Failed to set up daily quiz:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closeMySQLConnection();
    });
