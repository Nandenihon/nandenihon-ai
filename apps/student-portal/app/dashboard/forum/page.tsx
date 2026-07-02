const topics = [
    { title: "Tanya jawab grammar", meta: "Diskusi materi bunpou dan pola kalimat" },
    { title: "Latihan kaiwa", meta: "Berbagi contoh percakapan harian" },
    { title: "Persiapan JLPT", meta: "Strategi belajar dan latihan soal" },
];

export default function ForumPage() {
    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-40">Forum</p>
                <h1 className="text-2xl font-bold text-neutral-90">Discussion Forum</h1>
            </div>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {topics.map((topic) => (
                    <article key={topic.title} className="card p-5">
                        <p className="text-sm font-bold text-neutral-90">{topic.title}</p>
                        <p className="mt-2 text-xs leading-relaxed text-neutral-50">{topic.meta}</p>
                        <button className="mt-5 rounded-lg border border-neutral-20 px-4 py-2 text-xs font-semibold text-neutral-60">
                            Masuk Forum
                        </button>
                    </article>
                ))}
            </section>

            <section className="card-muted p-5">
                <p className="text-sm font-semibold text-neutral-80">Belum ada thread aktif</p>
                <p className="mt-1 text-xs text-neutral-50">
                    Thread diskusi kelas akan tampil di sini setelah fitur forum tersambung ke database.
                </p>
            </section>
        </div>
    );
}
