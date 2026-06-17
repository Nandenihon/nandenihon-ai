import React from "react";

function EmailIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <path d="M12 13L2 6L3 4H21L22 6L12 13Z" fill="#9DC1FB" />
      <path
        d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
        stroke="#1A1A1A"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 6L12 13L2 6"
        stroke="#1A1A1A"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.5862 2H7.41382C4.42859 2 2 4.42859 2 7.41382V16.5863C2 19.5714 4.42859 22 7.41382 22H16.5863C19.5714 22 22 19.5714 22 16.5863V7.41382C22 4.42859 19.5714 2 16.5862 2ZM20.8275 16.5863C20.8275 18.9249 18.9249 20.8275 16.5862 20.8275H7.41382C5.0751 20.8275 3.17249 18.9249 3.17249 16.5863V7.41382C3.17249 5.0751 5.0751 3.17249 7.41382 3.17249H16.5863C18.9249 3.17249 20.8275 5.0751 20.8275 7.41382V16.5863Z"
        fill="#1A1A1A"
        stroke="#1A1A1A"
        strokeWidth="0.5"
      />
      <path
        d="M12 7C9.24295 7 7 9.24295 7 12C7 14.7571 9.24295 17 12 17C14.7571 17 17 14.7571 17 12C17 9.24295 14.7571 7 12 7ZM12 15.928C9.8342 15.928 8.07202 14.1659 8.07202 12C8.07202 9.8342 9.8342 8.07202 12 8.07202C14.1659 8.07202 15.928 9.8342 15.928 12C15.928 14.1659 14.1659 15.928 12 15.928Z"
        fill="#1A1A1A"
        stroke="#1A1A1A"
        strokeWidth="0.5"
      />
      <path
        d="M17.4999 5C16.6728 5 16 5.67291 16 6.49993C16 7.32709 16.6728 8 17.4999 8C18.3271 8 19 7.32709 19 6.49993C19 5.67277 18.3271 5 17.4999 5ZM17.4999 6.91152C17.273 6.91152 17.0883 6.72683 17.0883 6.49993C17.0883 6.27289 17.273 6.08833 17.4999 6.08833C17.727 6.08833 17.9117 6.27289 17.9117 6.49993C17.9117 6.72683 17.727 6.91152 17.4999 6.91152Z"
        fill="#1A1A1A"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <path
        d="M13.9979 10.3921L21.8156 1.5H19.963L13.1749 9.22086L7.75324 1.5H1.5L9.69861 13.1753L1.5 22.5H3.35266L10.5211 14.3465L16.2468 22.5H22.5L13.9974 10.3921H13.9979ZM11.4604 13.2782L10.6297 12.1156L4.02019 2.86466H6.86576L12.1997 10.3304L13.0304 11.493L19.9639 21.1974H17.1183L11.4604 13.2786V13.2782Z"
        fill="black"
      />
    </svg>
  );
}

function TeamCard({ item }: { item: any }) {
  return (
    <div className="p-5 flex-none w-65 h-135 bg-white shadow-[0_0_20px_2px_#0000001A] border border-[#F0F0F0] rounded-full">
      <img
        src={item.photo}
        alt={item.nama}
        className="mx-auto h-62.5 w-62.5 object-cover rounded-full aspect-square"
      />

      <div className="text-center mt-2">
        <h3 className="lg:text-2xl  text-xl font-semibold">{item.nama}</h3>
        <label className="lg:text-xl  text-lg font-medium mt-3 text-gray-700 block">
          {item.jabatan}
        </label>
        <p className="lg:text-base  text-sm text-gray-500 mt-2 text-wrap">
          Belajar bahasa Jepang itu kayak ramen kadang rumit, tapi nagih!
        </p>
      </div>

      <div className="flex justify-center items-center gap-4 mt-10">
        <a href="#">
          <EmailIcon />
        </a>
        <a href="#">
          <InstagramIcon />
        </a>
        <a href="#">
          <XIcon />
        </a>
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
        <h2 className="lg:text-4xl  text-2xl font-bold text-center text-gray-900 mb-10">
          Temui Tim Kami
        </h2>
      </div>

      <div className="overflow-hidden relative mt-20">
        <div className="flex gap-12 whitespace-nowrap animate-marquee-right py-5">
          {Array(20)
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
