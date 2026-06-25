import React from "react";
import { Mail, Instagram, Twitter } from "lucide-react";

function TeamCard({ item }: { item: any }) {
  return (
    <div className="p-5 flex-none w-65 h-135 bg-white shadow-[0_0_20px_2px_#0000001A] border border-[#F0F0F0] rounded-full">
      <img
        src={item.photo}
        alt={item.nama}
        className="mx-auto h-62.5 w-62.5 object-cover rounded-full aspect-square"
      />

      <div className="text-center mt-2">
        <h3 className="lg:text-2xl text-xl font-semibold">{item.nama}</h3>
        <label className="lg:text-xl text-lg font-medium mt-3 text-gray-700 block">
          {item.jabatan}
        </label>
        <p className="lg:text-base text-sm text-gray-500 mt-2 text-wrap">
          Belajar bahasa Jepang itu kayak ramen kadang rumit, tapi nagih!
        </p>
      </div>

      <div className="flex justify-center items-center gap-4 mt-10">
        <a href="#"><Mail className="w-6 h-6 text-gray-900" /></a>
        <a href="#"><Instagram className="w-6 h-6 text-gray-900" /></a>
        <a href="#"><Twitter className="w-6 h-6 text-gray-900" /></a>
      </div>
    </div>
  );
}

function OurTeamList() {
  const team = {
    id: 26,
    photo:
      "https://bpzeveffsxawqdbojkfu.supabase.co/storage/v1/object/public/Nande%20Nihon/team%20nande/1760018294448-Yuka.JPG",
    nama: "Yuka",
    jabatan: "Riset & jurnalis",
    moto: "To earn more is to give more",
    email: "",
    instagram: "yukaalanaya",
  };

  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        <h2 className="lg:text-4xl text-2xl font-bold text-center text-gray-900 mb-10">
          Temui Tim Kami
        </h2>
      </div>

      <div className="overflow-hidden relative mt-20">
        <div className="flex gap-12 whitespace-nowrap animate-marquee-right py-5">
          {Array(10)
            .fill(team)
            .map((item, idx) => (
              <TeamCard key={idx} item={item} />
            ))}
        </div>
      </div>
    </div>
  );
}

export default OurTeamList;
