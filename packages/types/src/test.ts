import { z } from "zod";

export const testSubmitSchema = z.object({
    studentId: z.string().min(1, "Student ID is required"),
    questionId: z.string().min(1, "Question ID is required"),
    selectedValue: z.string().nullable(),
});

export const testFinishSchema = z.object({
    studentId: z.string().min(1, "Student ID is required"),
});

export type TestSubmitInput = z.infer<typeof testSubmitSchema>;
export type TestFinishInput = z.infer<typeof testFinishSchema>;
