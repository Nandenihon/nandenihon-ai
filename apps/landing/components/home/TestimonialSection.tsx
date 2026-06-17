"use client";

import React, { useEffect, useState } from "react";
import type { Testimony } from "@repo/types";

function TestimonialSection() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonies() {
      try {
        const res = await fetch("/api/testimony");
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setTestimonies(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch testimonies:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTestimonies();
  }, []);

  // Duplicate items for seamless infinite scroll effect
  const displayItems =
    testimonies.length > 0
      ? [...testimonies, ...testimonies]
      : Array(10).fill({
          id: 0,
          photo: null,
          nickname: "Loading...",
          age: null,
          testimonial_text: "Loading testimonials...",
        });

  return (
    <div className="py-12 bg-[#D3E0FB]">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        <h2 className="lg:text-4xl  text-2xl font-bold text-center text-gray-900 mb-10">
          Kata Mereka
        </h2>
      </div>
      <div className="overflow-hidden relative mt-20">
        <div className="flex gap-12 whitespace-nowrap animate-marquee-left">
          {displayItems.map((item, id) => (
            <div key={id} className="w-132 flex-none shadow relative">
              <div className="px-5 pt-5 pb-8 bg-white rounded-t-2xl">
                <p className="text-wrap text-gray-600">
                  {item.testimonial_text || ""}
                </p>
                <img
                  src={
                    //item.photo || //jika mau mengaktifkan foto dari databse langsung dinyalain aja
                    `https://i.pravatar.cc/300?u=${item.id || id}`
                  }
                  className="size-25 object-cover rounded-full border-8 border-white absolute right-5 bottom-4"
                  alt={item.nickname || "Testimonial"}
                />
              </div>
              <div className="h-20 bg-[#F0F0F0] rounded-b-2xl px-5  flex justify-center flex-col">
                <label className="text-gray-900 font-semibold text-lg">
                  {item.nickname || "Anonymous"}
                </label>
                {item.age && (
                  <label className="text-gray-600 mt-1 text-sm">
                    {item.age} Tahun
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TestimonialSection;
