export {
    connectMySQL,
    queryMySQL,
    getConnection,
    closeMySQLConnection,
    type Pool,
    type PoolConnection,
    type RowDataPacket,
    type ResultSetHeader,
} from "./mysql-connection";

export {
    ensureQuizTables,
    isValidNumericId,
    findStudentById,
    findStudentByEmail,
    createStudent,
    resetStudentForRetry,
    completeStudentRegistration,
    updateStudentPaymentProof,
    ensureStudentTestStarted,
    findQuestionById,
    findRandomUnansweredQuestion,
    addStudentAnswer,
    finishStudentTest,
    replaceQuestions,
    type QuizStudent,
    type QuizQuestion,
    type QuizAnswer,
    type QuizLevel,
} from "./quiz-mysql";

export {
    ensureNewsInfrastructure,
    syncNewsFromWordPress,
    listNews,
    listNewsSummary,
    findNewsBySlug,
    type NewsItem,
    type NewsItemSummary,
} from "./news-mysql";

export {
    createCounselingRegistration,
    listCounselingRegistrations,
    VALID_EDUCATION_LEVELS,
    VALID_TOPICS,
    type CounselingRegistration,
    type CreateCounselingInput,
    type ListCounselingOptions,
    type ListCounselingResult,
    type EducationLevel,
    type CounselingTopic,
} from "./counseling-mysql";
