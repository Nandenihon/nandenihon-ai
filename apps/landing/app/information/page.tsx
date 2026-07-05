import React from "react";
import HeroSection from "@/components/information/HeroSection";
import TopicSection from "@/components/information/TopicSection";
import StepsSection from "@/components/information/StepsSection";
import { getLanguage, landingTranslations } from "@/lib/i18n";

type InformationPageProps = {
  searchParams?: Promise<{ lang?: string | string[] }>;
};

export default async function InformationPage({
  searchParams,
}: InformationPageProps) {
  const params = await searchParams;
  const language = getLanguage(params?.lang);
  const t = landingTranslations[language].informationPage;

  return (
    <main>
      <HeroSection t={t.hero} language={language} />
      <TopicSection t={t.topics} />
      <StepsSection t={t.steps} />
    </main>
  );
}
