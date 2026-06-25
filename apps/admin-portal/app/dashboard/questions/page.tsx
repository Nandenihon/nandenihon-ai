export default function QuestionsPage() {
    const questions = [
        { id: 1, text: "「おはよう」の意味は何ですか？", level: "N5", type: "Pilihan Ganda", category: "Vocabulary", status: "Aktif" },
        { id: 2, text: "次の文を正しく並べてください。", level: "N4", type: "Essay", category: "Grammar", status: "Aktif" },
        { id: 3, text: "この漢字の読み方は何ですか？「日本語」", level: "N4", type: "Pilihan Ganda", category: "Kanji", status: "Aktif" },
        { id: 4, text: "「〜ている」の文法を説明してください。", level: "N3", type: "Essay", category: "Grammar", status: "Draft" },
        { id: 5, text: "次の文章を読んで、質問に答えてください。", level: "N3", type: "Reading", category: "Reading", status: "Aktif" },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-40">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <input type="search" placeholder="Cari soal..." className="w-64 bg-absolute-white border border-neutral-20 rounded-xl py-2 pl-9 pr-4 text-sm text-neutral-70 placeholder:text-neutral-40 outline-none focus:border-primary-base transition-all" />
                    </div>
                    <select className="bg-absolute-white border border-neutral-20 rounded-xl py-2 px-3 text-sm text-neutral-70 outline-none focus:border-primary-base transition-all">
                        <option>Semua Level</option><option>N5</option><option>N4</option><option>N3</option>
                    </select>
                    <select className="bg-absolute-white border border-neutral-20 rounded-xl py-2 px-3 text-sm text-neutral-70 outline-none focus:border-primary-base transition-all">
                        <option>Semua Kategori</option><option>Vocabulary</option><option>Grammar</option><option>Kanji</option><option>Reading</option>
                    </select>
                </div>
                <button className="flex items-center gap-2 bg-primary-base text-absolute-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-80 transition-all">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Tambah Soal
                </button>
            </div>

            <div className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-neutral-0 border-b border-neutral-20">
                        <tr>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-6 py-3.5">Soal</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Level</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Tipe</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Kategori</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Status</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-10">
                        {questions.map((q) => (
                            <tr key={q.id} className="hover:bg-neutral-0 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-neutral-80 max-w-xs truncate">{q.text}</p>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="bg-primary-10 text-primary-base text-xs font-semibold px-2.5 py-1 rounded-full">{q.level}</span>
                                </td>
                                <td className="px-4 py-4 text-sm text-neutral-60">{q.type}</td>
                                <td className="px-4 py-4">
                                    <span className="bg-neutral-10 text-neutral-60 text-xs font-medium px-2.5 py-1 rounded-full">{q.category}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${q.status === "Aktif" ? "bg-success-10 text-success-base" : "bg-warning-10 text-warning-100"}`}>{q.status}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <button className="p-1.5 rounded-lg text-primary-base hover:bg-primary-10 transition-all"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                                        <button className="p-1.5 rounded-lg text-error-base hover:bg-error-10 transition-all"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
