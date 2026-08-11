// ISR is set via revalidate = 300 below; force-dynamic is not needed.

import BenefitSection from "@/components/home/BenefitSection";
import CtaSection from "@/components/home/CtaSection";
import { OurPartnerSection } from "@/components/home/OurPartnerSection";
import OurTeamList from "@/components/home/OurTeamList";
import PublicationSection from "@/components/home/PublicationSection";
import TestimonialSection from "@/components/home/TestimonialSection";
import {
  defaultLanguage,
  getLanguage,
  homeTranslations,
  type HomeTranslations,
  type Language,
} from "@/lib/i18n";
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

function withLanguage(href: string, language: Language) {
  return language === defaultLanguage ? href : `${href}?lang=${language}`;
}

const studentPortalUrl = (
  process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "https://student.nandenihon.com")
).replace(/\/$/, "");

const HeroSection = ({
  t,
  language,
}: {
  t: HomeTranslations["hero"];
  language: Language;
}) => (
  <div className="relative max-w-7xl mx-auto z-10 flex flex-col lg:flex-row items-center justify-between px-6 lg:px-0 pt-48">
    <div className="w-full lg:w-1/2">
      <h1 className="font-bold text-[36px] lg:text-[48px] leading-tight lg:leading-17">
        {t.title}
      </h1>

      <p className="text-base lg:text-lg leading-relaxed mt-4">
        {t.description}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 w-full lg:w-auto">
        <a
          href={`${studentPortalUrl}/register`}
          className="btn btn-shine cta-pulse w-full sm:w-auto justify-center"
        >
          {t.primaryCta}
        </a>
        <Link
          href={withLanguage("/class", language)}
          prefetch={false}
          className="btn btn-shine bg-white text-primary-base border border-primary-base w-full sm:w-auto justify-center"
        >
          {t.secondaryCta}
        </Link>
      </div>
    </div>

    <div className="hidden lg:block animate-float">
      <Image
        src="/images/hero.png"
        alt={t.imageAlt}
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
    const news = await listNewsSummary({ limit: 30 });
    return news.data.map(mapNewsSummaryToArticle);
  } catch (error) {
    console.error("Failed to fetch homepage publications:", error);
    return [];
  }
}, ["home-publication-articles"], { revalidate: 300, tags: ["news"] });

type HomeContentProps = {
  searchParams?: Promise<{ lang?: string | string[] }>;
};

async function HomeContent({ searchParams }: HomeContentProps) {
  const params = await searchParams;
  const language = getLanguage(params?.lang);
  const t = homeTranslations[language];
  const publicationArticles = await getPublicationArticles();

  return (
    <div className="relative">
      <BackgroundPattern />

      <HeroSection t={t.hero} language={language} />

      <div className="reveal"><OurPartnerSection t={t.partners} /></div>
      <div className="reveal"><BenefitSection t={t.benefits} /></div>
      <div className="reveal"><PublicationSection articles={publicationArticles} t={t.publications} /></div>
      <div className="reveal"><TestimonialSection t={t.testimonials} /></div>
      <div className="reveal"><OurTeamList t={t.gallery} /></div>
      <div className="reveal"><CtaSection t={t.cta} language={language} /></div>
    </div>
  );
}

export default HomeContent;
