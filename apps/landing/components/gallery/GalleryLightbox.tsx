"use client";

import Image from "next/image";
import { resolveUploadImageUrl } from "@/lib/images";
import type { GalleryPhoto } from "./GalleryGrid";

interface GalleryLightboxProps {
  item: GalleryPhoto;
  onClose: () => void;
}

export default function GalleryLightbox({ item, onClose }: GalleryLightboxProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl lg:grid-cols-[1fr_320px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative min-h-[360px] bg-neutral-90 lg:min-h-[620px]">
          <Image
            src={resolveUploadImageUrl(item.imageUrl)}
            alt={item.title}
            fill
            className="object-contain"
            sizes="(min-width: 1024px) 70vw, 100vw"
            priority
          />
        </div>
        <div className="flex flex-col gap-4 p-6">
          <button
            type="button"
            onClick={onClose}
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
              {item.title}
            </h2>
            {item.description && (
              <p className="mt-4 text-base leading-relaxed text-neutral-60">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
