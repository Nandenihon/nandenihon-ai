export const dynamic = "force-dynamic";

import { listNews } from "@repo/database";

function formatDate(date: Date | null) {
    if (!date) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
}

export default async function NewsPage() {
    const articles = (await listNews({ limit: 50 })).data;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-40">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        </div>
                        <input type="search" placeholder="Cari artikel..." className="w-64 bg-absolute-white border border-neutral-20 rounded-xl py-2 pl-9 pr-4 text-sm text-neutral-70 placeholder:text-neutral-40 outline-none focus:border-primary-base transition-all" />
                    </div>
                    <select className="bg-absolute-white border border-neutral-20 rounded-xl py-2 px-3 text-sm text-neutral-70 outline-none focus:border-primary-base transition-all">
                        <option>Semua Status</option><option>Published</option><option>Draft</option>
                    </select>
                </div>
                <button className="flex items-center gap-2 bg-primary-base text-absolute-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-80 transition-all">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Tulis Artikel
                </button>
            </div>

            <div className="bg-absolute-white rounded-2xl border border-neutral-20 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-neutral-0 border-b border-neutral-20">
                        <tr>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-6 py-3.5">Judul</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Kategori</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Penulis</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Tanggal</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Status</th>
                            <th className="text-left text-xs font-semibold text-neutral-50 px-4 py-3.5">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-10">
                        {articles.map((article) => (
                            <tr key={article.id} className="hover:bg-neutral-0 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="text-sm font-semibold text-neutral-80 max-w-xs truncate">{article.title}</p>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="bg-secondary-10 text-secondary-80 text-xs font-medium px-2.5 py-1 rounded-full">{article.categoryName || "Artikel"}</span>
                                </td>
                                <td className="px-4 py-4 text-sm text-neutral-60">{article.authorName || "Nande Nihon"}</td>
                                <td className="px-4 py-4 text-sm text-neutral-60">{formatDate(article.publishedAt)}</td>
                                <td className="px-4 py-4">
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-success-10 text-success-base">{article.status}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <a href={article.sourceUrl || `/article/${article.slug}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-primary-base hover:bg-primary-10 transition-all" title="Lihat artikel">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {articles.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-sm text-neutral-50">
                                    Belum ada data news.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
