import { NextResponse } from "next/server";

// Retired: the public placement-quiz flow (register -> quiz -> result -> payment)
// has been replaced by the class-based admission flow in the student portal.
export async function GET() {
    return NextResponse.json(
        { success: false, error: "Pendaftaran tes ini sudah tidak tersedia. Silakan daftar melalui Student Portal." },
        { status: 410 }
    );
}

export async function POST() {
    return NextResponse.json(
        { success: false, error: "Pendaftaran tes ini sudah tidak tersedia. Silakan daftar melalui Student Portal." },
        { status: 410 }
    );
}
