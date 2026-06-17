import { CardNews } from "@repo/ui";
import { getAllArticles } from "@/data/articles";

interface RelatedArticlesGridProps {
  currentSlug: string;
  currentCategory: string;
}

export default function RelatedArticlesGrid({
  currentSlug,
  currentCategory,
}: RelatedArticlesGridProps) {
  const allArticles = getAllArticles();

  // Get related articles: same category first, then others
  const sameCategoryArticles = allArticles.filter(
    (a) => a.category === currentCategory && a.slug !== currentSlug
  );

  const otherArticles = allArticles.filter(
    (a) => a.category !== currentCategory && a.slug !== currentSlug
  );

  // Combine: up to 3 from same category, fill rest from others
  const relatedArticles = [
    ...sameCategoryArticles.slice(0, 3),
    ...otherArticles.slice(0, Math.max(0, 3 - sameCategoryArticles.length)),
  ].slice(0, 3);

  if (relatedArticles.length === 0) return null;

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
        {relatedArticles.map((article) => (
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
