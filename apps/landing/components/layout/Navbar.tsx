"use client";

import {
  getLanguage,
  homeTranslations,
  languages,
  type Language,
} from "@/lib/i18n";
import { Wa } from "@repo/ui";
import { ChevronDown, MenuIcon, MessageCircle, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function withLanguage(href: string, language: Language) {
  return language === "id" ? href : `${href}?lang=${language}`;
}

export default function NewNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isInformationOpen, setIsInformationOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const language = getLanguage(searchParams.get("lang"));
  const currentLanguage =
    languages.find((item) => item.code === language) ?? languages[0];
  const t = homeTranslations[language].nav;

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    setIsLanguageOpen(false);
    setIsInformationOpen(false);
  }, [pathname, searchParams]);

  const navLinks = [
    { name: t.home, href: "/" },
    { name: t.about, href: "/about" },
    { name: t.class, href: "/class" },
    { name: t.article, href: "/article/" },
    {
      name: t.information,
      href: "/information",
      children: [
        { name: t.counseling, href: "/information" },
        { name: t.merchandise, href: "/merchandise" },
        { name: t.gallery, href: "/gallery" },
      ],
    },
    { name: t.contact, href: "/contact" },
  ];

  const languageHref = (nextLanguage: Language) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextLanguage === "id") {
      params.delete("lang");
    } else {
      params.set("lang", nextLanguage);
    }
    const query = params.toString();

    return query ? `${pathname}?${query}` : pathname;
  };

  const LanguageSwitcher = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className="relative"
      aria-label={t.language}
    >
      <button
        type="button"
        onClick={() => setIsLanguageOpen((open) => !open)}
        className={`flex items-center gap-2 rounded-lg border border-primary-base/20 bg-white/80 font-bold text-gray-700 shadow-sm transition-colors hover:text-primary-base ${mobile ? "px-3 py-2 text-sm" : "px-3 py-2 text-xs"
          }`}
        aria-expanded={isLanguageOpen}
        aria-haspopup="menu"
      >
        <Image
          src={currentLanguage.flagSrc}
          alt=""
          width={30}
          height={20}
          className="h-5 w-8 rounded-sm object-cover"
          aria-hidden="true"
        />
        <span>{currentLanguage.shortLabel}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isLanguageOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {isLanguageOpen && (
        <div
          className={`absolute z-70 mt-2 min-w-40 overflow-hidden rounded-lg border border-primary-base/15 bg-white py-1 shadow-lg ${mobile ? "right-0" : "left-0"
            }`}
          role="menu"
        >
          {languages.map((item) => (
            <Link
              key={item.code}
              href={languageHref(item.code)}
              onClick={() => {
                setIsLanguageOpen(false);
                if (mobile) setIsOpen(false);
              }}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold transition-colors ${language === item.code
                ? "bg-primary-base/10 text-primary-base"
                : "text-gray-700 hover:bg-gray-50 hover:text-primary-base"
                }`}
              aria-label={item.label}
              role="menuitem"
            >
              <Image
                src={item.flagSrc}
                alt=""
                width={30}
                height={20}
                className="h-5 w-8 rounded-sm object-cover"
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <nav className="w-full fixed top-10 right-0 left-0 z-50 px-6 lg:px-10 flex justify-center">
        <div className="bg-white/50 backdrop-blur-lg border border-white/20 shadow-sm/5 rounded-full px-6 py-5 flex items-center justify-between w-full max-w-7xl">
          <Link
            href={withLanguage("/", language)}
            className="flex items-center gap-2"
          >
            <div className="relative h-10 w-32">
              <Image
                src="/images/logo-nandenihon.png"
                alt="Nande Nihon Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const hasChildren = "children" in link && link.children;
              const isActive = hasChildren
                ? link.children.some((child) => pathname.startsWith(child.href))
                : pathname === link.href;

              if (hasChildren) {
                return (
                  <div key={link.name} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsInformationOpen((open) => !open)}
                      className={`flex items-center gap-1 transition-colors ${isActive
                        ? "text-primary-base font-bold border-b-2"
                        : "text-gray-600 hover:text-primary-base font-medium text-sm nav-link-hover"
                        }`}
                      aria-expanded={isInformationOpen}
                      aria-haspopup="menu"
                    >
                      {link.name}
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${isInformationOpen ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    {isInformationOpen && (
                      <div
                        className="absolute left-0 top-full z-70 mt-4 min-w-48 overflow-hidden rounded-2xl border border-primary-base/15 bg-white py-2 shadow-[0_18px_45px_rgba(38,70,130,0.16)]"
                        role="menu"
                      >
                        {link.children.map((child) => {
                          const childActive = pathname.startsWith(child.href);

                          return (
                            <Link
                              key={child.href}
                              href={withLanguage(child.href, language)}
                              onClick={() => setIsInformationOpen(false)}
                              className={`block px-4 py-2.5 text-sm font-semibold transition-colors ${childActive
                                ? "bg-primary-10 text-primary-base"
                                : "text-gray-700 hover:bg-primary-10 hover:text-primary-base"
                                }`}
                              role="menuitem"
                            >
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.name}
                  href={withLanguage(link.href, language)}
                  className={`flex items-center gap-1 transition-colors ${isActive
                    ? "text-primary-base font-bold border-b-2"
                    : "text-gray-600 hover:text-primary-base font-medium text-sm nav-link-hover"
                    }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="lg:flex hidden items-center">
            <div className="mr-3">
              <LanguageSwitcher />
            </div>
            <a
              href="https://wa.me/6281299236462"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-base hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-transform hover:scale-105 shadow-md shadow-blue-500/20"
            >
              <Wa colorMode="white" className="w-5 h-5" />
              <span>{t.contactUs}</span>
            </a>
          </div>
          <button onClick={() => setIsOpen(true)} className="lg:hidden block">
            <MenuIcon />
          </button>
        </div>
      </nav>

      {isOpen && (
        <div className="fixed inset-0 z-60 bg-black/30 backdrop-blur-sm flex justify-end">
          <div className="bg-white/90 backdrop-blur-md w-full h-screen p-6 flex flex-col items-end animate-in slide-in-from-right duration-300">
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 mb-8 text-black"
            >
              <X size={32} />
            </button>

            <div className="flex flex-col items-end gap-8 w-full px-4">
              {navLinks.map((link) => {
                const hasChildren = "children" in link && link.children;

                if (hasChildren) {
                  return (
                    <div key={link.name} className="flex flex-col items-end gap-3">
                      <div className="text-gray-700 font-bold text-lg flex items-center gap-2">
                        {link.name}
                        <ChevronDown size={20} />
                      </div>
                      <div className="flex flex-col items-end gap-3 pr-3">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={withLanguage(child.href, language)}
                            onClick={() => setIsOpen(false)}
                            className={`text-gray-600 hover:text-primary-base font-medium text-base ${pathname.startsWith(child.href)
                              ? "text-primary-base font-bold underline"
                              : ""
                              }`}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={link.name} className="flex flex-col items-end">
                    <Link
                      href={withLanguage(link.href, language)}
                      onClick={() => setIsOpen(false)}
                      className={`text-gray-700 hover:text-primary-base font-medium text-lg flex items-center gap-2 ${pathname === link.href
                        ? "text-primary-base font-bold underline"
                        : ""
                        }`}
                    >
                      {link.name}
                    </Link>
                  </div>
                );
              })}

              <div className="flex flex-col items-end gap-4">
                <LanguageSwitcher mobile />
                <a
                  href="https://wa.me/6281299236462"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary-base hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-transform hover:scale-105 shadow-md shadow-blue-500/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t.contactUs}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
