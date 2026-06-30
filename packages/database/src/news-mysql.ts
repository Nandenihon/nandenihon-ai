import { queryMySQL, type ResultSetHeader, type RowDataPacket } from "./mysql-connection";

export interface NewsItem {
    id: number;
    wpPostId: number;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    status: string;
    type: string;
    authorId: number | null;
    authorName: string | null;
    categoryId: number | null;
    categoryName: string | null;
    categorySlug: string | null;
    categories: string | null;
    featuredImageId: number | null;
    featuredImageUrl: string | null;
    sourceUrl: string | null;
    publishedAt: Date | null;
    modifiedAt: Date | null;
    syncedAt: Date;
}

interface NewsRow extends RowDataPacket {
    id: number;
    wp_post_id: number;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    status: string;
    type: string;
    author_id: number | null;
    author_name: string | null;
    category_id: number | null;
    category_name: string | null;
    category_slug: string | null;
    categories: string | null;
    featured_image_id: number | null;
    featured_image_url: string | null;
    source_url: string | null;
    published_at: Date | null;
    modified_at: Date | null;
    synced_at: Date;
}

interface ListNewsOptions {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
}

interface ListNewsResult {
    data: NewsItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

let newsReady: Promise<void> | null = null;
let newsTriggersReady = false;

function getWordPressPrefix(): string {
    const prefix = process.env.WP_TABLE_PREFIX || "wp_";
    if (!/^[A-Za-z0-9_]+$/.test(prefix)) {
        throw new Error("WP_TABLE_PREFIX may only contain letters, numbers, and underscores");
    }
    return prefix;
}

function table(prefix: string, name: string): string {
    return `\`${prefix}${name}\``;
}

function mapNews(row: NewsRow): NewsItem {
    return {
        id: row.id,
        wpPostId: row.wp_post_id,
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt,
        content: row.content,
        status: row.status,
        type: row.type,
        authorId: row.author_id,
        authorName: row.author_name,
        categoryId: row.category_id,
        categoryName: row.category_name,
        categorySlug: row.category_slug,
        categories: row.categories,
        featuredImageId: row.featured_image_id,
        featuredImageUrl: row.featured_image_url,
        sourceUrl: row.source_url,
        publishedAt: row.published_at,
        modifiedAt: row.modified_at,
        syncedAt: row.synced_at,
    };
}

async function createNewsTable(): Promise<void> {
    await queryMySQL(`
        CREATE TABLE IF NOT EXISTS news (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            wp_post_id BIGINT UNSIGNED NOT NULL,
            slug VARCHAR(255) NOT NULL,
            title TEXT NOT NULL,
            excerpt TEXT NULL,
            content LONGTEXT NOT NULL,
            status VARCHAR(20) NOT NULL,
            type VARCHAR(20) NOT NULL,
            author_id BIGINT UNSIGNED NULL,
            author_name VARCHAR(250) NULL,
            category_id BIGINT UNSIGNED NULL,
            category_name VARCHAR(200) NULL,
            category_slug VARCHAR(200) NULL,
            categories TEXT NULL,
            featured_image_id BIGINT UNSIGNED NULL,
            featured_image_url TEXT NULL,
            source_url TEXT NULL,
            published_at DATETIME NULL,
            modified_at DATETIME NULL,
            synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY news_wp_post_unique (wp_post_id),
            UNIQUE KEY news_slug_unique (slug),
            KEY news_category_slug_idx (category_slug),
            KEY news_published_at_idx (published_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

async function createSyncProcedures(prefix: string): Promise<void> {
    const posts = table(prefix, "posts");
    const users = table(prefix, "users");
    const postmeta = table(prefix, "postmeta");
    const terms = table(prefix, "terms");
    const termTaxonomy = table(prefix, "term_taxonomy");
    const termRelationships = table(prefix, "term_relationships");
    const options = table(prefix, "options");

    await queryMySQL("DROP PROCEDURE IF EXISTS sync_news_post");
    await queryMySQL(`
        CREATE PROCEDURE sync_news_post(IN source_post_id BIGINT UNSIGNED)
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM ${posts}
                WHERE ID = source_post_id
                    AND post_type = 'post'
                    AND post_status = 'publish'
            ) THEN
                INSERT INTO news (
                    wp_post_id,
                    slug,
                    title,
                    excerpt,
                    content,
                    status,
                    type,
                    author_id,
                    author_name,
                    category_id,
                    category_name,
                    category_slug,
                    categories,
                    featured_image_id,
                    featured_image_url,
                    source_url,
                    published_at,
                    modified_at
                )
                SELECT
                    p.ID,
                    p.post_name,
                    p.post_title,
                    NULLIF(p.post_excerpt, ''),
                    p.post_content,
                    p.post_status,
                    p.post_type,
                    p.post_author,
                    u.display_name,
                    (
                        SELECT t.term_id
                        FROM ${termRelationships} tr
                        INNER JOIN ${termTaxonomy} tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
                        INNER JOIN ${terms} t ON t.term_id = tt.term_id
                        WHERE tr.object_id = p.ID AND tt.taxonomy = 'category'
                        ORDER BY t.term_id ASC
                        LIMIT 1
                    ),
                    (
                        SELECT t.name
                        FROM ${termRelationships} tr
                        INNER JOIN ${termTaxonomy} tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
                        INNER JOIN ${terms} t ON t.term_id = tt.term_id
                        WHERE tr.object_id = p.ID AND tt.taxonomy = 'category'
                        ORDER BY t.term_id ASC
                        LIMIT 1
                    ),
                    (
                        SELECT t.slug
                        FROM ${termRelationships} tr
                        INNER JOIN ${termTaxonomy} tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
                        INNER JOIN ${terms} t ON t.term_id = tt.term_id
                        WHERE tr.object_id = p.ID AND tt.taxonomy = 'category'
                        ORDER BY t.term_id ASC
                        LIMIT 1
                    ),
                    (
                        SELECT GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ', ')
                        FROM ${termRelationships} tr
                        INNER JOIN ${termTaxonomy} tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
                        INNER JOIN ${terms} t ON t.term_id = tt.term_id
                        WHERE tr.object_id = p.ID AND tt.taxonomy = 'category'
                    ),
                    CAST(NULLIF(pm.meta_value, '') AS UNSIGNED),
                    attachment.guid,
                    CONCAT(
                        COALESCE((SELECT option_value FROM ${options} WHERE option_name = 'home' LIMIT 1), ''),
                        '/blog/',
                        p.post_name,
                        '/'
                    ),
                    p.post_date,
                    p.post_modified
                FROM ${posts} p
                LEFT JOIN ${users} u ON u.ID = p.post_author
                LEFT JOIN ${postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = '_thumbnail_id'
                LEFT JOIN ${posts} attachment ON attachment.ID = CAST(NULLIF(pm.meta_value, '') AS UNSIGNED)
                WHERE p.ID = source_post_id
                ON DUPLICATE KEY UPDATE
                    slug = VALUES(slug),
                    title = VALUES(title),
                    excerpt = VALUES(excerpt),
                    content = VALUES(content),
                    status = VALUES(status),
                    type = VALUES(type),
                    author_id = VALUES(author_id),
                    author_name = VALUES(author_name),
                    category_id = VALUES(category_id),
                    category_name = VALUES(category_name),
                    category_slug = VALUES(category_slug),
                    categories = VALUES(categories),
                    featured_image_id = VALUES(featured_image_id),
                    featured_image_url = VALUES(featured_image_url),
                    source_url = VALUES(source_url),
                    published_at = VALUES(published_at),
                    modified_at = VALUES(modified_at),
                    synced_at = CURRENT_TIMESTAMP;
            ELSE
                DELETE FROM news WHERE wp_post_id = source_post_id;
            END IF;
        END
    `);

    await queryMySQL("DROP PROCEDURE IF EXISTS sync_all_news");
    await queryMySQL(`
        CREATE PROCEDURE sync_all_news()
        BEGIN
            DECLARE done INT DEFAULT 0;
            DECLARE current_post_id BIGINT UNSIGNED;
            DECLARE post_cursor CURSOR FOR
                SELECT ID FROM ${posts} WHERE post_type = 'post' AND post_status = 'publish';
            DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

            DELETE n
            FROM news n
            LEFT JOIN ${posts} p ON p.ID = n.wp_post_id
            WHERE p.ID IS NULL OR p.post_type <> 'post' OR p.post_status <> 'publish';

            OPEN post_cursor;
            read_loop: LOOP
                FETCH post_cursor INTO current_post_id;
                IF done = 1 THEN
                    LEAVE read_loop;
                END IF;
                CALL sync_news_post(current_post_id);
            END LOOP;
            CLOSE post_cursor;
        END
    `);
}

function isTriggerPrivilegeError(error: unknown): boolean {
    const connectionError = error as { code?: string; errno?: number; message?: string };
    return (
        connectionError.code === "ER_BINLOG_CREATE_ROUTINE_NEED_SUPER" ||
        connectionError.errno === 1419 ||
        Boolean(connectionError.message?.includes("log_bin_trust_function_creators"))
    );
}

async function createSyncTriggers(prefix: string): Promise<boolean> {
    const posts = table(prefix, "posts");
    const postmeta = table(prefix, "postmeta");
    const terms = table(prefix, "terms");
    const termTaxonomy = table(prefix, "term_taxonomy");
    const termRelationships = table(prefix, "term_relationships");
    const users = table(prefix, "users");

    const triggers = [
        "news_wp_posts_ai",
        "news_wp_posts_au",
        "news_wp_posts_ad",
        "news_wp_postmeta_ai",
        "news_wp_postmeta_au",
        "news_wp_postmeta_ad",
        "news_wp_terms_au",
        "news_wp_term_taxonomy_au",
        "news_wp_term_relationships_ai",
        "news_wp_term_relationships_ad",
        "news_wp_users_au",
    ];

    for (const trigger of triggers) {
        await queryMySQL(`DROP TRIGGER IF EXISTS \`${trigger}\``);
    }

    try {
        await queryMySQL(`
            CREATE TRIGGER news_wp_posts_ai
            AFTER INSERT ON ${posts}
            FOR EACH ROW
            BEGIN
                IF NEW.post_type = 'post' THEN
                    CALL sync_news_post(NEW.ID);
                END IF;
            END
        `);

        await queryMySQL(`
            CREATE TRIGGER news_wp_posts_au
            AFTER UPDATE ON ${posts}
            FOR EACH ROW
            BEGIN
                IF NEW.post_type = 'post' OR OLD.post_type = 'post' THEN
                    CALL sync_news_post(NEW.ID);
                ELSEIF NEW.post_type = 'attachment' OR OLD.post_type = 'attachment' THEN
                    CALL sync_all_news();
                END IF;
            END
        `);

        await queryMySQL(`
            CREATE TRIGGER news_wp_posts_ad
            AFTER DELETE ON ${posts}
            FOR EACH ROW
            BEGIN
                IF OLD.post_type = 'post' THEN
                    DELETE FROM news WHERE wp_post_id = OLD.ID;
                ELSEIF OLD.post_type = 'attachment' THEN
                    CALL sync_all_news();
                END IF;
            END
        `);

        await queryMySQL(`
            CREATE TRIGGER news_wp_postmeta_ai
            AFTER INSERT ON ${postmeta}
            FOR EACH ROW
            BEGIN
                IF NEW.meta_key = '_thumbnail_id' THEN
                    CALL sync_news_post(NEW.post_id);
                END IF;
            END
        `);

        await queryMySQL(`
            CREATE TRIGGER news_wp_postmeta_au
            AFTER UPDATE ON ${postmeta}
            FOR EACH ROW
            BEGIN
                IF NEW.meta_key = '_thumbnail_id' OR OLD.meta_key = '_thumbnail_id' THEN
                    CALL sync_news_post(NEW.post_id);
                END IF;
            END
        `);

        await queryMySQL(`
            CREATE TRIGGER news_wp_postmeta_ad
            AFTER DELETE ON ${postmeta}
            FOR EACH ROW
            BEGIN
                IF OLD.meta_key = '_thumbnail_id' THEN
                    CALL sync_news_post(OLD.post_id);
                END IF;
            END
        `);

        await queryMySQL(`
            CREATE TRIGGER news_wp_term_relationships_ai
            AFTER INSERT ON ${termRelationships}
            FOR EACH ROW
            BEGIN
                CALL sync_news_post(NEW.object_id);
            END
        `);

        await queryMySQL(`
            CREATE TRIGGER news_wp_term_relationships_ad
            AFTER DELETE ON ${termRelationships}
            FOR EACH ROW
            BEGIN
                CALL sync_news_post(OLD.object_id);
            END
        `);

        await queryMySQL(`
            CREATE TRIGGER news_wp_terms_au
            AFTER UPDATE ON ${terms}
            FOR EACH ROW
            BEGIN
                CALL sync_all_news();
            END
        `);

        await queryMySQL(`
            CREATE TRIGGER news_wp_term_taxonomy_au
            AFTER UPDATE ON ${termTaxonomy}
            FOR EACH ROW
            BEGIN
                CALL sync_all_news();
            END
        `);

        await queryMySQL(`
            CREATE TRIGGER news_wp_users_au
            AFTER UPDATE ON ${users}
            FOR EACH ROW
            BEGIN
                CALL sync_all_news();
            END
        `);

        return true;
    } catch (error) {
        if (!isTriggerPrivilegeError(error)) {
            throw error;
        }

        console.warn(
            "News triggers were not created because the MySQL user lacks trigger/binlog privileges. Falling back to sync-on-read."
        );
        return false;
    }
}

