"use client";

import { FEATURED_ARTICLES } from "@/data/articles";
import { CategoryTag } from "@repo/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function FeaturedArticles() {
  const sliderArticles = FEATURED_ARTICLES.slice(0, 4);
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? sliderArticles.length - 1 : prev - 1,
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev === sliderArticles.length - 1 ? 0 : prev + 1,
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const currentArticle = sliderArticles[currentIndex];

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <h1 className="font-bold text-2xl text-gray-900">Artikel Pilihan Anda</h1>

      <Link
        href={`/article/${currentArticle.slug}`}
        className="relative w-full aspect-video md:aspect-21/9 lg:aspect-16/7 rounded-2xl overflow-hidden shadow-2xl group cursor-pointer"
      >
        {sliderArticles.map((article, index) => (
          <div
            key={article.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={article.image || "/images/placeholder.jpg"}
              alt={article.title}
              fill
              className="object-cover h-100"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
          </div>
        ))}

        <CategoryTag 
         category={currentArticle.category} 
         className="absolute top-3 left-3 z-20 backdrop-blur-sm"
        />

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            prevSlide();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
          aria-label="Previous Slide"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            nextSlide();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
          aria-label="Next Slide"
        >
          <ChevronRight size={20} />
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {sliderArticles.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToSlide(index);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                  : "bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Link>

      <div className="flex flex-col gap-3 animate-fade-in transition-all duration-300">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <span className="text-[#666666]">{currentArticle.author}</span>
          <span>&bull;</span>
          <span className="text-[#666666]">{currentArticle.date}</span>
        </div>

        <div className="space-y-2">
          <Link href={`/article/${currentArticle.slug}`}>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-tight hover:text-primary-base transition-colors cursor-pointer">
              {currentArticle.title}
            </h2>
          </Link>
          <p className="text-gray-600 line-clamp-2 leading-relaxed">
            {currentArticle.description}
          </p>
        </div>
      </div>
    </div>
  );
}
