import React from "react";
import Image from "next/image";
import Link from "next/link";
import CategoryTag from "./CategoryTag";

export interface CardNewsProps {
  slug: string;
  title: string;
  image?: string;
  category: string;
  author?: string;
  date: string;
  className?: string;
}

export const CardNews = ({
  slug,
  title,
  image,
  category,
  author,
  date,
  className = "",
}: CardNewsProps) => {
  return (
    <Link
      href={`/article/${slug}`}
      className={`bg-absolute-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-neutral-10 group cursor-pointer p-3 block ${className}`}
    >
      <div className="relative h-48 w-full overflow-hidden rounded-lg">
        <Image
          src={image || "/images/placeholder.jpg"}
          alt={title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <CategoryTag
          category={category}
          className="absolute top-3 left-3 backdrop-blur-sm"
        />
      </div>

      <div className="flex flex-col gap-3 mt-3">
        <div className="flex items-center gap-2 text-xs text-neutral-50 font-medium">
          {author && (
            <>
              <span>{author}</span>
              <span>•</span>
            </>
          )}
          <span>{date}</span>
        </div>
        <h3 className="text-base font-bold text-gray-900 mt-2 group-hover:text-neutral-50 transition-colors line-clamp-2">
          {title}
        </h3>
      </div>
    </Link>
  );
};

export default CardNews;
