"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { ArticleView } from "@/lib/news";
import { CardNews, Chips } from "@repo/ui";

interface ArticleSelectionProps {
  articles: ArticleView[];
}

export default function ArticleSelection({ articles }: ArticleSelectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");
  const [searchQuery, setSearchQuery] = useState("");
  const categories = [
    "Semua Kategori",
    ...Array.from(new Set(articles.map((article) => article.category).filter(Boolean))),
  ];

  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      selectedCategory === "Semua Kategori" ||
      article.category === selectedCategory;
    const matchesSearch = article.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map((category) => (
            <Chips
              key={category}
              label={category}
              isSelected={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>

        <div className="relative w-full md:w-auto">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-10 py-2 rounded-xl border border-primary-base focus:outline-none focus:ring-2 focus:ring-primary-base w-full md:w-52"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary-base">
            <Search size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
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
          <div className="col-span-full text-center py-20">
            <p className="text-gray-500 text-lg">
              Tidak ada artikel yang ditemukan.
            </p>
          </div>
        )}
      </div>
      <div className="pt-6">
        <button className="mx-auto bg-white text-primary-base px-6 py-2 rounded-lg border-primary-base border-2 font-bold text-lg hover:bg-primary-base/10 transition-colors">
          Muat Lebih Banyak
        </button>
      </div>
    </div>
  );
}
