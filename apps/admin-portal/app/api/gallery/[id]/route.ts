import { NextRequest, NextResponse } from "next/server";
import {
    deleteGalleryItem,
    findGalleryItemById,
    updateGalleryItem,
    type GalleryItem as DatabaseGalleryItem,
} from "@repo/database";
import type {
    GalleryItem,
    GalleryItemResponse,
    UpdateGalleryItemInput,
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

export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id: rawId } = await params;
        const id = parseId(rawId);

        if (!id) {
            return NextResponse.json({ error: "Invalid gallery ID" }, { status: 400 });
        }

        const item = await findGalleryItemById(id);

        if (!item) {
            return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
        }

        const response: GalleryItemResponse = {
            data: serializeGalleryItem(item),
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching gallery item:", error);
        return NextResponse.json(
            { error: "Failed to fetch gallery item" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: rawId } = await params;
        const id = parseId(rawId);

        if (!id) {
            return NextResponse.json({ error: "Invalid gallery ID" }, { status: 400 });
        }

        const body: UpdateGalleryItemInput = await request.json();
        const title = body.title === undefined ? undefined : requiredText(body.title);
        const imageUrl = body.image_url === undefined ? undefined : requiredText(body.image_url);

        if (title !== undefined && !title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        if (imageUrl !== undefined && !imageUrl) {
            return NextResponse.json({ error: "Photo is required" }, { status: 400 });
        }

        const item = await updateGalleryItem(id, {
            title,
            description: body.description === undefined ? undefined : optionalText(body.description),
            imageUrl,
        });

        if (!item) {
            return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
        }

        return NextResponse.json({ data: serializeGalleryItem(item) });
    } catch (error) {
        console.error("Error updating gallery item:", error);
        return NextResponse.json(
            { error: "Failed to update gallery item" },
            { status: 500 }
        );
    }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id: rawId } = await params;
        const id = parseId(rawId);

        if (!id) {
            return NextResponse.json({ error: "Invalid gallery ID" }, { status: 400 });
        }

        const deleted = await deleteGalleryItem(id);

        if (!deleted) {
            return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Gallery item deleted successfully" });
    } catch (error) {
        console.error("Error deleting gallery item:", error);
        return NextResponse.json(
            { error: "Failed to delete gallery item" },
            { status: 500 }
        );
    }
}
