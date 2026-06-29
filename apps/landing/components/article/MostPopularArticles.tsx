import type { ArticleView } from "@/lib/news";
import { Article } from "@repo/ui";

interface MostPopularArticlesProps {
  articles: ArticleView[];
}

export default function MostPopularArticles({ articles }: MostPopularArticlesProps) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl text-neutral-90">Artikel Terpopuler</h1>

      {articles.slice(0, 4).map((article, i) => (
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
