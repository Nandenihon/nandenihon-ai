export { connectDB } from "./connection";
export { Student, Question, type IStudent, type IQuestion, type IAnswerHistory } from "./models";

// MySQL exports
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
