// ISR: cache the article list for 1 hour, revalidate in background.
export const revalidate = 3600;

import FeaturedArticles from "@/components/article/FeaturedArticles";
import MostPopularArticles from "@/components/article/MostPopularArticles";
import ArticleSelection from "@/components/article/ArticleSelection";
import { mapNewsSummaryToArticle } from "@/lib/news";
import { listNewsSummary } from "@repo/database";

async function getArticlePageData() {
  // Use listNewsSummary — no LONGTEXT content field needed for list pages.
  // Limit 30 is enough; the list doesn't display 100 articles at once.
  const news = await listNewsSummary({ limit: 30 });
  return news.data.map(mapNewsSummaryToArticle);
}


export default async function ArticlePage() {
  const articles = await getArticlePageData();
  const featuredArticles = articles.slice(0, 6);
  const popularArticles = articles.slice(6, 10).length > 0
    ? articles.slice(6, 10)
    : articles.slice(0, 4);

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        <FeaturedArticles articles={featuredArticles} />
        <MostPopularArticles articles={popularArticles} />
      </div>
      
      <div className="w-full">
        <ArticleSelection articles={articles} />
      </div>
    </div>
  );
}
