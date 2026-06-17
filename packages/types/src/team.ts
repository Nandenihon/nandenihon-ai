/**
 * Team type definitions for "Temui Tim Kami" section
 * Maps to the `team` table in MySQL database
 */

export interface Team {
    id: number;
    photo: string | null;
    full_name: string | null;
    nickname: string | null;
    place_of_birth: string | null;
    birth_date: Date | string | null;
    email: string | null;
    phone_number: number | null;
    team_group: string | null;
    division: string | null;
    jlpt_level: string | null;
    domicile: string | null;
    instagram: string | null;
    motto: string | null;
    fun_fact: string | null;
    favorites: string | null;
    join_date: Date | string | null;
    last_date: Date | string | null;
}

export interface CreateTeamInput {
    photo?: string;
    full_name?: string;
    nickname?: string;
    place_of_birth?: string;
    birth_date?: string; // ISO date string
    email?: string;
    phone_number?: number;
    team_group?: string;
    division?: string;
    jlpt_level?: string;
    domicile?: string;
    instagram?: string;
    motto?: string;
    fun_fact?: string;
    favorites?: string;
    join_date?: string; // ISO date string
    last_date?: string; // ISO date string
}

export interface UpdateTeamInput {
    photo?: string;
    full_name?: string;
    nickname?: string;
    place_of_birth?: string;
    birth_date?: string;
    email?: string;
    phone_number?: number;
    team_group?: string;
    division?: string;
    jlpt_level?: string;
    domicile?: string;
    instagram?: string;
    motto?: string;
    fun_fact?: string;
    favorites?: string;
    join_date?: string;
    last_date?: string;
}

export interface TeamListResponse {
    data: Team[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface TeamResponse {
    data: Team;
}
