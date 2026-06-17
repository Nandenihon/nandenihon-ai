import FeaturedArticles from "@/components/article/FeaturedArticles";
import MostPopularArticles from "@/components/article/MostPopularArticles";
import ArticleSelection from "@/components/article/ArticleSelection";

export default function ArticlePage() {
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        <FeaturedArticles />
        <MostPopularArticles />
      </div>
      
      <div className="w-full">
        <ArticleSelection />
      </div>
    </div>
  );
}
