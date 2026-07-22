import { NextRequest, NextResponse } from "next/server";
import { queryMySQL } from "@repo/database";
import { getContentTypeFromFilename, uploadFileToR2 } from "@repo/utils/r2-upload";
import { ensureProfileTable, getProfileSession } from "@/app/lib/student-profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
    try {
        const session = await getProfileSession(request);
        if (!session || session.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get("file");
        if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Pilih file foto terlebih dahulu" }, { status: 400 });
        if (file.size > MAX_AVATAR_SIZE) return NextResponse.json({ error: "Ukuran foto maksimal 5 MB" }, { status: 400 });
        if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Format foto harus JPG, PNG, atau WebP" }, { status: 400 });

        const upload = await uploadFileToR2({
            buffer: Buffer.from(await file.arrayBuffer()),
            contentType: file.type || getContentTypeFromFilename(file.name),
            folder: `student-profile-${session.id}`,
            originalFilename: file.name,
        });

        await ensureProfileTable();
        await queryMySQL(
            `INSERT INTO student_profiles (user_id, avatar_url) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE avatar_url = VALUES(avatar_url)`,
            [session.id, upload.pathname]
        );
        return NextResponse.json({ message: "Foto profil berhasil diperbarui", avatarUrl: upload.pathname });
    } catch (error) {
        console.error("Upload student avatar error:", error);
        return NextResponse.json({ error: "Gagal mengunggah foto profil" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getProfileSession(request);
        if (!session || session.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        await ensureProfileTable();
        await queryMySQL("UPDATE student_profiles SET avatar_url = NULL WHERE user_id = ?", [session.id]);
        return NextResponse.json({ message: "Foto profil dihapus" });
    } catch (error) {
        console.error("Delete student avatar error:", error);
        return NextResponse.json({ error: "Gagal menghapus foto profil" }, { status: 500 });
    }
}
