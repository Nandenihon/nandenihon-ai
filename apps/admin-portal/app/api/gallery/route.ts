import { NextRequest, NextResponse } from "next/server";
import {
    createGalleryItem,
    listGalleryItems,
    type GalleryItem as DatabaseGalleryItem,
} from "@repo/database";
import type {
    CreateGalleryItemInput,
    GalleryItem,
    GalleryListResponse,
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

function serializeGalleryItem(item: DatabaseGalleryItem): GalleryItem {
    return {
        id: item.id,
        title: item.title,
        description: item.description,
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
        const result = await listGalleryItems({ page, limit });
        const response: GalleryListResponse = {
            data: result.data.map(serializeGalleryItem),
            pagination: result.pagination,
        };

        return NextResponse.json(response);
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        console.error("Error fetching gallery:", error);
        return NextResponse.json(
            { error: "Failed to fetch gallery", details },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: CreateGalleryItemInput = await request.json();
        const title = requiredText(body.title);
        const imageUrl = requiredText(body.image_url);

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        if (!imageUrl) {
            return NextResponse.json({ error: "Photo is required" }, { status: 400 });
        }

        const item = await createGalleryItem({
            title,
            description: optionalText(body.description),
            imageUrl,
        });

        return NextResponse.json(
            { data: serializeGalleryItem(item) },
            { status: 201 }
        );
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        console.error("Error creating gallery item:", error);
        return NextResponse.json(
            { error: "Failed to create gallery item", details },
            { status: 500 }
        );
    }
}
