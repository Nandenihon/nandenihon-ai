/**
 * User type definitions
 * Maps to the `users` table in MySQL database
 */

export type UserRole = "super_admin" | "admin" | "teacher" | "student";

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    created_at?: Date | string;
    updated_at?: Date | string;
}

// Session payload stored in JWT (no password)
export interface UserSession {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

export interface CreateUserInput {
    name: string;
    email: string;
    password: string; // Will be MD5-hashed before storing
    role: UserRole;
}

export interface UpdateUserInput {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
}

export interface UserListResponse {
    data: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface UserResponse {
    data: User;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: UserSession;
    token: string;
}
