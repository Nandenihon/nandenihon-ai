import React from "react";
import Image from "next/image";

interface TeamCardProps {
  name: string;
  role: string;
  description: string;
  imageSrc: string;
  instagramUrl?: string;
  linkedinUrl?: string;
}

export const TeamCard = ({
  name,
  role,
  description,
  imageSrc,
  instagramUrl = "#",
  linkedinUrl = "#",
}: TeamCardProps) => {
  return (
    <div className="flex flex-col group h-full">
      <div className="relative w-full aspect-square rounded-tl-[40px] rounded-br-[40px] overflow-hidden shadow-lg border border-gray-100">
        <Image src={imageSrc} alt={name} fill className="object-cover" />
      </div>

      <div className="bg-[#2563EB] text-white text-sm font-medium p-[12px] rounded-tr-[20px] rounded-bl-[20px] w-[200px] mb-3">
        {role}
      </div>

      <h3 className="font-bold text-base text-[#1A1A1A] mb-1">{name}</h3>

      <p className="text-[#1A1A1A] font-medium text-sm leading-relaxed mb-4 flex-grow">
        {description}
      </p>

      <div className="flex gap-4 items-center">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#94A3B8] hover:text-[#E4405F] transition-colors duration-300"
          aria-label={`${name}'s Instagram`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </a>

        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#94A3B8] hover:text-[#0077B5] transition-colors duration-300"
          aria-label={`${name}'s LinkedIn`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
            <rect x="2" y="9" width="4" height="12"></rect>
            <circle cx="4" cy="4" r="2"></circle>
          </svg>
        </a>
      </div>
    </div>
  );
};
