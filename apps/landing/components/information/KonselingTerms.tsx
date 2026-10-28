"use client";

import { useState } from "react";
import Link from "next/link";
import type { LandingTranslations } from "@/lib/i18n";
import { renderEmphasis } from "@/lib/emphasis";

type KonselingTermsProps = {
  t: LandingTranslations["konselingPage"]["terms"];
  formHref: string;
};

const glassCard = { backgroundColor: "rgba(255,255,255,0.6)", backdropFilter: "blur(6px)" } as const;

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

export default function KonselingTerms({ t, formHref }: KonselingTermsProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div
      className="min-h-screen pt-28 lg:pt-48 pb-24 px-4 sm:px-6 relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/vector-hero.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "cover",
        backgroundPosition: "left top",
        backgroundColor: "#ffffff",
      }}
    >
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="w-full rounded-2xl mb-8 px-6 sm:px-8 py-7" style={glassCard}>
          <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-800 tracking-widest uppercase text-balance [word-break:auto-phrase]">
            {t.title}
          </h1>
        </div>

        <div className="w-full rounded-2xl border-l-[6px] border-[#F59E0B] p-6 sm:p-8 mb-6" style={{ backgroundColor: "#FDE7C2" }}>
          {t.notice.map((line, index) => (
            <p key={line} className={`text-gray-700 text-sm leading-relaxed ${index > 0 ? "mt-1" : ""}`}>
              {line}
            </p>
          ))}
        </div>

        <div className="w-full rounded-2xl p-6 sm:p-8 mb-6" style={glassCard}>
          <div className="text-gray-700 text-sm leading-relaxed space-y-5">
            <p>{renderEmphasis(t.consentIntro)}</p>
            <div>
              <p>{t.understandIntro}</p>
              <ol className="mt-2 list-decimal space-y-2 pl-6">
                {t.points.map((point) => (
                  <li key={point}>{renderEmphasis(point)}</li>
                ))}
              </ol>
            </div>
            <p>{renderEmphasis(t.closing)}</p>
          </div>
        </div>

        <div className="w-full rounded-2xl px-6 py-4 mb-8 flex items-center gap-3" style={glassCard}>
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            autoComplete="off"
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 rounded border-gray-400 accent-[#2563EB] cursor-pointer flex-shrink-0"
          />
          <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer select-none">
            {renderEmphasis(t.agreeLabel)}
          </label>
        </div>

        <div className="flex justify-center">
          {agreed ? (
            <Link
              href={formHref}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-20 py-3 rounded-lg font-semibold text-white bg-[#2563EB] hover:bg-blue-700 transition-colors duration-200 shadow-md"
            >
              {t.continue}
              <ArrowIcon />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-20 py-3 rounded-lg font-semibold text-white bg-[#B3B3B3] cursor-not-allowed"
            >
              {t.continue}
              <ArrowIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
