import { CardNews } from "@repo/ui";
import type { ArticleView } from "@/lib/news";

interface RelatedArticlesGridProps {
  articles: ArticleView[];
}

export default function RelatedArticlesGrid({
  articles,
}: RelatedArticlesGridProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-16 pt-10 border-t border-neutral-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-neutral-90">
            Artikel Lainnya
          </h2>
          <p className="text-neutral-50 mt-1 text-sm">
            Temukan lebih banyak artikel menarik seputar Jepang
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.slice(0, 3).map((article) => (
          <CardNews
            key={article.id}
            slug={article.slug}
            title={article.title}
            image={article.image}
            category={article.category}
            author={article.author}
            date={article.date}
          />
        ))}
      </div>
    </section>
  );
}
