import { queryMySQL, type ResultSetHeader, type RowDataPacket } from "./mysql-connection";

export interface MerchandiseItem {
    id: number;
    title: string;
    description: string | null;
    price: number;
    imageUrl: string;
    createdAt: Date | null;
    updatedAt: Date | null;
}

interface MerchandiseItemRow extends RowDataPacket {
    id: number;
    title: string;
    description: string | null;
    price: number | string;
    image_url: string;
    created_at: Date | null;
    updated_at: Date | null;
}

export interface CreateMerchandiseItemInput {
    title: string;
    description?: string | null;
    price: number;
    imageUrl: string;
}

export interface UpdateMerchandiseItemInput {
    title?: string;
    description?: string | null;
    price?: number;
    imageUrl?: string;
}

interface ListMerchandiseOptions {
    page?: number;
    limit?: number;
}

interface ListMerchandiseResult {
    data: MerchandiseItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

let merchandiseReady: Promise<void> | null = null;

function mapMerchandiseItem(row: MerchandiseItemRow): MerchandiseItem {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        price: Number(row.price) || 0,
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

export async function ensureMerchandiseTable(): Promise<void> {
    if (!merchandiseReady) {
        merchandiseReady = queryMySQL(`
            CREATE TABLE IF NOT EXISTS merchandise (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                title VARCHAR(160) NOT NULL,
                description TEXT NULL,
                price DECIMAL(12, 2) NOT NULL DEFAULT 0,
                image_url VARCHAR(500) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                INDEX idx_merchandise_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `).then(() => undefined);
    }

    return merchandiseReady;
}

export async function listMerchandiseItems(options: ListMerchandiseOptions = {}): Promise<ListMerchandiseResult> {
    await ensureMerchandiseTable();

    const page = normalizePage(options.page);
    const limit = normalizeLimit(options.limit);
    const offset = (page - 1) * limit;
    const countResult = await queryMySQL<RowDataPacket[]>(
        "SELECT COUNT(*) as total FROM merchandise"
    );
    const total = Number(countResult[0]?.total || 0);
    const rows = await queryMySQL<MerchandiseItemRow[]>(
        `SELECT id, title, description, price, image_url, created_at, updated_at
         FROM merchandise
         ORDER BY created_at DESC, id DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );

    return {
        data: rows.map(mapMerchandiseItem),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
}

export async function findMerchandiseItemById(id: number): Promise<MerchandiseItem | null> {
    await ensureMerchandiseTable();

    const rows = await queryMySQL<MerchandiseItemRow[]>(
        `SELECT id, title, description, price, image_url, created_at, updated_at
         FROM merchandise
         WHERE id = ?
         LIMIT 1`,
        [id]
    );

    return rows[0] ? mapMerchandiseItem(rows[0]) : null;
}

export async function createMerchandiseItem(input: CreateMerchandiseItemInput): Promise<MerchandiseItem> {
    await ensureMerchandiseTable();

    const result = await queryMySQL<ResultSetHeader>(
        `INSERT INTO merchandise (title, description, price, image_url)
         VALUES (?, ?, ?, ?)`,
        [input.title, input.description || null, input.price, input.imageUrl]
    );
    const created = await findMerchandiseItemById(result.insertId);

    if (!created) {
        throw new Error("Failed to load created merchandise item");
    }

    return created;
}

export async function updateMerchandiseItem(id: number, input: UpdateMerchandiseItemInput): Promise<MerchandiseItem | null> {
    await ensureMerchandiseTable();

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

    if (input.price !== undefined) {
        updateFields.push("price = ?");
        updateValues.push(input.price);
    }

    if (input.imageUrl !== undefined) {
        updateFields.push("image_url = ?");
        updateValues.push(input.imageUrl);
    }

    if (updateFields.length > 0) {
        updateValues.push(id);
        await queryMySQL<ResultSetHeader>(
            `UPDATE merchandise SET ${updateFields.join(", ")} WHERE id = ?`,
            updateValues
        );
    }

    return findMerchandiseItemById(id);
}

export async function deleteMerchandiseItem(id: number): Promise<boolean> {
    await ensureMerchandiseTable();

    const result = await queryMySQL<ResultSetHeader>(
        "DELETE FROM merchandise WHERE id = ?",
        [id]
    );

    return result.affectedRows > 0;
}
