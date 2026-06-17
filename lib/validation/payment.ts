import { z } from "zod";

export const paymentUploadSchema = z.object({
    studentId: z.string().min(1, "Student ID is required"),
});

export type PaymentUploadInput = z.infer<typeof paymentUploadSchema>;
