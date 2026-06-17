"use client";

import { Wa } from "@repo/ui";
import { ChevronDown, MenuIcon, MessageCircle, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function NewNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Tentang", href: "/about" },
    { name: "Kelas", href: "/class" },
    { name: "Artikel", href: "/article/" },
    { name: "Informasi", href: "/information", hasDropdown: true },
    { name: "Kontak", href: "/contact" },
  ];

  return (
    <>
      <nav className="w-full fixed top-10 right-0 left-0 z-50 px-6 lg:px-10 flex justify-center">
        <div className="bg-white/50 backdrop-blur-lg border border-white/20 shadow-sm/5 rounded-full px-6 py-5 flex items-center justify-between w-full max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
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
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-1 transition-colors ${isActive
                      ? "text-primary-base font-bold border-b-2"
                      : "text-gray-600 hover:text-primary-base font-medium text-sm"
                    }`}
                >
                  {link.name}
                  {link.hasDropdown && <ChevronDown size={16} />}
                </Link>
              );
            })}
          </div>

          <div className="lg:flex hidden">
            <a
              href="https://wa.me/6281299236462"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-base hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-transform hover:scale-105 shadow-md shadow-blue-500/20"
            >
              <Wa colorMode="white" className="w-5 h-5" />
              <span>Hubungi Kami</span>
            </a>
          </div>
          <button onClick={() => setIsOpen(true)} className="lg:hidden block">
            <MenuIcon />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
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
              {navLinks.map((link) => (
                <div key={link.name} className="flex flex-col items-end">
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-gray-700 hover:text-primary-base font-medium text-lg flex items-center gap-2 ${link.name === "Home"
                        ? "text-primary-base font-bold underline"
                        : ""
                      }`}
                  >
                    {link.name}
                    {link.hasDropdown && <ChevronDown size={20} />}
                  </Link>
                </div>
              ))}

              <div>
                <a
                  href="https://wa.me/6281299236462"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary-base hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-transform hover:scale-105 shadow-md shadow-blue-500/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Hubungi Kami</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
