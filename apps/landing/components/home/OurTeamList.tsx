import GalleryGrid, { type GalleryPhoto } from "@/components/gallery/GalleryGrid";
import { HOME_SECTION_TITLE_CLASS } from "@/components/home/shared";
import type { HomeTranslations } from "@/lib/i18n";
import { listGalleryItems } from "@repo/database";
import { unstable_cache } from "next/cache";
import Link from "next/link";

const GALLERY_PREVIEW_LIMIT = 6;

const getGalleryPreview = unstable_cache(async (): Promise<GalleryPhoto[]> => {
  try {
    const result = await listGalleryItems({ limit: GALLERY_PREVIEW_LIMIT });
    return result.data.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
    }));
  } catch (error) {
    console.error("Failed to fetch gallery preview:", error);
    return [];
  }
}, ["home-gallery-preview"], { revalidate: 300, tags: ["gallery"] });

async function OurTeamList({ t }: { t: HomeTranslations["gallery"] }) {
  const galleryItems = await getGalleryPreview();

  return (
    <section className="relative overflow-hidden bg-[#FBFCFF] py-16">
      <div className="absolute left-0 top-16 h-56 w-56 rounded-full bg-primary-10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#F4D8FF] opacity-70 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-0">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className={`${HOME_SECTION_TITLE_CLASS} title-reveal`}>
              {t.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-neutral-60 lg:text-lg">
              {t.description}
            </p>
          </div>
          <Link
            href="/gallery"
            prefetch={false}
            className="inline-flex items-center justify-center rounded-full border-2 border-primary-base bg-white px-6 py-3 text-sm font-bold text-primary-base transition-all hover:-translate-y-0.5 hover:bg-primary-10 hover:shadow-[0_12px_24px_rgba(37,99,235,0.16)] active:translate-y-0"
          >
            {t.viewMore}
          </Link>
        </div>

        <GalleryGrid
          items={galleryItems}
          emptyLabel={t.empty}
          zoomLabel={t.zoomLabel}
        />
      </div>
    </section>
  );
}

export default OurTeamList;
