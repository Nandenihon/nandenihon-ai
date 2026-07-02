const ebookItems = [
    { title: "Minna no Nihongo Starter Pack", level: "N5", status: "Tersedia" },
    { title: "Kanji Practice Sheet", level: "N5-N4", status: "Tersedia" },
    { title: "JLPT Grammar Notes", level: "N4-N3", status: "Segera" },
];

export default function EbooksPage() {
    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-40">E-Book</p>
                <h1 className="text-2xl font-bold text-neutral-90">Materi Digital</h1>
            </div>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {ebookItems.map((item) => (
                    <article key={item.title} className="card p-5">
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-10 text-primary-base">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                                <path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z" />
                            </svg>
                        </div>
                        <p className="text-sm font-bold text-neutral-90">{item.title}</p>
                        <p className="mt-1 text-xs text-neutral-50">Level {item.level}</p>
                        <div className="mt-5 flex items-center justify-between">
                            <span className="rounded-full bg-neutral-10 px-3 py-1 text-xs font-semibold text-neutral-60">
                                {item.status}
                            </span>
                            <button className="text-xs font-semibold text-primary-base disabled:text-neutral-40" disabled={item.status !== "Tersedia"}>
                                Buka
                            </button>
                        </div>
                    </article>
                ))}
            </section>
        </div>
    );
}
