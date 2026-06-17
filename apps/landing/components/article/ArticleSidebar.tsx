"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CategoryTag } from "@repo/ui";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface SidebarRelatedArticle {
  slug: string;
  title: string;
  image?: string;
  date: string;
  category: string;
}

interface SocialIcon {
  name: string;
  icon: React.ReactNode;
  link: string;
}

interface ArticleSidebarProps {
  socialIcons: SocialIcon[];
  relatedArticles: SidebarRelatedArticle[];
}

export default function ArticleSidebar({
  socialIcons,
  relatedArticles,
}: ArticleSidebarProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // Build TOC from article headings
  useEffect(() => {
    const articleContent = document.querySelector("[data-article-content]");
    if (!articleContent) return;

    const headings = articleContent.querySelectorAll("h2, h3, h4");
    const items: TocItem[] = [];

    headings.forEach((heading, index) => {
      const id = heading.id || `heading-${index}`;
      if (!heading.id) heading.id = id;

      items.push({
        id,
        text: heading.textContent || "",
        level: parseInt(heading.tagName.charAt(1)),
      });
    });

    setTocItems(items);
  }, []);

  // Track active heading on scroll
  useEffect(() => {
    if (tocItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-80px 0px -70% 0px",
        threshold: 0.1,
      }
    );

    tocItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <aside className="hidden lg:block lg:col-span-1">
      <div className="sticky top-32 space-y-6">
        {/* Table of Contents */}
        {tocItems.length > 0 && (
          <div className="bg-neutral-0 rounded-2xl p-5 border border-neutral-10">
            <h3 className="text-sm font-bold text-neutral-80 uppercase tracking-wider mb-4">
              Daftar Isi
            </h3>
            <nav>
              <ul className="space-y-1">
                {tocItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollToHeading(item.id)}
                      className={`w-full text-left text-sm py-1.5 px-3 rounded-lg transition-all duration-200 block
                        ${
                          item.level === 3
                            ? "pl-6"
                            : item.level === 4
                              ? "pl-9"
                              : ""
                        }
                        ${
                          activeId === item.id
                            ? "text-primary-base font-semibold bg-primary-10 border-l-2 border-primary-base"
                            : "text-neutral-50 hover:text-neutral-80 hover:bg-neutral-10"
                        }
                      `}
                    >
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}

        {/* Social Share */}
        <div className="bg-neutral-0 rounded-2xl p-5 border border-neutral-10">
          <h3 className="text-sm font-bold text-neutral-80 uppercase tracking-wider mb-4">
            Bagikan Artikel
          </h3>
          <div className="flex items-center gap-3">
            {socialIcons.map((social) => (
              <a
                key={social.name}
                href={social.link}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-primary-10 border border-neutral-10 hover:border-primary-30 hover:shadow-md transition-all duration-300 hover:scale-110"
                aria-label={`Share on ${social.name}`}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="bg-neutral-0 rounded-2xl p-5 border border-neutral-10">
            <h3 className="text-sm font-bold text-neutral-80 uppercase tracking-wider mb-4">
              Artikel Terkait
            </h3>
            <div className="space-y-4">
              {relatedArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/article/${article.slug}`}
                  className="flex gap-3 group"
                >
                  <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={article.image || "/images/placeholder.jpg"}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <h4 className="text-sm font-semibold text-neutral-80 line-clamp-2 group-hover:text-primary-base transition-colors leading-tight">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <CategoryTag
                        category={article.category}
                        className="!text-[10px] !px-2 !py-0.5"
                      />
                      <span className="text-xs text-neutral-40">
                        {article.date}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
