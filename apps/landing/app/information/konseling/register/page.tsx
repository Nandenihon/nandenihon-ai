import KonselingTerms from "@/components/information/KonselingTerms";
import { defaultLanguage, getLanguage, landingTranslations } from "@/lib/i18n";

type KonselingRegisterPageProps = {
  searchParams?: Promise<{ lang?: string | string[] }>;
};

export default async function KonselingRegisterPage({ searchParams }: KonselingRegisterPageProps) {
  const params = await searchParams;
  const language = getLanguage(params?.lang);
  const formHref =
    language === defaultLanguage ? "/information/konseling/formulir" : `/information/konseling/formulir?lang=${language}`;

  return <KonselingTerms t={landingTranslations[language].konselingPage.terms} formHref={formHref} />;
}
