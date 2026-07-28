import { NextRequest, NextResponse } from "next/server";
import { listCandidateApplications, resolvePreStudentId } from "@repo/database";
import { requireStudent } from "@/app/lib/enrollment-auth";

export async function GET(request: NextRequest) {
    const student = await requireStudent(request);
    if (!student) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const preStudentId = await resolvePreStudentId(student.id, student.email);
    if (!preStudentId) {
        return NextResponse.json({ data: [], candidateProfileRequired: true });
    }
    return NextResponse.json({ data: await listCandidateApplications(preStudentId) });
}
