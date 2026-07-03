import { NextRequest, NextResponse } from "next/server";
import { queryMySQL, type RowDataPacket, type ResultSetHeader } from "@repo/database";
import { verifyToken, COOKIE_NAME } from "@/app/lib/auth";

async function getSession(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
}

/**
 * GET /api/class-prep
 * Fetch class preparation status.
 */
export async function GET(request: NextRequest) {
    const session = await getSession(request);
    if (!session) {
        return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const classId = searchParams.get("classId");

        let query = `
            SELECT c.id as class_id, c.class_name, c.level, c.status as class_status,
                   p.room_ready, p.materials_ready, p.zoom_link, p.schedule_announced, p.notes, p.updated_at
            FROM \`class\` c
            LEFT JOIN class_preparation p ON c.id = p.class_id
        `;
        const params: unknown[] = [];

        if (classId) {
            query += " WHERE c.id = ? LIMIT 1";
            params.push(classId);
            const classPrep = await queryMySQL<RowDataPacket[]>(query, params);
            if (classPrep.length === 0) {
                return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
            }
            return NextResponse.json({ data: classPrep[0] });
        }

        query += " ORDER BY c.id DESC";
        const classPreps = await queryMySQL<RowDataPacket[]>(query);
        return NextResponse.json({ data: classPreps });

    } catch (error) {
        console.error("Error fetching class preparation status:", error);
        return NextResponse.json({ error: "Gagal mengambil data persiapan kelas" }, { status: 500 });
    }
}

/**
 * POST /api/class-prep
 * Save or update class preparation status.
 * - Allowed: admin-class, admin, super_admin
 */
export async function POST(request: NextRequest) {
    const session = await getSession(request);
    if (!session) {
        return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    if (!["admin-class", "admin", "super_admin"].includes(session.role)) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { classId, roomReady, materialsReady, zoomLink, scheduleAnnounced, notes } = body;

        if (!classId) {
            return NextResponse.json({ error: "classId wajib disertakan" }, { status: 400 });
        }

        await queryMySQL<ResultSetHeader>(
            `INSERT INTO class_preparation (class_id, room_ready, materials_ready, zoom_link, schedule_announced, notes)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                room_ready = VALUES(room_ready),
                materials_ready = VALUES(materials_ready),
                zoom_link = VALUES(zoom_link),
                schedule_announced = VALUES(schedule_announced),
                notes = VALUES(notes)`,
            [
                classId,
                roomReady ? 1 : 0,
                materialsReady ? 1 : 0,
                zoomLink || null,
                scheduleAnnounced ? 1 : 0,
                notes || null
            ]
        );

        const updated = await queryMySQL<RowDataPacket[]>(
            "SELECT * FROM class_preparation WHERE class_id = ?",
            [classId]
        );

        return NextResponse.json({ data: updated[0] });

    } catch (error) {
        console.error("Error saving class preparation:", error);
        return NextResponse.json({ error: "Gagal menyimpan persiapan kelas" }, { status: 500 });
    }
}
