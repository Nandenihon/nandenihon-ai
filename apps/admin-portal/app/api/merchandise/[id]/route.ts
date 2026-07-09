import { NextRequest, NextResponse } from "next/server";
import {
    deleteMerchandiseItem,
    findMerchandiseItemById,
    updateMerchandiseItem,
    type MerchandiseItem as DatabaseMerchandiseItem,
} from "@repo/database";
import { revalidateTag } from "next/cache";
import type {
    MerchandiseItem,
    MerchandiseItemResponse,
    UpdateMerchandiseItemInput,
} from "@repo/types";

interface RouteParams {
    params: Promise<{ id: string }>;
}

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

function parseId(value: string) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
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

export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id: rawId } = await params;
        const id = parseId(rawId);

        if (!id) {
            return NextResponse.json({ error: "Invalid merchandise ID" }, { status: 400 });
        }

        const item = await findMerchandiseItemById(id);

        if (!item) {
            return NextResponse.json({ error: "Merchandise item not found" }, { status: 404 });
        }

        const response: MerchandiseItemResponse = {
            data: serializeMerchandiseItem(item),
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching merchandise item:", error);
        return NextResponse.json(
            { error: "Failed to fetch merchandise item" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: rawId } = await params;
        const id = parseId(rawId);

        if (!id) {
            return NextResponse.json({ error: "Invalid merchandise ID" }, { status: 400 });
        }

        const body: UpdateMerchandiseItemInput = await request.json();
        const title = body.title === undefined ? undefined : requiredText(body.title);
        const imageUrl = body.image_url === undefined ? undefined : requiredText(body.image_url);
        const price = body.price === undefined ? undefined : parsePrice(body.price);

        if (title !== undefined && !title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        if (price === null) {
            return NextResponse.json({ error: "Price must be a valid number" }, { status: 400 });
        }

        if (imageUrl !== undefined && !imageUrl) {
            return NextResponse.json({ error: "Product image is required" }, { status: 400 });
        }

        const item = await updateMerchandiseItem(id, {
            title,
            description: body.description === undefined ? undefined : optionalText(body.description),
            price,
            imageUrl,
        });

        if (!item) {
            return NextResponse.json({ error: "Merchandise item not found" }, { status: 404 });
        }
        revalidateTag("merchandise", "max");

        return NextResponse.json({ data: serializeMerchandiseItem(item) });
    } catch (error) {
        console.error("Error updating merchandise item:", error);
        return NextResponse.json(
            { error: "Failed to update merchandise item" },
            { status: 500 }
        );
    }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id: rawId } = await params;
        const id = parseId(rawId);

        if (!id) {
            return NextResponse.json({ error: "Invalid merchandise ID" }, { status: 400 });
        }

        const deleted = await deleteMerchandiseItem(id);

        if (!deleted) {
            return NextResponse.json({ error: "Merchandise item not found" }, { status: 404 });
        }
        revalidateTag("merchandise", "max");

        return NextResponse.json({ message: "Merchandise item deleted successfully" });
    } catch (error) {
        console.error("Error deleting merchandise item:", error);
        return NextResponse.json(
            { error: "Failed to delete merchandise item" },
            { status: 500 }
        );
    }
}
