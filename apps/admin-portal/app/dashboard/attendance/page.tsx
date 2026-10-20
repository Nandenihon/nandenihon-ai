"use client";

import { useEffect, useState, useCallback } from "react";
import { DatePicker } from "@repo/ui";

type AttendanceStatus = "present" | "late" | "excused" | "absent";

interface ClassOption {
    id: number;
    code: string;
    name: string;
    level: string;
    status: string;
    occupied_seats: number;
}

interface StudentAttendance {
    userId: number;
    name: string;
    email: string;
    status: AttendanceStatus | null;
    notes: string;
    recordedBy: string | null;
}

const statusOptions: { value: AttendanceStatus; label: string; color: string }[] = [
    { value: "present", label: "Hadir", color: "text-success-base accent-success-base" },
    { value: "late", label: "Terlambat", color: "text-warning-100 accent-warning-100" },
    { value: "excused", label: "Izin", color: "text-info-base accent-info-base" },
    { value: "absent", label: "Absen", color: "text-error-base accent-error-base" },
];

// Attendance is recorded for running classes only; drafts and archived classes are hidden.
const RECORDABLE_CLASS_STATUSES = new Set(["published", "closed"]);

function jakartaToday() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export default function ClassAttendancePage() {
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>(jakartaToday);
    const [students, setStudents] = useState<StudentAttendance[]>([]);

    const [isLoadingClasses, setIsLoadingClasses] = useState(true);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        fetch("/api/enrollment/classes")
            .then(async (r) => {
                const res = await r.json();
                if (!r.ok) throw new Error(res.error || "Gagal memuat kelas");
                const classList = ((res.data || []) as ClassOption[]).filter((c) => RECORDABLE_CLASS_STATUSES.has(c.status));
                setClasses(classList);
                if (classList.length > 0) setSelectedClassId(String(classList[0].id));
            })
            .catch((err) => setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal memuat kelas" }))
            .finally(() => setIsLoadingClasses(false));
    }, []);

    const fetchStudents = useCallback(async () => {
        if (!selectedClassId || !selectedDate) return;
        setIsLoadingStudents(true);
        setMessage(null);
        try {
            const params = new URLSearchParams({ classId: selectedClassId, date: selectedDate });
            const res = await fetch(`/api/attendance?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal memuat siswa");
            setStudents(data.data || []);
        } catch (err) {
            setStudents([]);
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan" });
        } finally {
            setIsLoadingStudents(false);
        }
    }, [selectedClassId, selectedDate]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleStatusChange = (userId: number, status: AttendanceStatus) => {
        setStudents((prev) => prev.map((s) => (s.userId === userId ? { ...s, status } : s)));
    };

    const handleNotesChange = (userId: number, notes: string) => {
        setStudents((prev) => prev.map((s) => (s.userId === userId ? { ...s, notes } : s)));
    };

    const markRemainingPresent = () => {
        setStudents((prev) => prev.map((s) => (s.status === null ? { ...s, status: "present" } : s)));
    };

    const filled = students.filter((s) => s.status !== null);
    const unfilledCount = students.length - filled.length;

    const handleSave = async () => {
        if (!selectedClassId || !selectedDate || filled.length === 0) return;
        setIsSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    classId: Number(selectedClassId),
                    date: selectedDate,
                    attendance: filled.map((s) => ({ userId: s.userId, status: s.status, notes: s.notes })),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
            setMessage({
                type: "success",
                text: unfilledCount > 0 ? `${data.message}. ${unfilledCount} siswa belum diisi.` : data.message,
            });
            await fetchStudents();
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan" });
        } finally {
            setIsSaving(false);
        }
    };

    const selectedClass = classes.find((c) => String(c.id) === selectedClassId);

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-neutral-90">Absensi Kelas</h2>
                <p className="text-sm text-neutral-50">Catat kehadiran anggota kelas Portal Kelas per pertemuan</p>
            </div>

            {/* Filter Section */}
            <div className="bg-absolute-white p-5 rounded-2xl border border-neutral-20 flex flex-wrap gap-4 items-end">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                    <label htmlFor="attendance-class" className="text-sm font-semibold text-neutral-70">Pilih Kelas</label>
                    {isLoadingClasses ? (
                        <div className="h-10 bg-neutral-10 rounded-xl animate-pulse" />
                    ) : classes.length === 0 ? (
                        <p className="text-sm text-neutral-50 py-2.5">Belum ada kelas aktif yang bisa diabsen.</p>
                    ) : (
                        <select
                            id="attendance-class"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                        >
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.code} · {c.name} ({c.level}){c.status === "closed" ? " · ditutup" : ""}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex flex-col min-w-[180px]">
                    <DatePicker label="Tanggal pertemuan" value={selectedDate} onChange={setSelectedDate} />
                </div>
            </div>

            {message && (
                <div
                    className={`border rounded-xl px-4 py-3 text-sm ${
                        message.type === "success"
                            ? "bg-success-10 border-success-base text-success-base"
                            : "bg-error-10 border-error-base text-error-base"
                    }`}
                >
                    {message.text}
                </div>
            )}

            {/* Summary + bulk action */}
            {students.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                        {statusOptions.map((opt) => (
                            <span key={opt.value} className="rounded-full bg-absolute-white border border-neutral-20 px-3 py-1.5 text-neutral-70">
                                {opt.label}: {students.filter((s) => s.status === opt.value).length}
                            </span>
                        ))}
                        <span className={`rounded-full border px-3 py-1.5 ${unfilledCount > 0 ? "border-warning-100 text-warning-100 bg-absolute-white" : "border-neutral-20 text-neutral-50 bg-absolute-white"}`}>
                            Belum diisi: {unfilledCount}
                        </span>
                    </div>
                    {unfilledCount > 0 && (
                        <button
                            type="button"
                            onClick={markRemainingPresent}
                            className="rounded-xl bg-primary-10 px-4 py-2 text-sm font-semibold text-primary-base hover:bg-primary-20 transition-all"
                        >
                            Tandai sisanya Hadir
                        </button>
                    )}
                </div>
            )}

            {/* Students List */}
            <div className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
                    <table className="w-full table-fixed min-w-[760px] lg:min-w-0">
                        <thead className="bg-neutral-0 border-b border-neutral-20 sticky top-0 z-10">
                            <tr>
                                <th className="w-[18%] text-left px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Nama Siswa</th>
                                <th className="w-[20%] text-left px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Email</th>
                                <th className="w-[40%] text-left px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Kehadiran</th>
                                <th className="w-[22%] text-left px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-10">
                            {isLoadingStudents ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-32" /></td>
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-40" /></td>
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-56" /></td>
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-32" /></td>
                                    </tr>
                                ))
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-neutral-40">
                                        {selectedClass ? `Belum ada siswa aktif di kelas ${selectedClass.name}` : "Pilih kelas untuk melihat daftar siswa"}
                                    </td>
                                </tr>
                            ) : (
                                students.map((std) => (
                                    <tr key={std.userId} className={`transition-colors ${std.status === null ? "bg-warning-10/40" : "hover:bg-neutral-0"}`}>
                                        <td className="px-5 py-4 text-sm font-semibold text-neutral-80 truncate" title={std.name}>
                                            {std.name}
                                            {std.recordedBy && <p className="text-xs font-normal text-neutral-40 truncate">dicatat oleh {std.recordedBy}</p>}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-neutral-60 truncate" title={std.email}>{std.email}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                                {statusOptions.map((opt) => (
                                                    <label
                                                        key={opt.value}
                                                        className="flex items-center gap-1.5 whitespace-nowrap text-sm text-neutral-70 cursor-pointer hover:text-neutral-90"
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`status-${std.userId}`}
                                                            value={opt.value}
                                                            checked={std.status === opt.value}
                                                            onChange={() => handleStatusChange(std.userId, opt.value)}
                                                            className={opt.color}
                                                        />
                                                        {opt.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <input
                                                type="text"
                                                value={std.notes}
                                                maxLength={500}
                                                onChange={(e) => handleNotesChange(std.userId, e.target.value)}
                                                placeholder="Sakit, izin keluarga, dll."
                                                aria-label={`Keterangan untuk ${std.name}`}
                                                className="w-full bg-neutral-0 border border-neutral-20 rounded-lg py-1.5 px-3 text-xs text-neutral-75 outline-none focus:border-primary-base transition-all"
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Save Button */}
            {students.length > 0 && (
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || filled.length === 0}
                        className="bg-primary-base text-absolute-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-primary-80 disabled:bg-neutral-30 transition-all flex items-center gap-2"
                    >
                        {isSaving ? "Menyimpan..." : "Simpan Absensi"}
                    </button>
                </div>
            )}
        </div>
    );
}
