import type { LandingTranslations } from "@/lib/i18n";
import React from "react";
import Image from "next/image";
import StarTag from "../../../../packages/ui/src/icons/StarTag";

type HeroSectionProps = {
  t: LandingTranslations["classPage"]["hero"];
};

function HeroSection({ t }: HeroSectionProps) {
  return (
    <div className="relative lg:h-[800px] h-[600px] w-full bg-[url('/images/bg-class.png')] bg-cover bg-center ">
      <div className="relative max-w-7xl z-10 flex pt-58 px-6 lg:px-0 mx-auto justify-between">
        <div>
          <div className="bg-primary-20 border-2 border-primary-50 inline-block px-2 py-1.5 rounded-full text-primary-50 font-bold text-sm mb-6">
            <div className="flex space-x-2">
              <StarTag /> <span>{t.badge}</span>
            </div>
          </div>
          <h1 className="lg:text-5xl text-4xl font-bold lg:eading-[68px] leading-[58px]">
            {t.titleStart}
            <span className="bg-[radial-gradient(50%_50%_at_50%_50%,_#0338AE_59.62%,_#347CEF_82.21%)] bg-clip-text text-transparent">
              {t.titleHighlight}
            </span>
            <br />
            {t.titleEnd}
          </h1>
          <p className="text-lg mt-6">{t.description}</p>
        </div>

        <Image
          src="/images/hero-class.png"
          alt={t.imageAlt}
          width={489}
          height={392}
          className="hidden lg:block"
        />
      </div>
    </div>
  );
}

export default HeroSection;
