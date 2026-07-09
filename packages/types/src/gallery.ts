export interface GalleryItem {
    id: number;
    title: string;
    description: string | null;
    image_url: string;
    created_at?: string | Date | null;
    updated_at?: string | Date | null;
}

export interface CreateGalleryItemInput {
    title?: string;
    description?: string;
    image_url?: string;
}

export interface UpdateGalleryItemInput {
    title?: string;
    description?: string;
    image_url?: string;
}

export interface GalleryListResponse {
    data: GalleryItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface GalleryItemResponse {
    data: GalleryItem;
}
