"use client";

import { HOME_SECTION_TITLE_CLASS } from "@/components/home/shared";
import type { HomeTranslations } from "@/lib/i18n";
import type { ArticleView } from "@/lib/news";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CardNews, Chips } from "@repo/ui";

const MAX_PUBLICATIONS = 6;

interface PublicationSectionProps {
  articles: ArticleView[];
  t: HomeTranslations["publications"];
}

const PublicationSection = ({ articles, t }: PublicationSectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    t.allCategories,
  );
  const categories = useMemo(
    () => [
      t.allCategories,
      ...Array.from(
        new Set(articles.map((article) => article.category).filter(Boolean)),
      ),
    ],
    [articles, t.allCategories],
  );
  const publications = useMemo(() => {
    const filteredArticles =
      selectedCategory === t.allCategories
        ? articles
        : articles.filter((article) => article.category === selectedCategory);

    return filteredArticles.slice(0, MAX_PUBLICATIONS);
  }, [articles, selectedCategory, t.allCategories]);

  return (
    <div className="py-12 bg-[#FBFCFF]">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        <div className="flex justify-between items-center mb-15">
          <h2 className={`${HOME_SECTION_TITLE_CLASS} title-reveal`}>
            {t.title}
          </h2>
          <Link
            href="/article"
            prefetch={false}
            className="text-primary-base lg:text-lg  text-base font-bold"
          >
            {t.viewAll}
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {categories.map((category) => (
            <Chips
              key={category}
              label={category}
              isSelected={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 grid-cols-1 gap-6 mt-15">
          {publications.length > 0 ? (
            publications.map((article) => (
              <CardNews
                key={article.id}
                slug={article.slug}
                title={article.title}
                image={article.image}
                category={article.category}
                author={article.author}
                date={article.date}
              />
            ))
          ) : (
            <div className="lg:col-span-3 text-center py-12 text-gray-500">
              {t.empty}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicationSection;
