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
    findNewsBySlug,
    type NewsItem,
} from "./news-mysql";
