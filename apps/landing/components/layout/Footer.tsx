"use client";

import {
  getLanguage,
  homeTranslations,
  type Language,
} from "@/lib/i18n";
import { Instagram, Mail, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import FormInput from "../ui/FormInput";

function withLanguage(href: string, language: Language) {
  return language === "id" ? href : `${href}?lang=${language}`;
}

function NewFooter() {
  const searchParams = useSearchParams();
  const language = getLanguage(searchParams.get("lang"));
  const t = homeTranslations[language];
  const links = [
    { title: t.nav.home, href: "/" },
    { title: t.nav.about, href: "/about" },
    { title: t.nav.class, href: "/class" },
    { title: t.nav.article, href: "/article/" },
    { title: t.nav.contact, href: "/contact" },
  ];

  return (
    <footer>
      <div className="bg-[#A8C1F7] py-15">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex lg:flex-row flex-col lg:justify-between lg:space-y-0 space-y-10">
            <div className="lg:w-95 w-full">
              <div className="relative h-13 w-29">
                <Image
                  src="/images/logo-nandenihon.png"
                  alt="Nande Nihon Logo"
                  fill
                  className="object-contain object-left"
                />
              </div>
              <h3 className="mt-2 text-xl font-bold">{t.footer.tagline}</h3>
              <div className="mt-10 py-2 space-x-4 border-t-2 border-primary-base">
                {links.map((link) => (
                  <Link
                    key={link.title}
                    href={withLanguage(link.href, language)}
                    className="sm:text-lg text-base text-gray-900 nav-link-hover"
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
            </div>
            <div className="lg:w-[320px] w-full">
              <h3 className="text-2xl font-bold text-gray-900">
                {t.footer.contactTitle}
              </h3>
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2 social-pop">
                  <Mail className="w-6 h-6 text-primary-base" />
                  <p className="text-lg font-semibold">
                    Nandenihon6@gmail.com
                  </p>
                </div>
                <div className="flex items-center gap-2 social-pop">
                  <Phone className="w-6 h-6 text-primary-base" />
                  <p className="text-lg font-semibold">+62 812-9923-6462</p>
                </div>
                <div className="flex items-center gap-2 social-pop">
                  <Instagram className="w-6 h-6 text-primary-base" />
                  <p className="text-lg font-semibold">@nandenihon</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-15 lg:w-150 flex items-end gap-5 mx-auto">
            <FormInput
              icon={<Mail className="w-5 h-5 text-primary-base" />}
              label={t.footer.subscribeLabel}
              placeholder={t.footer.subscribePlaceholder}
            />
            <button className="btn bg-white border border-primary-base text-primary-base">
              {t.footer.subscribeButton}
            </button>
          </div>
        </div>
      </div>
      <div className="py-4 text-center bg-primary-base">
        <p className="lg:text-lg text-base font-bold text-white">
          {t.footer.copyright}
        </p>
      </div>
    </footer>
  );
}

export default NewFooter;
