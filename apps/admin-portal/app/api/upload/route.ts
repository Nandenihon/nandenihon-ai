import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Ambil IP VPS dari Environment Variable Vercel
// Pastikan kamu sudah menambahkan VPS_IP (misal: 123.456.78.90) di Dashboard Vercel!
const VPS_IP = process.env.PRODUCTION_DB_HOST || "103.174.115.234"; 
const VPS_UPLOADER_URL = `http://${VPS_IP}:4000/api/upload`;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const folder = (formData.get("folder") as string) || "images";

        // 1. Validasi File Ada
        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // 2. Validasi Tipe File
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: jpg, png, webp, gif" },
                { status: 400 }
            );
        }

        // 3. Validasi Ukuran File
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 5MB" },
                { status: 400 }
            );
        }

        // 4. Bungkus ulang file ke FormData baru untuk dikirim ke VPS via HTTP
        const vpsFormData = new FormData();
        vpsFormData.append("file", file);

        // 5. Teruskan file ke API Express Port 4000 di VPS kamu
        const vpsResponse = await fetch(VPS_UPLOADER_URL, {
            method: "POST",
            body: vpsFormData,
            headers: {
                // Kirim informasi folder tujuan (artikel, testimoni, dll) lewat header
                "x-folder-type": folder,
            },
        });

        if (!vpsResponse.ok) {
            const errorText = await vpsResponse.text();
            throw new Error(`VPS Uploader responded with status ${vpsResponse.status}: ${errorText}`);
        }

        const vpsData = await vpsResponse.json();

        // 6. Kembalikan respon sukses ke Frontend Next.js
        return NextResponse.json({
            success: true,
            storage: "vps_storage",
            filename: vpsData.filename,
            pathname: vpsData.path, // Hasilnya: /uploads/artikel/namafile.jpg
            // Base URL mengarah ke domain utama kamu yang membaca folder /var/www
            url: `https://nandenihon.com${vpsData.path}`, 
            size: file.size,
            type: file.type
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error forwarding file to VPS:", error);
        return NextResponse.json(
            { error: "Failed to upload file to VPS", details: message },
            { status: 500 }
        );
    }
}
