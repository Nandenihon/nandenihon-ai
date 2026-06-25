export default function StudentsPage() {
    const students = [
        { id: 1, name: "Budi Santoso", email: "budi@example.com", phone: "081234567890", level: "N5", batch: "Batch 12", status: "Aktif", joinDate: "10 Jan 2025" },
        { id: 2, name: "Siti Rahayu", email: "siti@example.com", phone: "082345678901", level: "N4", batch: "Batch 7", status: "Aktif", joinDate: "15 Feb 2025" },
        { id: 3, name: "Ahmad Fauzi", email: "ahmad@example.com", phone: "083456789012", level: "N3", batch: "Batch 3", status: "Non-Aktif", joinDate: "20 Mar 2025" },
        { id: 4, name: "Dewi Kusuma", email: "dewi@example.com", phone: "084567890123", level: "N5", batch: "Batch 12", status: "Aktif", joinDate: "5 Apr 2025" },
        { id: 5, name: "Rizky Pratama", email: "rizky@example.com", phone: "085678901234", level: "N4", batch: "Batch 7", status: "Aktif", joinDate: "1 Mei 2025" },
        { id: 6, name: "Maya Indah", email: "maya@example.com", phone: "086789012345", level: "N5", batch: "Batch 13", status: "Aktif", joinDate: "10 Jun 2025" },
        { id: 7, name: "Hendra Wijaya", email: "hendra@example.com", phone: "087890123456", level: "N4", batch: "Batch 8", status: "Aktif", joinDate: "12 Jun 2025" },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-40">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <input
                            type="search"
                            placeholder="Cari siswa..."
                            className="w-64 bg-absolute-white border border-neutral-20 rounded-xl py-2 pl-9 pr-4 text-sm text-neutral-70 placeholder:text-neutral-40 outline-none focus:border-primary-base transition-all"
                        />
                    </div>
                    <select className="bg-absolute-white border border-neutral-20 rounded-xl py-2 px-3 text-sm text-neutral-70 outline-none focus:border-primary-base transition-all">
                        <option value="">Semua Level</option>
                        <option value="N5">N5</option>
                        <option value="N4">N4</option>
                        <option value="N3">N3</option>
                        <option value="N2">N2</option>
                        <option value="N1">N1</option>
                    </select>
                    <select className="bg-absolute-white border border-neutral-20 rounded-xl py-2 px-3 text-sm text-neutral-70 outline-none focus:border-primary-base transition-all">
                        <option value="">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Non-Aktif</option>
                    </select>
                </div>
                <a
                    href="/dashboard/students/add"
                    className="flex items-center gap-2 bg-primary-base text-absolute-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-80 transition-all"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Tambah Siswa
                </a>
            </div>

            {/* Table */}
            <div className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-0 border-b border-neutral-20">
                            <tr>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-6 py-3.5">Siswa</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">No. HP</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Level</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Batch</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Bergabung</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Status</th>
                                <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-10">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-neutral-0 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary-20 flex items-center justify-center text-primary-base text-sm font-bold flex-shrink-0">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-neutral-80">{student.name}</p>
                                                <p className="text-xs text-neutral-40">{student.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-neutral-60">{student.phone}</td>
                                    <td className="px-4 py-4">
                                        <span className="bg-primary-10 text-primary-base text-xs font-semibold px-2.5 py-1 rounded-full">
                                            {student.level}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-neutral-60">{student.batch}</td>
                                    <td className="px-4 py-4 text-sm text-neutral-60">{student.joinDate}</td>
                                    <td className="px-4 py-4">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                            student.status === "Aktif" ? "bg-success-10 text-success-base" : "bg-neutral-10 text-neutral-50"
                                        }`}>
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <button className="p-1.5 rounded-lg text-primary-base hover:bg-primary-10 transition-all" title="Lihat Detail">
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </button>
                                            <button className="p-1.5 rounded-lg text-neutral-50 hover:bg-neutral-10 transition-all" title="Edit">
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button className="p-1.5 rounded-lg text-error-base hover:bg-error-10 transition-all" title="Hapus">
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-20">
                    <p className="text-sm text-neutral-50">
                        Menampilkan <span className="font-semibold text-neutral-80">7</span> dari{" "}
                        <span className="font-semibold text-neutral-80">1,248</span> siswa
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-20 text-neutral-50 hover:bg-neutral-10 transition-all disabled:opacity-40" disabled>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        {[1, 2, 3].map((page) => (
                            <button key={page} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                                page === 1 ? "bg-primary-base text-absolute-white" : "border border-neutral-20 text-neutral-60 hover:bg-neutral-10"
                            }`}>
                                {page}
                            </button>
                        ))}
                        <span className="text-neutral-40 text-sm">...</span>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-20 text-sm font-medium text-neutral-60 hover:bg-neutral-10 transition-all">
                            178
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-20 text-neutral-50 hover:bg-neutral-10 transition-all">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
