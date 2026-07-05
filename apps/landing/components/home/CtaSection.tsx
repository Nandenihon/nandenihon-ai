import {
  defaultLanguage,
  homeTranslations,
  type HomeTranslations,
  type Language,
} from "@/lib/i18n";
import { GraduationCap, MessageCircleHeart } from "lucide-react";
import Link from "next/link";

function CtaSection({
  t = homeTranslations.id.cta,
  language = defaultLanguage,
}: {
  t?: HomeTranslations["cta"];
  language?: Language;
}) {
  const withLanguage = (href: string) =>
    language === defaultLanguage ? href : `${href}?lang=${language}`;

  return (
    <div className="bg-[#FEF6DB]">
      <div className="py-15 px-6 mx-auto max-w-7xl flex flex-col lg:flex-row justify-between items-center gap-10 lg:gap-0">
        <div className="text-left">
          <h1 className="leading-[48px] text-xl lg:text-[32px] font-bold">
            {t.title}
          </h1>
          <p className="text-base lg:text-lg text-gray-600 mt-6 leading-6">
            {t.description}
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full lg:w-auto">
          <Link
            href={withLanguage("/class/register")}
            prefetch={false}
            className="btn btn-shine cta-pulse justify-center w-full sm:w-auto text-nowrap"
          >
            <GraduationCap className="w-6 h-6" />
            {t.join}
          </Link>
          <Link
            href={withLanguage("/information/konseling/register")}
            prefetch={false}
            className="bg-white text-primary-base border-primary-base border btn btn-shine justify-center w-full sm:w-auto"
          >
            <MessageCircleHeart className="w-6 h-6" />
            {t.consultation}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CtaSection;
