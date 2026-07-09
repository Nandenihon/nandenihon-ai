"use client";

import { resolveUploadImageUrl } from "@/lib/images";
import Image from "next/image";
import { useEffect, useState } from "react";

export interface GalleryPhoto {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string;
}

interface GalleryGridProps {
  items: GalleryPhoto[];
  emptyLabel: string;
  zoomLabel: string;
  variant?: "preview" | "full";
}

const layoutClasses = [
  "md:col-span-2 lg:col-span-5 lg:row-span-2",
  "md:col-span-1 lg:col-span-3",
  "md:col-span-1 lg:col-span-4",
  "md:col-span-1 lg:col-span-4",
  "md:col-span-1 lg:col-span-3",
  "md:col-span-2 lg:col-span-5",
  "md:col-span-1 lg:col-span-4",
  "md:col-span-1 lg:col-span-4",
  "md:col-span-2 lg:col-span-4",
];

function getLayoutClass(index: number, variant: GalleryGridProps["variant"]) {
  if (variant === "full") {
    return layoutClasses[index % layoutClasses.length];
  }

  return layoutClasses[index % 6];
}

export default function GalleryGrid({
  items,
  emptyLabel,
  zoomLabel,
  variant = "preview",
}: GalleryGridProps) {
  const [selectedItem, setSelectedItem] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    if (!selectedItem) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedItem(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedItem]);

  if (items.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-primary-30 bg-white px-6 py-14 text-center text-neutral-50">
        {emptyLabel}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 auto-rows-[230px] gap-4 lg:gap-5">
        {items.map((item, index) => {
          const imageSrc = resolveUploadImageUrl(item.imageUrl);

          return (
            <button
              key={item.id}
              type="button"
              aria-label={`${zoomLabel}: ${item.title}`}
              onClick={() => setSelectedItem(item)}
              className={`group relative overflow-hidden rounded-[28px] bg-neutral-10 text-left shadow-[0_18px_45px_rgba(38,70,130,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(38,70,130,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base focus-visible:ring-offset-2 ${getLayoutClass(index, variant)}`}
            >
              <Image
                src={imageSrc}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(min-width: 1024px) 36vw, (min-width: 768px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="text-lg font-bold leading-tight lg:text-xl">
                  {item.title}
                </h3>
              </div>
            </button>
          );
        })}
      </div>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl lg:grid-cols-[1fr_320px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative min-h-[360px] bg-neutral-90 lg:min-h-[620px]">
              <Image
                src={resolveUploadImageUrl(selectedItem.imageUrl)}
                alt={selectedItem.title}
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 70vw, 100vw"
                priority
              />
            </div>
            <div className="flex flex-col gap-4 p-6">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-10 text-neutral-70 transition-colors hover:bg-neutral-20"
                aria-label="Tutup preview"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary-base">
                  Gallery Kegiatan
                </p>
                <h2 className="mt-2 text-2xl font-bold text-neutral-90">
                  {selectedItem.title}
                </h2>
                {selectedItem.description && (
                  <p className="mt-4 text-base leading-relaxed text-neutral-60">
                    {selectedItem.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
