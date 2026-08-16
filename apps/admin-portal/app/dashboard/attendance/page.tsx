"use client";

import { useEffect, useState, useCallback } from "react";
import type { Class } from "@repo/types";
import { DatePicker } from "@repo/ui";

interface StudentAttendance {
    studentId: number;
    full_name: string;
    email: string;
    level: string;
    status: "present" | "absent" | "late" | "excused" | null;
    notes: string;
}

const statusOptions = [
    { value: "present", label: "Hadir", color: "text-success-base accent-success-base" },
    { value: "absent", label: "Absen", color: "text-error-base accent-error-base" },
    { value: "late", label: "Terlambat", color: "text-warning-100 accent-warning-100" },
    { value: "excused", label: "Izin", color: "text-info-base accent-info-base" },
];

export default function ClassAttendancePage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [students, setStudents] = useState<StudentAttendance[]>([]);
    
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Initial local date setup (YYYY-MM-DD)
    useEffect(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        setSelectedDate(`${yyyy}-${mm}-${dd}`);

        // Fetch classes
        fetch("/api/class?limit=100")
            .then((r) => r.json())
            .then((res) => {
                const classList = res.data || [];
                setClasses(classList);
                if (classList.length > 0) {
                    setSelectedClassId(String(classList[0].id));
                }
            })
            .catch((err) => console.error("Gagal memuat kelas", err))
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
            
            // Set default status to 'present' for students with no attendance record
            const processed = (data.data || []).map((s: StudentAttendance) => ({
                ...s,
                status: s.status === null ? "present" : s.status,
                notes: s.notes || "",
            }));
            setStudents(processed);
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan" });
        } finally {
            setIsLoadingStudents(false);
        }
    }, [selectedClassId, selectedDate]);

    useEffect(() => {
        fetchStudents();
    }, [selectedClassId, selectedDate, fetchStudents]);

    const handleStatusChange = (studentId: number, status: "present" | "absent" | "late" | "excused") => {
        setStudents((prev) =>
            prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
        );
    };

    const handleNotesChange = (studentId: number, notes: string) => {
        setStudents((prev) =>
            prev.map((s) => (s.studentId === studentId ? { ...s, notes } : s))
        );
    };

    const handleSave = async () => {
        if (!selectedClassId || !selectedDate) return;
        setIsSaving(true);
        setMessage(null);
        try {
            const body = {
                classId: Number(selectedClassId),
                date: selectedDate,
                attendance: students.map((s) => ({
                    studentId: s.studentId,
                    status: s.status,
                    notes: s.notes,
                })),
            };

            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal menyimpan");

            setMessage({ type: "success", text: "Absensi berhasil disimpan!" });
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-neutral-90">Absensi Kelas</h2>
                <p className="text-sm text-neutral-50">Lakukan dan catat kehadiran siswa harian</p>
            </div>

            {/* Filter Section */}
            <div className="bg-absolute-white p-5 rounded-2xl border border-neutral-20 flex flex-wrap gap-4 items-end">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                    <label className="text-sm font-semibold text-neutral-70">Pilih Kelas</label>
                    {isLoadingClasses ? (
                        <div className="h-10 bg-neutral-10 rounded-xl animate-pulse" />
                    ) : (
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                        >
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.class_name} ({c.level})
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex flex-col min-w-[180px]">
                    <DatePicker
                        label="Tanggal"
                        value={selectedDate}
                        onChange={setSelectedDate}
                    />
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

            {/* Students List */}
            <div className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
                    <table className="w-full table-fixed min-w-[700px] lg:min-w-0">
                        <thead className="bg-neutral-0 border-b border-neutral-20 sticky top-0 z-10">
                            <tr>
                                <th className="w-[22%] text-left px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Nama Siswa</th>
                                <th className="w-[28%] text-left px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Email</th>
                                <th className="w-[10%] text-left px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Level</th>
                                <th className="w-[22%] text-left px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Kehadiran</th>
                                <th className="w-[18%] text-left px-5 py-3.5 text-xs font-semibold text-neutral-50 uppercase tracking-wider">Keterangan / Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-10">
                            {isLoadingStudents ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-32" /></td>
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-40" /></td>
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-12" /></td>
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-40" /></td>
                                        <td className="px-5 py-4"><div className="h-4 bg-neutral-10 rounded w-32" /></td>
                                    </tr>
                                ))
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-neutral-40">
                                        Tidak ada siswa terdaftar pada level kelas ini
                                    </td>
                                </tr>
                            ) : (
                                students.map((std) => (
                                    <tr key={std.studentId} className="hover:bg-neutral-0 transition-colors">
                                        <td className="px-5 py-4 text-sm font-semibold text-neutral-80 truncate" title={std.full_name}>{std.full_name}</td>
                                        <td className="px-5 py-4 text-sm text-neutral-60 truncate" title={std.email}>{std.email}</td>
                                        <td className="px-5 py-4 text-sm text-neutral-50 truncate">{std.level || "-"}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-4">
                                                {statusOptions.map((opt) => (
                                                    <label
                                                        key={opt.value}
                                                        className="flex items-center gap-1.5 text-sm text-neutral-70 cursor-pointer hover:text-neutral-90"
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`status-${std.studentId}`}
                                                            value={opt.value}
                                                            checked={std.status === opt.value}
                                                            onChange={() => handleStatusChange(std.studentId, opt.value as any)}
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
                                                onChange={(e) => handleNotesChange(std.studentId, e.target.value)}
                                                placeholder="Sakit, izin dinas, dll."
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
                        disabled={isSaving}
                        className="bg-primary-base text-absolute-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-primary-80 disabled:bg-neutral-30 transition-all flex items-center gap-2"
                    >
                        {isSaving ? "Menyimpan..." : "Simpan Absensi"}
                    </button>
                </div>
            )}
        </div>
    );
}
