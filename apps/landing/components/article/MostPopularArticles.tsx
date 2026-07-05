import type { ArticleView } from "@/lib/news";
import {
  defaultLanguage,
  type LandingTranslations,
  type Language,
} from "@/lib/i18n";
import { Article } from "@repo/ui";

interface MostPopularArticlesProps {
  articles: ArticleView[];
  t: LandingTranslations["articlePage"];
  language: Language;
}

export default function MostPopularArticles({
  articles,
  t,
  language,
}: MostPopularArticlesProps) {
  const articleSlug = (slug: string) =>
    language === defaultLanguage ? slug : `${slug}?lang=${language}`;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl text-neutral-90">{t.popularTitle}</h1>

      {articles.slice(0, 4).map((article, i) => (
        <Article
          key={article.id}
          id={article.id}
          slug={articleSlug(article.slug)}
          title={article.title}
          category={article.category}
          date={article.date}
          i={i}
        />
      ))}
    </div>
  );
}
