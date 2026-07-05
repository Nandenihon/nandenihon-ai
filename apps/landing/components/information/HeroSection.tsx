import React from "react";
import Link from "next/link";
import StarTag from "../../../../packages/ui/src/icons/StarTag";
import {
  defaultLanguage,
  type LandingTranslations,
  type Language,
} from "@/lib/i18n";

type HeroSectionProps = {
  t: LandingTranslations["informationPage"]["hero"];
  language: Language;
};

function HeroSection({ t, language }: HeroSectionProps) {
  const registerHref =
    language === defaultLanguage
      ? "/information/konseling/register"
      : `/information/konseling/register?lang=${language}`;

  return (
    <div className="relative lg:h-[800px] h-auto w-full bg-[url('/images/bg-class.png')] bg-cover bg-center">
      {" "}
      <div className="relative max-w-7xl z-10 flex flex-col lg:flex-row pt-32 lg:pt-48 pb-16 px-6 lg:px-0 mx-auto lg:justify-between items-start">
        <div className="max-w-xl">
          <div className="bg-primary-20 border-2 border-primary-50 inline-block px-2 py-1.5 rounded-full text-primary-50 font-bold text-sm mb-6">
            <div className="flex space-x-2">
              <StarTag /> <span>{t.badge}</span>
            </div>
          </div>
          <h1 className="lg:text-5xl text-4xl font-bold lg:leading-[68px] leading-[52px]">
            {t.title[0]} <br />
            {t.title[1]}
            <br />
            {t.title[2]}
          </h1>
          <p className="text-lg mt-6">
            {t.description}
          </p>
          <Link
            href={registerHref}
            className="mt-8 inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {t.cta}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        <img
          src={"/images/SECTION.png"}
          alt={t.imageAlt}
          className="hidden lg:block"
        />
      </div>
    </div>
  );
}

export default HeroSection;
