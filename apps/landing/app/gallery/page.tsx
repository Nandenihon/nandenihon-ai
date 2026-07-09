import GalleryGrid, { type GalleryPhoto } from "@/components/gallery/GalleryGrid";
import { listGalleryItems } from "@repo/database";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Gallery Kegiatan | Nande Nihon",
  description: "Dokumentasi kegiatan dan momen belajar bersama Nande Nihon.",
};

const getGalleryItems = unstable_cache(async (): Promise<GalleryPhoto[]> => {
  try {
    const result = await listGalleryItems({ limit: 120 });
    return result.data.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
    }));
  } catch (error) {
    console.error("Failed to fetch gallery page:", error);
    return [];
  }
}, ["gallery-page-items"], { revalidate: 300, tags: ["gallery"] });

export default async function GalleryPage() {
  const galleryItems = await getGalleryItems();

  return (
    <div className="bg-[#FBFCFF]">
      <section className="relative overflow-hidden px-6 pb-16 pt-40 lg:px-0">
        <div className="absolute left-[-80px] top-24 h-64 w-64 rounded-full bg-primary-10 blur-3xl" />
        <div className="absolute right-[-80px] top-52 h-72 w-72 rounded-full bg-[#F4D8FF] opacity-80 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h1 className="text-4xl font-bold leading-tight text-neutral-90 lg:text-5xl">
              Gallery Kegiatan
            </h1>
            <p className="mt-5 text-base leading-relaxed text-neutral-60 lg:text-lg">
              Dokumentasi kegiatan belajar, komunitas, dan momen seru bersama Nande Nihon.
            </p>
          </div>

          <GalleryGrid
            items={galleryItems}
            emptyLabel="Belum ada foto kegiatan."
            zoomLabel="Perbesar foto"
            variant="full"
          />
        </div>
      </section>
    </div>
  );
}
