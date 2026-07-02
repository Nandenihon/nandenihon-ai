import { resolveUploadImageUrl } from "@/lib/images";
import type { NewsItem, NewsItemSummary } from "@repo/database";

export type ArticleView = {
  id: number;
  slug: string;
  title: string;
  author?: string;
  date: string;
  image?: string;
  category: string;
  description?: string;
  content?: string;
  isHtml?: boolean;
};

export function formatNewsDate(date: Date | string | null) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function stripHtml(value: string | null | undefined) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function mapNewsToArticle(news: NewsItem): ArticleView {
  return {
    id: news.id,
    slug: news.slug,
    title: news.title,
    author: news.authorName || "Nande Nihon",
    date: formatNewsDate(news.publishedAt),
    image: resolveUploadImageUrl(news.featuredImageUrl, "") || undefined,
    category: news.categoryName || "Artikel",
    description: stripHtml(news.excerpt) || stripHtml(news.content).slice(0, 180),
    content: news.content,
    isHtml: true,
  };
}

/**
 * Maps a lightweight NewsItemSummary (no content field) to ArticleView.
 * Use for list pages and related-article widgets where full content is not needed.
 */
export function mapNewsSummaryToArticle(news: NewsItemSummary): ArticleView {
  return {
    id: news.id,
    slug: news.slug,
    title: news.title,
    author: news.authorName || "Nande Nihon",
    date: formatNewsDate(news.publishedAt),
    image: resolveUploadImageUrl(news.featuredImageUrl, "") || undefined,
    category: news.categoryName || "Artikel",
    description: stripHtml(news.excerpt).slice(0, 180),
    // content intentionally omitted — not fetched
    isHtml: false,
  };
}

