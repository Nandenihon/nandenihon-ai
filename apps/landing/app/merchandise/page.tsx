import { LOCAL_IMAGE_FALLBACK } from "@/components/home/shared";
import { resolveUploadImageUrl } from "@/lib/images";
import { listMerchandiseItems } from "@repo/database";
import type { MerchandiseItem } from "@repo/database";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Image from "next/image";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Merchandise | Nande Nihon",
  description: "Daftar merchandise resmi Nande Nihon.",
};

function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

const getMerchandiseItems = unstable_cache(async (): Promise<MerchandiseItem[]> => {
  try {
    const result = await listMerchandiseItems({ limit: 120 });
    return result.data;
  } catch (error) {
    console.error("Failed to fetch merchandise page:", error);
    return [];
  }
}, ["merchandise-page-items"], { revalidate: 300, tags: ["merchandise"] });

export default async function MerchandisePage() {
  const items = await getMerchandiseItems();

  return (
    <div className="bg-[#FBFCFF]">
      <section className="relative overflow-hidden px-6 pb-20 pt-40 lg:px-0">
        <div className="absolute left-[-80px] top-24 h-64 w-64 rounded-full bg-primary-10 blur-3xl" />
        <div className="absolute right-[-80px] top-52 h-72 w-72 rounded-full bg-[#F4D8FF] opacity-80 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-primary-base">
              Nande Nihon Store
            </p>
            <h1 className="text-4xl font-bold leading-tight text-neutral-90 lg:text-5xl">
              Merchandise
            </h1>
            <p className="mt-5 text-base leading-relaxed text-neutral-60 lg:text-lg">
              Pilihan barang merchandise Nande Nihon untuk menemani perjalanan belajar bahasa Jepangmu.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-primary-30 bg-white px-6 py-14 text-center text-neutral-50">
              Belum ada merchandise tersedia.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-[28px] border border-primary-10 bg-white p-4 shadow-[0_18px_45px_rgba(38,70,130,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(38,70,130,0.18)]"
                >
                  <div className="relative aspect-square overflow-hidden rounded-[22px] bg-neutral-10">
                    <Image
                      src={resolveUploadImageUrl(item.imageUrl, LOCAL_IMAGE_FALLBACK)}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  </div>
                  <div className="p-3">
                    <div className="mt-2 flex items-start justify-between gap-4">
                      <h2 className="text-xl font-bold leading-tight text-neutral-90">
                        {item.title}
                      </h2>
                      <p className="shrink-0 rounded-full bg-primary-10 px-3 py-1 text-sm font-bold text-primary-base">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                    {item.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-60">
                        {item.description}
                      </p>
                    )}
                    <a
                      href={`https://wa.me/6281299236462?text=${encodeURIComponent(`Halo Nande Nihon, saya tertarik dengan merchandise ${item.title}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary-base px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-80"
                    >
                      Tanya via WhatsApp
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
