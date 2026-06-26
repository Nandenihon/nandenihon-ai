import React from "react";
import { Mail, Instagram, Twitter } from "lucide-react";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import type { Team } from "@repo/types";

const UPLOAD_BASE_URL =
  process.env.NEXT_PUBLIC_UPLOAD_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://nandenihon.com";

function resolvePhotoUrl(photo: string | null, fallbackId: number, index: number): string {
  if (!photo) {
    return `https://i.pravatar.cc/300?u=team-${fallbackId || index}`;
  }

  if (photo.startsWith("http://") || photo.startsWith("https://")) {
    return photo;
  }

  return `${UPLOAD_BASE_URL}${photo.startsWith("/") ? photo : `/${photo}`}`;
}

function resolveInstagramUrl(instagram: string | null): string {
  if (!instagram) return "#";
  if (instagram.startsWith("http://") || instagram.startsWith("https://")) {
    return instagram;
  }

  return `https://instagram.com/${instagram.replace(/^@/, "")}`;
}

async function getTeam(): Promise<Team[]> {
  try {
    const rows = await queryMySQL<RowDataPacket[]>(
      `SELECT id, photo, full_name, email, division, motto, instagram
       FROM team
       ORDER BY id DESC
       LIMIT 10`,
    );

    return rows as Team[];
  } catch (error) {
    console.error("Failed to fetch team:", error);
    return [];
  }
}

function TeamCard({ item, index }: { item: Team; index: number }) {
  const name = item.full_name || "Nama Tim";
  const role = item.division || "Tim Nande Nihon";
  const motto =
    item.motto || "Belajar bahasa Jepang itu kayak ramen kadang rumit, tapi nagih!";

  return (
    <div className="p-5 flex-none w-65 h-135 bg-white shadow-[0_0_20px_2px_#0000001A] border border-[#F0F0F0] rounded-full">
      <img
        src={resolvePhotoUrl(item.photo, item.id, index)}
        alt={name}
        className="mx-auto h-62.5 w-62.5 object-cover rounded-full aspect-square"
      />

      <div className="text-center mt-2">
        <h3 className="lg:text-2xl text-xl font-semibold">{name}</h3>
        <label className="lg:text-xl text-lg font-medium mt-3 text-gray-700 block">
          {role}
        </label>
        <p className="lg:text-base text-sm text-gray-500 mt-2 text-wrap">
          {motto}
        </p>
      </div>

      <div className="flex justify-center items-center gap-4 mt-10">
        <a href={item.email ? `mailto:${item.email}` : "#"} aria-label={`Email ${name}`}>
          <Mail className="w-6 h-6 text-gray-900" />
        </a>
        <a href={resolveInstagramUrl(item.instagram)} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${name}`}>
          <Instagram className="w-6 h-6 text-gray-900" />
        </a>
        <a href="#" aria-label={`Twitter ${name}`}>
          <Twitter className="w-6 h-6 text-gray-900" />
        </a>
      </div>
    </div>
  );
}

async function OurTeamList() {
  const team = await getTeam();
  const displayItems = team.length > 0 ? [...team, ...team] : [];

  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        <h2 className="lg:text-4xl text-2xl font-bold text-center text-gray-900 mb-10">
          Temui Tim Kami
        </h2>
      </div>

      <div className="overflow-hidden relative mt-20">
        <div className="flex gap-12 whitespace-nowrap animate-marquee-right py-5">
          {displayItems.length > 0 ? (
            displayItems.map((item, index) => (
              <TeamCard key={`${item.id}-${index}`} item={item} index={index} />
            ))
          ) : (
            <p className="w-full text-center text-gray-400 font-medium italic">
              Data tim belum tersedia.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default OurTeamList;
