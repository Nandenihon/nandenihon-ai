/**
 * Testimony type definitions for "Kata Mereka" section
 * Maps to the `testimony` table in MySQL database
 */

export interface Testimony {
    id: number;
    photo: string | null;
    nickname: string | null;
    email: string | null;
    age: number | null;
    testimonial_text: string | null;
}

export interface CreateTestimonyInput {
    photo?: string;
    nickname?: string;
    email?: string;
    age?: number;
    testimonial_text?: string;
}

export interface UpdateTestimonyInput {
    photo?: string;
    nickname?: string;
    email?: string;
    age?: number;
    testimonial_text?: string;
}

export interface TestimonyListResponse {
    data: Testimony[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface TestimonyResponse {
    data: Testimony;
}
