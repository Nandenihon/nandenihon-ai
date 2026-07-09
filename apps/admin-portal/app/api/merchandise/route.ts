import { NextRequest, NextResponse } from "next/server";
import {
    createMerchandiseItem,
    listMerchandiseItems,
    type MerchandiseItem as DatabaseMerchandiseItem,
} from "@repo/database";
import { revalidateTag } from "next/cache";
import type {
    CreateMerchandiseItemInput,
    MerchandiseItem,
    MerchandiseListResponse,
} from "@repo/types";

const DEFAULT_PAGE_SIZE = 10;

function optionalText(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    return trimmed || null;
}

function requiredText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function parsePrice(value: unknown): number | null {
    const price = Number(value);
    return Number.isFinite(price) && price >= 0 ? price : null;
}

function serializeMerchandiseItem(item: DatabaseMerchandiseItem): MerchandiseItem {
    return {
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        image_url: item.imageUrl,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
    };
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);
        const result = await listMerchandiseItems({ page, limit });
        const response: MerchandiseListResponse = {
            data: result.data.map(serializeMerchandiseItem),
            pagination: result.pagination,
        };

        return NextResponse.json(response);
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        console.error("Error fetching merchandise:", error);
        return NextResponse.json(
            { error: "Failed to fetch merchandise", details },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: CreateMerchandiseItemInput = await request.json();
        const title = requiredText(body.title);
        const imageUrl = requiredText(body.image_url);
        const price = parsePrice(body.price);

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        if (price === null) {
            return NextResponse.json({ error: "Price must be a valid number" }, { status: 400 });
        }

        if (!imageUrl) {
            return NextResponse.json({ error: "Product image is required" }, { status: 400 });
        }

        const item = await createMerchandiseItem({
            title,
            description: optionalText(body.description),
            price,
            imageUrl,
        });
        revalidateTag("merchandise", "max");

        return NextResponse.json(
            { data: serializeMerchandiseItem(item) },
            { status: 201 }
        );
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        console.error("Error creating merchandise item:", error);
        return NextResponse.json(
            { error: "Failed to create merchandise item", details },
            { status: 500 }
        );
    }
}
