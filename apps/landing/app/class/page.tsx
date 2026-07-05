import FeaturedClass from "@/components/class/FeaturedClass";
import FeaturedWebinar from "@/components/class/FeaturedWebinar";
import HeroSection from "@/components/class/HeroSection";
import CtaSection from "@/components/home/CtaSection";
import { getLanguage, landingTranslations } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type ClassPageProps = {
  searchParams?: Promise<{ lang?: string | string[] }>;
};

export default async function ClassPage({ searchParams }: ClassPageProps) {
  const params = await searchParams;
  const language = getLanguage(params?.lang);
  const t = landingTranslations[language];

  return (
    <div className="bg-[#FBFCFF]">
      <HeroSection t={t.classPage.hero} />
      <FeaturedClass t={t.classPage.classes} />
      <FeaturedWebinar t={t.classPage.webinars} />
      <CtaSection t={t.cta} language={language} />
    </div>
  );
}
