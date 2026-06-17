import { POPULAR_ARTICLES } from "@/data/articles";
import { Article } from "@repo/ui";

export default function MostPopularArticles() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl text-neutral-90">Artikel Terpopuler</h1>

      {POPULAR_ARTICLES.map((article, i) => (
        <Article
          key={article.id}
          id={article.id}
          slug={article.slug}
          title={article.title}
          category={article.category}
          date={article.date}
          i={i}
        />
      ))}
    </div>
  );
}
