import { NextResponse } from "next/server";

// Retired: see apps/landing/app/api/register/start/route.ts
export async function GET() {
    return NextResponse.json(
        { success: false, error: "Fitur ini sudah tidak tersedia. Silakan cek hasil tes melalui Student Portal." },
        { status: 410 }
    );
}
