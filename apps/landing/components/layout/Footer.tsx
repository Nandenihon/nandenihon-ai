import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, Instagram } from "lucide-react";
import FormInput from "../ui/FormInput";

const links = [
  { title: "Home", href: "/" },
  { title: "Tentang", href: "/about" },
  { title: "Kelas", href: "/class" },
  { title: "Artikel", href: "/article/" },
  { title: "Kontak", href: "/contact" },
];

function NewFooter() {
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
              <h3 className="mt-2 text-xl font-bold">
                Temukan Dunia Jepang Bersama Kami
              </h3>
              <div className="mt-10 py-2 space-x-4 border-t-2 border-primary-base">
                {links.map((link) => (
                  <Link
                    key={link.title}
                    href={link.href}
                    className="sm:text-lg text-base text-gray-900"
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
            </div>
            <div className="lg:w-[320px] w-full">
              <h3 className="text-2xl font-bold text-gray-900">Kontak Kami</h3>
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-6 h-6 text-primary-base" />
                  <p className="text-lg font-semibold">
                    Nandenihon6@gmail.com
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-6 h-6 text-primary-base" />
                  <p className="text-lg font-semibold">+62 812-9923-6462</p>
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="w-6 h-6 text-primary-base" />
                  <p className="text-lg font-semibold">@nandenihon</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-15 lg:w-150 flex items-end gap-5 mx-auto">
            <FormInput
              icon={<Mail className="w-5 h-5 text-primary-base" />}
              label="Tetap Terhubung"
              placeholder="Masukan Email Anda disini"
            />
            <button className="btn bg-white border border-primary-base text-primary-base">
              Subscribe
            </button>
          </div>
        </div>
      </div>
      <div className="py-4 text-center bg-primary-base">
        <p className="lg:text-lg text-base font-bold text-white">
          © 2025 Nande Nihon. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default NewFooter;
