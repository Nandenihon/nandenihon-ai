import { queryMySQL, type ResultSetHeader, type RowDataPacket } from "./mysql-connection";

export interface GalleryItem {
    id: number;
    title: string;
    description: string | null;
    imageUrl: string;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export interface GalleryItemRow extends RowDataPacket {
    id: number;
    title: string;
    description: string | null;
    image_url: string;
    created_at: Date | null;
    updated_at: Date | null;
}

export interface CreateGalleryItemInput {
    title: string;
    description?: string | null;
    imageUrl: string;
}

export interface UpdateGalleryItemInput {
    title?: string;
    description?: string | null;
    imageUrl?: string;
}

interface ListGalleryOptions {
    page?: number;
    limit?: number;
}

interface ListGalleryResult {
    data: GalleryItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

let galleryReady: Promise<void> | null = null;

function mapGalleryItem(row: GalleryItemRow): GalleryItem {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        imageUrl: row.image_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function normalizePage(value: number | undefined) {
    return Number.isInteger(value) && value && value > 0 ? value : 1;
}

function normalizeLimit(value: number | undefined) {
    if (!Number.isInteger(value) || !value || value < 1) {
        return 12;
    }

    return Math.min(value, 120);
}

export async function ensureGalleryTable(): Promise<void> {
    if (!galleryReady) {
        galleryReady = queryMySQL(`
            CREATE TABLE IF NOT EXISTS gallery (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                title VARCHAR(150) NOT NULL,
                description TEXT NULL,
                image_url VARCHAR(500) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                INDEX idx_gallery_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `).then(() => undefined);
    }

    return galleryReady;
}

export async function listGalleryItems(options: ListGalleryOptions = {}): Promise<ListGalleryResult> {
    await ensureGalleryTable();

    const page = normalizePage(options.page);
    const limit = normalizeLimit(options.limit);
    const offset = (page - 1) * limit;
    const countResult = await queryMySQL<RowDataPacket[]>(
        "SELECT COUNT(*) as total FROM gallery"
    );
    const total = Number(countResult[0]?.total || 0);
    const rows = await queryMySQL<GalleryItemRow[]>(
        `SELECT id, title, description, image_url, created_at, updated_at
         FROM gallery
         ORDER BY created_at DESC, id DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );

    return {
        data: rows.map(mapGalleryItem),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
}

export async function findGalleryItemById(id: number): Promise<GalleryItem | null> {
    await ensureGalleryTable();

    const rows = await queryMySQL<GalleryItemRow[]>(
        `SELECT id, title, description, image_url, created_at, updated_at
         FROM gallery
         WHERE id = ?
         LIMIT 1`,
        [id]
    );

    return rows[0] ? mapGalleryItem(rows[0]) : null;
}

export async function createGalleryItem(input: CreateGalleryItemInput): Promise<GalleryItem> {
    await ensureGalleryTable();

    const result = await queryMySQL<ResultSetHeader>(
        `INSERT INTO gallery (title, description, image_url)
         VALUES (?, ?, ?)`,
        [input.title, input.description || null, input.imageUrl]
    );
    const created = await findGalleryItemById(result.insertId);

    if (!created) {
        throw new Error("Failed to load created gallery item");
    }

    return created;
}

export async function updateGalleryItem(id: number, input: UpdateGalleryItemInput): Promise<GalleryItem | null> {
    await ensureGalleryTable();

    const updateFields: string[] = [];
    const updateValues: (string | null | number)[] = [];

    if (input.title !== undefined) {
        updateFields.push("title = ?");
        updateValues.push(input.title);
    }

    if (input.description !== undefined) {
        updateFields.push("description = ?");
        updateValues.push(input.description || null);
    }

    if (input.imageUrl !== undefined) {
        updateFields.push("image_url = ?");
        updateValues.push(input.imageUrl);
    }

    if (updateFields.length > 0) {
        updateValues.push(id);
        await queryMySQL<ResultSetHeader>(
            `UPDATE gallery SET ${updateFields.join(", ")} WHERE id = ?`,
            updateValues
        );
    }

    return findGalleryItemById(id);
}

export async function deleteGalleryItem(id: number): Promise<boolean> {
    await ensureGalleryTable();

    const result = await queryMySQL<ResultSetHeader>(
        "DELETE FROM gallery WHERE id = ?",
        [id]
    );

    return result.affectedRows > 0;
}
