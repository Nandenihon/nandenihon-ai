import React from "react";
import { GraduationCap, MessageCircleHeart } from "lucide-react";

function CtaSection() {
  return (
    <div className="bg-[#FEF6DB]">
      <div className="py-15 px-6 mx-auto max-w-7xl flex flex-col lg:flex-row justify-between items-center gap-10 lg:gap-0">
        <div className="text-left">
          <h1 className="leading-[48px] text-xl lg:text-[32px] font-bold">
            Mulai Belajar Hari Ini Biar Jepang Nggak Cuma
            <br className="hidden lg:block" /> Sebatas Mimpi!
          </h1>
          <p className="text-base lg:text-lg text-gray-600 mt-6 leading-6">
            Berangkat dari mimpi sederhana bersama Nande Nihon. Kamu nggak
            belajar sendirian. Kamu bakalan belajar dalam lingkungan yang
            suportif, responsif, dan kooperatif. Sudah sampai sini, kan?
            Sekarang, ambil aksi pertama dan biarkan Nande Nihon membantumu
            mewujudkannya!
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full lg:w-auto">
          <button className="btn justify-center w-full sm:w-auto text-nowrap">
            <GraduationCap className="w-6 h-6" />
            Gabung Sekarang
          </button>
          <button className="bg-white text-primary-base border-primary-base border btn justify-center w-full sm:w-auto">
            <MessageCircleHeart className="w-6 h-6" />
            Konsultasi Gratis
          </button>
        </div>
      </div>
    </div>
  );
}

export default CtaSection;
