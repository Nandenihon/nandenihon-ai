import React from "react";
import Image from "next/image";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import { TeamCard } from "@/components/shared/TeamCard";
import { resolveUploadImageUrl } from "@/lib/images";
import type { Metadata } from "next";
import { getLanguage, landingTranslations } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "Kenali Nande Nihon, komunitas belajar bahasa Jepang, beserta founder dan tim di baliknya.",
};

export const dynamic = "force-dynamic";

interface TeamMember {
  id: number;
  full_name: string | null;
  division: string | null;
  motto: string | null;
  photo: string | null;
  instagram: string | null;
}

async function getTeamData(): Promise<TeamMember[]> {
  try {
    const rows = await queryMySQL<RowDataPacket[]>(
      `SELECT id, photo, full_name, division, motto, instagram
       FROM team
       ORDER BY id DESC`,
    );
    return rows as TeamMember[];
  } catch (error) {
    console.error("Gagal mengambil data team:", error);
    return [];
  }
}

type AboutPageProps = {
  searchParams?: Promise<{ lang?: string | string[] }>;
};

type AboutTranslations = (typeof landingTranslations)[keyof typeof landingTranslations]["about"];
type TeamGroup = { key: string; title: string; members: TeamMember[] };

// Known divisions, in display order. Anything else keeps its own name and follows alphabetically;
// members without a division come last.
const KNOWN_DIVISIONS = [
  { key: "founder", pattern: /founder/i },
  { key: "admin", pattern: /admin|data/i },
  { key: "research", pattern: /research|riset|journal|jurnal/i },
  { key: "media", pattern: /media|communication|komunikasi/i },
] as const;

function groupTeamMembers(members: TeamMember[], t: AboutTranslations): TeamGroup[] {
  const groups = new Map<string, TeamGroup>();
  for (const member of members) {
    const division = member.division?.trim() || "";
    const known = division ? KNOWN_DIVISIONS.find((d) => d.pattern.test(division)) : undefined;
    const key = known?.key ?? (division ? `custom:${division.toLowerCase()}` : "other");
    const title =
      known?.key === "founder" ? t.foundersTitle
      : known ? t.divisionTitles[known.key as keyof typeof t.divisionTitles]
      : division || t.divisionTitles.other;
    if (!groups.has(key)) groups.set(key, { key, title, members: [] });
    groups.get(key)!.members.push(member);
  }
  const rank = (key: string) => {
    const index = KNOWN_DIVISIONS.findIndex((d) => d.key === key);
    return index >= 0 ? index : key === "other" ? 99 : 50;
  };
  return [...groups.values()].sort((a, b) => rank(a.key) - rank(b.key) || a.title.localeCompare(b.title));
}

export default async function AboutPage({ searchParams }: AboutPageProps) {
  const params = await searchParams;
  const language = getLanguage(params?.lang);
  const t = landingTranslations[language].about;
  const teamMembers = await getTeamData();
  const teamGroups = groupTeamMembers(teamMembers, t);

  return (
    <div className="relative pb-24 font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto pt-32 lg:pt-48 px-6 text-center">
        <h1 className="font-bold text-[36px] lg:text-[48px] leading-tight text-[#1A1A1A]">
          {t.titlePrefix}{" "}
          <span className="text-primary-base">Nande Nihon</span>
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-16 lg:mt-24 relative">
        <div className="absolute z-0 -right-16 lg:-right-31 top-[-50px] w-[600px] lg:w-[700px] pointer-events-none">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 682 583"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="-5.17261"
              y="87.418"
              width="665.292"
              height="566.027"
              rx="40"
              transform="rotate(-8 -5.17261 87.418)"
              fill="#FDDCEE"
            />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16 relative z-20">
            <h2 className="font-bold text-[28px] lg:text-[36px] text-[#1A1A1A] mb-4">
              {t.whyTitle}
            </h2>
            <p className="text-gray-500 italic text-sm lg:text-[15px] leading-relaxed">
              {t.whyDescription}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">
            <div className="w-full lg:w-1/2 relative z-20">
              <div className="space-y-4 text-gray-700 text-sm lg:text-[15px] leading-relaxed text-justify">
                {t.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative z-10 flex justify-center lg:justify-start -mt-20">
              <div className="relative w-[90%] max-w-[503px] aspect-[503/453] bg-[#ffde72] rounded-[40px] overflow-hidden shadow-xl rotate-[2deg]">
                <Image
                  src="/images/Rectangle 6.png"
                  alt={t.imageAlt}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-32 relative z-10">
        {teamGroups.length === 0 ? (
          <p className="text-center text-gray-400 font-medium italic">{t.teamEmpty}</p>
        ) : (
          teamGroups.map((group, index) => (
            <section key={group.key} className="mb-20" aria-labelledby={`team-group-${index}`}>
              <h2 id={`team-group-${index}`} className="font-bold text-[28px] lg:text-[36px] text-center mb-10 text-[#1A1A1A]">
                {group.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                {group.members.map((member) => (
                  <TeamCard
                    key={member.id}
                    name={member.full_name || t.fallbackName}
                    role={member.division || t.fallbackRole}
                    description={member.motto || t.fallbackMotto}
                    imageSrc={resolveUploadImageUrl(member.photo)}
                    instagram={member.instagram}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
