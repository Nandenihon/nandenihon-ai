export interface MerchandiseItem {
    id: number;
    title: string;
    description: string | null;
    price: number;
    image_url: string;
    created_at?: string | Date | null;
    updated_at?: string | Date | null;
}

export interface CreateMerchandiseItemInput {
    title?: string;
    description?: string;
    price?: number;
    image_url?: string;
}

export interface UpdateMerchandiseItemInput {
    title?: string;
    description?: string;
    price?: number;
    image_url?: string;
}

export interface MerchandiseListResponse {
    data: MerchandiseItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface MerchandiseItemResponse {
    data: MerchandiseItem;
}
