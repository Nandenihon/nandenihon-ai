/**
 * Class type definitions for "Kelas" (Class) section
 * Maps to the `class` table in MySQL database
 */

export interface Class {
    id: number;
    class_name: string;
    level: string;
    description: string;
    register_start: Date | string;
    register_end: Date | string;
    register_fee: number | string;
    status: string;
    image_banner: string;
}

export interface CreateClassInput {
    class_name: string;
    level: string;
    description: string;
    register_start: string; // ISO datetime string
    register_end: string;   // ISO datetime string
    register_fee: number;
    status: string;
    image_banner: string;
}

export interface UpdateClassInput {
    class_name?: string;
    level?: string;
    description?: string;
    register_start?: string;
    register_end?: string;
    register_fee?: number;
    status?: string;
    image_banner?: string;
}

export interface ClassListResponse {
    data: Class[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ClassResponse {
    data: Class;
}
