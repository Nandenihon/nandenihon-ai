import { NextResponse } from "next/server";

// Retired: see apps/landing/app/api/register/start/route.ts
export async function POST() {
    return NextResponse.json(
        { success: false, error: "Pendaftaran tes ini sudah tidak tersedia. Silakan daftar melalui Student Portal." },
        { status: 410 }
    );
}