export async function ensureNewsInfrastructure(): Promise<void> {
    if (!newsReady) {
        newsReady = (async () => {
            const prefix = getWordPressPrefix();
            await createNewsTable();
            await createSyncProcedures(prefix);
            newsTriggersReady = await createSyncTriggers(prefix);
            await queryMySQL<ResultSetHeader>("CALL sync_all_news()");
        })().catch((error) => {
            newsReady = null;
            throw error;
        });
    }

    await newsReady;
}

export async function syncNewsFromWordPress(): Promise<void> {
    await ensureNewsInfrastructure();
    await queryMySQL<ResultSetHeader>("CALL sync_all_news()");
}

export async function listNews(options: ListNewsOptions = {}): Promise<ListNewsResult> {
    if (newsTriggersReady) {
        await createNewsTable();
    } else {
        await syncNewsFromWordPress();
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const offset = (page - 1) * limit;
    const params: unknown[] = [];
    const where: string[] = [];

    if (options.search) {
        where.push("(title LIKE ? OR excerpt LIKE ? OR content LIKE ?)");
        params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
    }

    if (options.category) {
        where.push("(category_slug = ? OR category_name = ?)");
        params.push(options.category, options.category);
    }

    const whereSql = where.length > 0 ? ` WHERE ${where.join(" AND ")}` : "";
    const countRows = await queryMySQL<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM news${whereSql}`,
        params
    );
    const total = countRows[0]?.total || 0;

    const rows = await queryMySQL<NewsRow[]>(
        `SELECT * FROM news${whereSql} ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    return {
        data: rows.map(mapNews),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function findNewsBySlug(slug: string): Promise<NewsItem | null> {
    if (newsTriggersReady) {
        await createNewsTable();
    } else {
        await syncNewsFromWordPress();
    }

    const rows = await queryMySQL<NewsRow[]>(
        "SELECT * FROM news WHERE slug = ? LIMIT 1",
        [slug]
    );

    return rows[0] ? mapNews(rows[0]) : null;
}
