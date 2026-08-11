"use client";

import { useCallback, useEffect, useState } from "react";
import AssignmentManager from "./AssignmentManager";
import TestManager from "./TestManager";

type Tab = "overview" | "admissions" | "tests" | "assignments" | "roster";
type ClassItem = { id: number; code: string; name: string; description: string; level: string; program: string; schedule: string; status: string; capacity: number; occupied_seats: number; available_seats: number; start_at: string; end_at: string };
type Teacher = { teacher_id: number; name: string; email: string; role: string };
type Application = { id: number; status: string; full_name: string; nickname: string; email: string; japanese_level: string; submitted_at: string };
type Member = { id: number; user_id: number; name: string; email: string; status: string; joined_at: string };
type TeacherOption = { id: number; name: string; email: string };

export default function ClassWorkspace({ classId, teacherMode = false }: { classId: number; teacherMode?: boolean }) {
    const [tab, setTab] = useState<Tab>("overview");
    const [item, setItem] = useState<ClassItem | null>(null);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState("");
    const [message, setMessage] = useState("");

    const load = useCallback(async () => {
        const requests = [
            fetch(`/api/enrollment/classes/${classId}`),
            fetch(`/api/enrollment/classes/${classId}/teachers`),
            fetch(`/api/enrollment/applications?classId=${classId}`),
            fetch(`/api/enrollment/classes/${classId}/members`),
        ];
        if (!teacherMode) requests.push(fetch("/api/enrollment/teachers"));
        const responses = await Promise.all(requests);
        const data = await Promise.all(responses.map((response) => response.json()));
        if (responses[0].ok) setItem(data[0].data);
        else setMessage(data[0].error || "Kelas tidak dapat dibuka");
        if (responses[1].ok) setTeachers(data[1].data ?? []);
        if (responses[2].ok) setApplications(data[2].data ?? []);
        if (responses[3].ok) setMembers(data[3].data ?? []);
        if (responses[4]?.ok) setTeacherOptions(data[4].data ?? []);
    }, [classId, teacherMode]);

    useEffect(() => { void load(); }, [load]);

    async function assignTeacher() {
        if (!selectedTeacher) return;
        const response = await fetch(`/api/enrollment/classes/${classId}/teachers`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teacherId: Number(selectedTeacher), role: "teacher" }),
        });
        const data = await response.json();
        setMessage(data.error || data.message);
        if (response.ok) { setSelectedTeacher(""); await load(); }
    }

    async function removeTeacher(teacherId: number) {
        const response = await fetch(`/api/enrollment/classes/${classId}/teachers?teacherId=${teacherId}`, { method: "DELETE" });
        const data = await response.json(); setMessage(data.error || data.message); if (response.ok) await load();
    }

    async function decide(applicationId: number, action: "review" | "accept" | "reject") {
        let reason = "";
        if (action === "reject") {
            reason = window.prompt("Alasan penolakan:")?.trim() ?? "";
            if (!reason) return;
        }
        const response = await fetch(`/api/enrollment/applications/${applicationId}/decision`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
            body: JSON.stringify({ action, reason }),
        });
        const data = await response.json(); setMessage(data.error || data.message); if (response.ok) await load();
    }

    if (!item) return <div className="rounded-2xl bg-white p-10 text-center">{message || "Memuat workspace kelas..."}</div>;
    return (
        <div className="space-y-6">
            <header className="rounded-2xl bg-gradient-to-br from-primary-80 to-primary-base p-6 text-white shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-100">{item.code} · {item.level} · {item.status}</p>
                <h1 className="mt-2 text-3xl font-black">{item.name}</h1>
                <p className="mt-2 max-w-3xl text-sm text-blue-50">{item.description}</p>
                <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
                    <span>{item.program}</span><span>{item.schedule}</span><span>{item.occupied_seats}/{item.capacity} student</span>
                </div>
            </header>
            {message && <div className="rounded-xl bg-primary-10 p-4 text-primary-base">{message}</div>}
            <nav className="flex gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm">
                {([
                    ["overview", "Ringkasan & Pengajar"],
                    ["admissions", `Admission Queue (${applications.length})`],
                    ["tests", "Tes Penempatan"],
                    ["assignments", "Tugas & Nilai"],
                    ["roster", `Roster (${members.length})`],
                ] as [Tab, string][]).map(([value, label]) => (
                    <button key={value} onClick={() => setTab(value)} className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold ${tab === value ? "bg-primary-base text-white" : "text-neutral-60 hover:bg-primary-10"}`}>{label}</button>
                ))}
            </nav>
            {tab === "overview" && <section className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Pengajar kelas</h2><p className="text-sm text-neutral-50">Hanya pengajar dalam daftar ini yang dapat mengakses workspace kelas.</p></div></div>
                {!teacherMode && <div className="mt-5 flex gap-3"><select className="flex-1 rounded-xl border border-neutral-20 px-4 py-3" value={selectedTeacher} onChange={(event) => setSelectedTeacher(event.target.value)}><option value="">Pilih pengajar...</option>{teacherOptions.filter((option) => !teachers.some((teacher) => teacher.teacher_id === option.id)).map((option) => <option key={option.id} value={option.id}>{option.name} — {option.email}</option>)}</select><button onClick={assignTeacher} disabled={!selectedTeacher} className="rounded-xl bg-primary-base px-5 font-bold text-white disabled:bg-neutral-30">Assign</button></div>}
                <div className="mt-5 grid gap-3 md:grid-cols-2">{teachers.map((teacher) => <article key={teacher.teacher_id} className="flex items-center justify-between rounded-xl border border-neutral-10 p-4"><div><p className="font-bold">{teacher.name}</p><p className="text-sm text-neutral-50">{teacher.email}</p><span className="mt-1 inline-block rounded-full bg-primary-10 px-2 py-1 text-xs font-bold text-primary-base">{teacher.role}</span></div>{!teacherMode && teacher.role !== "owner" && <button onClick={() => removeTeacher(teacher.teacher_id)} className="text-sm font-semibold text-error-base">Hapus</button>}</article>)}</div>
            </section>}
            {tab === "admissions" && <section className="space-y-3">{applications.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center text-neutral-50">Belum ada aplikasi untuk kelas ini.</div> : applications.map((application) => <article key={application.id} className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center"><div className="flex-1"><span className="rounded-full bg-neutral-10 px-3 py-1 text-xs font-bold">{application.status}</span><h3 className="mt-2 text-lg font-bold">{application.full_name} ({application.nickname})</h3><p className="text-sm text-neutral-50">{application.email} · {application.japanese_level}</p></div>{!teacherMode && ["submitted", "under_review"].includes(application.status) && <div className="flex gap-2">{application.status === "submitted" && <Action onClick={() => decide(application.id, "review")}>Review</Action>}<Action onClick={() => decide(application.id, "accept")}>Accept</Action><Action danger onClick={() => decide(application.id, "reject")}>Reject</Action></div>}</article>)}</section>}
            {tab === "tests" && <TestManager classId={classId} />}
            {tab === "assignments" && <AssignmentManager classId={classId} />}
            {tab === "roster" && <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Roster aktif</h2><div className="mt-4 divide-y">{members.map((member) => <div key={member.id} className="flex justify-between py-4"><div><p className="font-bold">{member.name}</p><p className="text-sm text-neutral-50">{member.email}</p></div><div className="text-right"><span className="text-sm font-bold">{member.status}</span><p className="text-xs text-neutral-40">{new Date(member.joined_at).toLocaleDateString("id-ID")}</p></div></div>)}</div></section>}
        </div>
    );
}

function Action({ children, onClick, danger = false }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
    return <button onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-bold ${danger ? "bg-error-10 text-error-base" : "bg-primary-base text-white"}`}>{children}</button>;
}
