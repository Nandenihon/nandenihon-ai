import { NextResponse } from "next/server";

// Retired: see apps/landing/app/api/register/start/route.ts
export async function GET() {
    return NextResponse.json(
        { success: false, error: "Tes ini sudah tidak tersedia. Silakan gunakan tes penempatan di Student Portal." },
        { status: 410 }
    );
}
