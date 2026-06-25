export default function SeminarRegistrationsPage() {
    const registrations = [
        { id: 1, studentName: "Budi Santoso", seminar: "Budaya Jepang Modern", email: "budi@example.com", phone: "081234567890", registerDate: "10 Jun 2025", status: "Confirmed" },
        { id: 2, studentName: "Siti Rahayu", seminar: "Budaya Jepang Modern", email: "siti@example.com", phone: "082345678901", registerDate: "11 Jun 2025", status: "Confirmed" },
        { id: 3, studentName: "Ahmad Fauzi", seminar: "Tips Lulus JLPT N4 & N3", email: "ahmad@example.com", phone: "083456789012", registerDate: "12 Jun 2025", status: "Pending" },
        { id: 4, studentName: "Dewi Kusuma", seminar: "Tips Lulus JLPT N4 & N3", email: "dewi@example.com", phone: "084567890123", registerDate: "13 Jun 2025", status: "Confirmed" },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-20">
                    <h3 className="text-base font-bold text-neutral-90">Daftar Pendaftar Seminar</h3>
                    <button className="flex items-center gap-2 text-sm font-medium text-primary-base bg-primary-10 hover:bg-primary-20 px-4 py-2 rounded-xl transition-all">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export CSV
                    </button>
                </div>
                <table className="w-full">
                    <thead className="bg-neutral-0 border-b border-neutral-20">
                        <tr>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-6 py-3.5">Nama</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Seminar</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Kontak</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Tanggal Daftar</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-10">
                        {registrations.map((reg) => (
                            <tr key={reg.id} className="hover:bg-neutral-0 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-20 flex items-center justify-center text-primary-base text-xs font-bold">{reg.studentName.charAt(0)}</div>
                                        <p className="text-sm font-semibold text-neutral-80">{reg.studentName}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-neutral-60 max-w-xs">{reg.seminar}</td>
                                <td className="px-4 py-4">
                                    <p className="text-sm text-neutral-60">{reg.email}</p>
                                    <p className="text-xs text-neutral-40">{reg.phone}</p>
                                </td>
                                <td className="px-4 py-4 text-sm text-neutral-60">{reg.registerDate}</td>
                                <td className="px-4 py-4">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${reg.status === "Confirmed" ? "bg-success-10 text-success-base" : "bg-warning-10 text-warning-100"}`}>{reg.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
