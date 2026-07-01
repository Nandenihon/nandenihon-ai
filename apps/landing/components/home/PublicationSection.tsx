import {
  HOME_SECTION_TITLE_CLASS,
  LOCAL_IMAGE_FALLBACK,
} from "@/components/home/shared";
import type { ArticleView } from "@/lib/news";
import Image from "next/image";
import Link from "next/link";

const MAX_PUBLICATIONS = 6;

const categoryStyles = [
  { color: "#F6C9C9", text: "#DC2626" },
  { color: "#F9A8D4", text: "#9D174D" },
  { color: "#FFFBFD", text: "#F9A8D4" },
  { color: "#FDE7C2", text: "#F59E0B" },
  { color: "#F0F0F0", text: "#4D4D4D" },
  { color: "#C5E8D2", text: "#16A34A" },
  { color: "#F4F7FE", text: "#2563EB" },
] as const;

type BadgeItem = {
  title: string;
  color: string;
  text: string;
  active?: boolean;
};

interface PublicationSectionProps {
  articles: ArticleView[];
}

const getCategoryStyle = (index: number) =>
  categoryStyles[index % categoryStyles.length];

const Badge = ({ item }: { item: BadgeItem }) => {
  const base =
    "px-6 py-1.5 rounded-full text-nowrap border-2 whitespace-nowrap shrink-0";

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
      prefetch={false}
      className="p-3 rounded-lg bg-white shadow-[0_0_20px_2px_#0000001A] relative block transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-10">
        <Image
          src={article.image || LOCAL_IMAGE_FALLBACK}
          alt={article.title}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 384px, (min-width: 1024px) calc((100vw - 96px) / 3), calc(100vw - 48px)"
        />
      </div>

      <div className="absolute top-6 left-6">
        <span
          style={{ backgroundColor: badge.color, color: badge.text }}
          className="px-4 py-2 rounded-full text-sm"
        >
          {badge.title}
        </span>
      </div>

      <div className="flex items-center mt-2 space-x-2 text-gray-600 text-sm">
        <span>{article.author || "Nande Nihon"}</span>
        {article.date && (
          <>
            <span className="w-1 h-1 bg-gray-400 rounded-full" />
            <span>{article.date}</span>
          </>
        )}
      </div>

      <h3 className="text-base font-bold text-gray-900 mt-2">
        {article.title}
      </h3>
    </Link>
  );
};

const PublicationSection = ({ articles }: PublicationSectionProps) => {
  const publications = articles.slice(0, MAX_PUBLICATIONS);
  const categories = [
    "Semua Kategori",
    ...Array.from(new Set(publications.map((article) => article.category))),
  ];
  const badges: BadgeItem[] = categories.map((title, index) => {
    const style = getCategoryStyle(index);
    return {
      title,
      color: style.color,
      text: style.text,
      active: index === 0,
    };
  });
  const badgeByCategory = new Map(badges.map((badge) => [badge.title, badge]));

  return (
    <div className="py-12 bg-[#FBFCFF]">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        <div className="flex justify-between items-center mb-15">
          <h2 className={HOME_SECTION_TITLE_CLASS}>Publikasi</h2>
          <Link
            href="/article"
            prefetch={false}
            className="text-primary-base lg:text-lg  text-base font-bold"
          >
            Lihat Semua
          </Link>
        </div>

        <div className="flex overflow-x-auto space-x-5">
          {badges.map((item) => (
            <Badge key={item.title} item={item} />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 grid-cols-1 gap-6 mt-15">
          {publications.length > 0 ? (
            publications.map((item) => (
              <PublicationCard
                key={item.slug}
                article={item}
                badge={badgeByCategory.get(item.category) || badges[0]}
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
