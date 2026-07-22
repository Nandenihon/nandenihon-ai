import React from "react";
import type { LandingTranslations } from "@/lib/i18n";

type StepsSectionProps = {
  t: LandingTranslations["informationPage"]["steps"];
};

function StepsSection({ t }: StepsSectionProps) {
  return (
    <section className="py-16 px-6 lg:px-16 mx-auto max-w-7xl">
      <div
        className="relative rounded-[32px] overflow-hidden px-10 py-14"
        style={{
          background:
            "linear-gradient(to right, #2D3CB0 10%, #2D3CB0 25%, #7B5BA8 35%, #9B6B9A 65%, #2D3CB0 100%)",
        }}
      >
        <h2 className="text-white font-bold text-xl lg:text-2xl mb-10">
          {t.title}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {t.items.map((step) => (
            <div key={step.number}>
              <div
                className="font-bold text-lg w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-[#3B5FC0]"
                style={{ backgroundColor: "#D3E0FB" }}
              >
                {step.number}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                {step.title}
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StepsSection;
