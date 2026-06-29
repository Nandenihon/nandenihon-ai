import type { ArticleView } from "@/lib/news";
import Image from "next/image";
import Link from "next/link";

const categoryStyles = [
  { color: "#F6C9C9", text: "#DC2626" },
  { color: "#F9A8D4", text: "#9D174D" },
  { color: "#FFFBFD", text: "#F9A8D4" },
  { color: "#FDE7C2", text: "#F59E0B" },
  { color: "#F0F0F0", text: "#4D4D4D" },
  { color: "#C5E8D2", text: "#16A34A" },
  { color: "#F4F7FE", text: "#2563EB" },
];

type BadgeItem = {
  title: string;
  color: string;
  text: string;
  active?: boolean;
};

interface PublicationSectionProps {
  articles: ArticleView[];
}

// Badge tombol kategori
const Badge = ({ item }: { item: BadgeItem }) => {
  const base =
    "px-6 py-1.5 rounded-full text-nowrap border-2 whitespace-nowrap";

  if (item.active) {
    return (
      <div
        className={`${base} bg-primary-50 border-primary-80 text-white font-bold`}
      >
        {item.title}
      </div>
    );
  }

  return (
    <div className={`${base} border-[#A8C1F7] text-primary-base`}>
      {item.title}
    </div>
  );
};

// Kartu publikasi
const PublicationCard = ({
  article,
  badge,
}: {
  article: ArticleView;
  badge: BadgeItem;
}) => {
  return (
    <Link
      href={`/article/${article.slug}`}
      className="p-3 rounded-lg bg-white shadow-[0_0_20px_2px_#0000001A] relative block transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-10">
        <Image
          src={article.image || "/images/placeholder.jpg"}
          alt={article.title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 33vw, 100vw"
        />
      </div>

      <div className="absolute top-6 left-6">
        <label
          style={{ backgroundColor: badge.color, color: badge.text }}
          className="px-4 py-2 rounded-full text-sm"
        >
          {badge.title}
        </label>
      </div>

      <div className="flex items-center mt-2 space-x-2 text-gray-600 text-sm">
        <p>{article.author}</p>
        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        <p>{article.date}</p>
      </div>

      <h3 className="text-base font-bold text-gray-900 mt-2">
        {article.title}
      </h3>
    </Link>
  );
};

const PublicationSection = ({ articles }: PublicationSectionProps) => {
  const publications = articles.slice(0, 6);
  const categories = [
    "Semua Kategori",
    ...Array.from(new Set(publications.map((article) => article.category).filter(Boolean))),
  ];
  const badges: BadgeItem[] = categories.map((title, index) => {
    const style = categoryStyles[index % categoryStyles.length];
    return {
      title,
      color: style.color,
      text: style.text,
      active: index === 0,
    };
  });

  return (
    <div className="py-12 bg-[#FBFCFF]">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        <div className="flex justify-between items-center mb-15">
          <h2 className="lg:text-4xl  text-2xl font-bold text-gray-900">
            Publikasi
          </h2>
          <Link
            href="/article"
            className="text-primary-base lg:text-lg  text-base font-bold"
          >
            Lihat Semua
          </Link>
        </div>

        <div className="flex overflow-x-auto space-x-5">
          {badges.map((item, idx) => (
            <Badge key={idx} item={item} />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 grid-cols-1 gap-6 mt-15">
          {publications.length > 0 ? (
            publications.map((item, idx) => (
              <PublicationCard
                key={item.slug}
                article={item}
                badge={badges[(idx % Math.max(1, badges.length - 1)) + 1] || badges[0]}
              />
            ))
          ) : (
            <div className="lg:col-span-3 text-center py-12 text-gray-500">
              Belum ada publikasi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicationSection;
