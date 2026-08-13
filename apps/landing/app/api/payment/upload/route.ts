import { NextResponse } from "next/server";

// Retired: see apps/landing/app/api/register/start/route.ts
export async function POST() {
    return NextResponse.json(
        { success: false, error: "Upload bukti pembayaran ini sudah tidak tersedia. Silakan gunakan Student Portal." },
        { status: 410 }
    );
}
