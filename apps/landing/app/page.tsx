// ISR is set via revalidate = 300 below; force-dynamic is not needed.

import BenefitSection from "@/components/home/BenefitSection";
import CtaSection from "@/components/home/CtaSection";
import { OurPartnerSection } from "@/components/home/OurPartnerSection";
import OurTeamList from "@/components/home/OurTeamList";
import PublicationSection from "@/components/home/PublicationSection";
import TestimonialSection from "@/components/home/TestimonialSection";
import { mapNewsSummaryToArticle } from "@/lib/news";
import { listNewsSummary } from "@repo/database";
import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 300;

const BackgroundPattern = () => (
  <>
    <div className="absolute top-0 w-328 -mt-50 z-0 hidden lg:block">
      <Image
        src="/images/pattern-hero.png"
        alt=""
        width={1200}
        height={1200}
        className="w-full"
        sizes="1200px"
        aria-hidden="true"
      />
    </div>

    <div className="absolute top-0 right-0 z-0">
      <Image
        src="/images/vector-gradient.png"
        alt=""
        width={800}
        height={800}
        sizes="(min-width: 1024px) 800px, 60vw"
        aria-hidden="true"
      />
    </div>
  </>
);

const HeroSection = () => (
  <div className="relative max-w-7xl mx-auto z-10 flex flex-col lg:flex-row items-center justify-between px-6 lg:px-0 pt-48">
    <div className="w-full lg:w-1/2">
      <h1 className="font-bold text-[36px] lg:text-[48px] leading-tight lg:leading-17">
        Belajar Bahasa Jepang
        <br /> Jadi Lebih Mudah &<br /> Menyenangkan
      </h1>

      <p className="text-base lg:text-lg leading-relaxed mt-4">
        Berangkat dari pengalaman pernah kesulitan dan merasa bingung
        <br className="hidden lg:block" /> sendirian. Kami tergerak untuk
        mewujudkan gerakan bermanfaat melalu akses belajar yang lebih mudah dan
        menyenangkan. Berperan menjadi seorang teman saat kamu sedang di fase
        sulit dan bingung belajar Bahasa Jepang.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 w-full lg:w-auto">
        <Link
          href="/class/register"
          prefetch={false}
          className="btn w-full sm:w-auto justify-center"
        >
          Mulai Belajar
        </Link>
        <Link
          href="/class"
          prefetch={false}
          className="btn bg-white text-primary-base border border-primary-base w-full sm:w-auto justify-center"
        >
          Lihat Kelas
        </Link>
      </div>
    </div>

    <div className="hidden lg:block">
      <Image
        src="/images/hero.png"
        alt="Siswa belajar bahasa Jepang bersama Nande Nihon"
        width={638}
        height={530}
        className="w-150"
        sizes="600px"
        priority
      />
    </div>
  </div>
);

const getPublicationArticles = unstable_cache(async () => {
  try {
    // listNewsSummary skips LONGTEXT content — homepage cards only need title/image/excerpt
    const news = await listNewsSummary({ limit: 6 });
    return news.data.map(mapNewsSummaryToArticle);
  } catch (error) {
    console.error("Failed to fetch homepage publications:", error);
    return [];
  }
}, ["home-publication-articles"], { revalidate: 300, tags: ["news"] });

async function HomeContent() {
  const publicationArticles = await getPublicationArticles();

  return (
    <div className="relative">
      <BackgroundPattern />

      <HeroSection />

      <OurPartnerSection />
      <BenefitSection />
      <PublicationSection articles={publicationArticles} />
      <TestimonialSection />
      <OurTeamList />
      <CtaSection />
    </div>
  );
}

export default HomeContent;
