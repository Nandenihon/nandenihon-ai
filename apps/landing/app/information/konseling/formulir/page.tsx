import KonselingForm from "@/components/information/KonselingForm";
import { getLanguage, landingTranslations } from "@/lib/i18n";

type KonselingFormPageProps = {
  searchParams?: Promise<{ lang?: string | string[] }>;
};

export default async function KonselingPage({ searchParams }: KonselingFormPageProps) {
  const params = await searchParams;
  const language = getLanguage(params?.lang);

  return <KonselingForm t={landingTranslations[language].konselingPage.form} />;
}
