import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAnswerHistory {
    questionId: Types.ObjectId;
    selectedValue: string | null;
    isCorrect: boolean;
    answeredAt: Date;
}

export interface IStudent extends Document {
    _id: Types.ObjectId;
    fullName: string;
    email: string;
    testStatus: "not_started" | "in_progress" | "completed";
    passStatus: "pending" | "passed" | "failed";
    score: number;
    answerHistory: IAnswerHistory[];
    nickname?: string;
    whatsapp?: string;
    age?: number;
    domicile?: string;
    motivation?: string;
    level?: string;
    japaneseLevel?: string;
    paymentProofUrl?: string;
    registrationComplete: boolean;
    testStartedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AnswerHistorySchema = new Schema<IAnswerHistory>(
    {
        questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
        selectedValue: { type: String, default: null },
        isCorrect: { type: Boolean, required: true },
        answeredAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const StudentSchema = new Schema<IStudent>(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        testStatus: {
            type: String,
            enum: ["not_started", "in_progress", "completed"],
            default: "not_started",
        },
        passStatus: {
            type: String,
            enum: ["pending", "passed", "failed"],
            default: "pending",
        },
        score: { type: Number, default: 0 },
        answerHistory: { type: [AnswerHistorySchema], default: [] },
        nickname: { type: String },
        whatsapp: { type: String },
        age: { type: Number },
        domicile: { type: String },
        motivation: { type: String },
        level: { type: String },
        japaneseLevel: { type: String },
        paymentProofUrl: { type: String },
        registrationComplete: { type: Boolean, default: false },
        testStartedAt: { type: Date },
    },
    { timestamps: true }
);

export const Student =
    mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);
