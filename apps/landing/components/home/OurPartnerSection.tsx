"use client";
import React from "react";
import Image from "next/image";

const partners = [
  { name: "DHL", src: "/images/partner/dhl.png" },
  { name: "UPS", src: "/images/partner/ups.png" },
  { name: "India Post", src: "/images/partner/india-pos.png" },
  { name: "USPS", src: "/images/partner/us-pos.png" },
  { name: "FedEx", src: "/images/partner/feedex.png" },
  { name: "Bring", src: "/images/partner/bring.png" },
];

const PartnerItem = ({ name, src }: { name: string; src: string }) => (
  <div className="flex items-center flex-none">
    <img
      src={src}
      alt={name}
      className="object-contain opacity-80 h-15 hover:opacity-100 transition"
    />
  </div>
);

// duplikasi data untuk marquee
const duplicated = (list: typeof partners) => [...list, ...list];

export const OurPartnerSection = () => {
  return (
    <div className="py-32 mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        <h2 className="lg:text-4xl  text-2xl font-bold text-center text-gray-900 mb-10">
          Our Partner
        </h2>
      </div>

      <div className="overflow-hidden relative mt-20">
        <div className="flex gap-12 whitespace-nowrap animate-marquee-left">
          {duplicated(partners).map((item, idx) => (
            <PartnerItem key={idx} name={item.name} src={item.src} />
          ))}
        </div>
      </div>
    </div>
  );
};
