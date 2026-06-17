/**
 * Quiz Configuration Module
 * 
 * Provides level-specific quiz settings with environment variable overrides.
 * Environment variables:
 *   - QUIZ_N5_TOTAL_QUESTIONS: Number of questions for N5 (default: 25)
 *   - QUIZ_N5_PASS_THRESHOLD: Pass percentage for N5 (default: 75)
 *   - QUIZ_N5_TIMER_MINUTES: Quiz timer in minutes for N5 (default: 30)
 *   - QUIZ_N4_TOTAL_QUESTIONS: Number of questions for N4 (default: 25)
 *   - QUIZ_N4_PASS_THRESHOLD: Pass percentage for N4 (default: 75)
 *   - QUIZ_N4_TIMER_MINUTES: Quiz timer in minutes for N4 (default: 30)
 */

export type QuizLevel = "N5" | "N4";

export interface QuizConfig {
    totalQuestions: number;
    passThreshold: number;
    quizTimerSeconds: number;
}

// Default configuration values
const DEFAULT_CONFIG: Record<QuizLevel, QuizConfig> = {
    N5: {
        totalQuestions: 25,
        passThreshold: 75,
        quizTimerSeconds: 30 * 60, // 30 minutes
    },
    N4: {
        totalQuestions: 25,
        passThreshold: 75,
        quizTimerSeconds: 30 * 60, // 30 minutes
    },
};

/**
 * Parse an integer from environment variable with fallback to default
 */
function parseEnvInt(envVar: string | undefined, defaultValue: number): number {
    if (!envVar) return defaultValue;
    const parsed = parseInt(envVar, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get quiz configuration for a specific level.
 * Reads from environment variables with fallback to defaults.
 * 
 * @param level - The JLPT level ("N5" or "N4")
 * @returns QuizConfig object with totalQuestions, passThreshold, and quizTimerSeconds
 */
export function getQuizConfig(level: QuizLevel): QuizConfig {
    const defaults = DEFAULT_CONFIG[level];

    const totalQuestions = parseEnvInt(
        process.env[`QUIZ_${level}_TOTAL_QUESTIONS`],
        defaults.totalQuestions
    );

    const passThreshold = parseEnvInt(
        process.env[`QUIZ_${level}_PASS_THRESHOLD`],
        defaults.passThreshold
    );

    // Timer is configured in minutes in .env but returned as seconds
    const timerMinutes = parseEnvInt(
        process.env[`QUIZ_${level}_TIMER_MINUTES`],
        defaults.quizTimerSeconds / 60
    );

    return {
        totalQuestions,
        passThreshold,
        quizTimerSeconds: timerMinutes * 60,
    };
}

/**
 * Validate that a level string is a valid QuizLevel
 */
export function isValidQuizLevel(level: string): level is QuizLevel {
    return level === "N5" || level === "N4";
}
