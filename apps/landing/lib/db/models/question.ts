import mongoose, { Schema, Document, Types } from "mongoose";

export interface IQuestion extends Document {
  _id: Types.ObjectId;
  text: string;
  options: string[];
  correctAnswer: string;
  timeLimit: number;
  category?: string;
  level: "N5" | "N4";
}

const QuestionSchema = new Schema<IQuestion>(
  {
    text: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: String, required: true },
    timeLimit: { type: Number, required: true, default: 30 },
    category: { type: String },
    level: { type: String, required: true, enum: ["N5", "N4"], index: true },
  },
  { timestamps: true }
);

export const Question =
  mongoose.models.Question ||
  mongoose.model<IQuestion>("Question", QuestionSchema);

