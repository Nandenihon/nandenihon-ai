/**
 * Seminar and SeminarRegistration type definitions
 * Maps to the `seminar` and `seminar_registration` tables in MySQL database
 */

// ─── Seminar ────────────────────────────────────────────────────────────────

export interface Seminar {
    id: number;
    theme: string;
    speaker: string;
    event_date: Date | string;
    event_time: string; // TIME column — e.g. "14:00:00"
    image_banner: string;
    status: string;
}

export interface CreateSeminarInput {
    theme: string;
    speaker: string;
    event_date: string; // ISO date string — "YYYY-MM-DD"
    event_time: string; // "HH:MM" or "HH:MM:SS"
    image_banner: string;
    status: string;
}

export interface UpdateSeminarInput {
    theme?: string;
    speaker?: string;
    event_date?: string;
    event_time?: string;
    image_banner?: string;
    status?: string;
}

export interface SeminarListResponse {
    data: Seminar[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface SeminarResponse {
    data: Seminar;
}

// ─── Seminar Registration ────────────────────────────────────────────────────

export interface SeminarRegistration {
    id: number;
    full_name: string;
    gender: string;
    age: number;
    domicile: string;
    whatsapp_number: number | string; // BIGINT
    source: string;
    question: string | null;
    theme: string;
}

export interface CreateSeminarRegistrationInput {
    full_name: string;
    gender: string;
    age: number;
    domicile: string;
    whatsapp_number: number;
    source: string;
    question?: string;
    theme: string;
}

export interface UpdateSeminarRegistrationInput {
    full_name?: string;
    gender?: string;
    age?: number;
    domicile?: string;
    whatsapp_number?: number;
    source?: string;
    question?: string;
    theme?: string;
}

export interface SeminarRegistrationListResponse {
    data: SeminarRegistration[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface SeminarRegistrationResponse {
    data: SeminarRegistration;
}
