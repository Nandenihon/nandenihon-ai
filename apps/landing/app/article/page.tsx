import FeaturedArticles from "@/components/article/FeaturedArticles";
import MostPopularArticles from "@/components/article/MostPopularArticles";
import ArticleSelection from "@/components/article/ArticleSelection";
import { mapNewsToArticle } from "@/lib/news";
import { listNews } from "@repo/database";

async function getArticlePageData() {
  const news = await listNews({ limit: 100 });
  return news.data.map(mapNewsToArticle);
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
