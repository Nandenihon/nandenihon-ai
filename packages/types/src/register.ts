import { z } from "zod";

export const registerStartSchema = z.object({
    fullName: z.string().min(1, "Full name is required").max(100),
    email: z.string().email("Invalid email format").toLowerCase(),
    level: z.enum(["N5", "N4"], { message: "Level must be N5 or N4" }),
    japaneseLevel: z.string().min(1, "Japanese level is required"),
});

export const registerCompleteSchema = z.object({
    studentId: z.string().min(1, "Student ID is required"),
    nickname: z.string().min(1, "Nickname is required").max(50),
    whatsapp: z.string().min(10, "WhatsApp number is required").max(20),
    age: z.number().int().min(5).max(100),
    domicile: z.string().min(1, "Domicile is required").max(100),
    motivation: z.string().min(1, "Motivation is required").max(500),
    level: z.string().min(1, "Level is required").max(50),
});

export type RegisterStartInput = z.infer<typeof registerStartSchema>;
export type RegisterCompleteInput = z.infer<typeof registerCompleteSchema>;
