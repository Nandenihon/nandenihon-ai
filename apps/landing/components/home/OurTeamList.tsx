import {
  duplicateForMarquee,
  HOME_SECTION_TITLE_CLASS,
  resolveUploadUrl,
} from "@/components/home/shared";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import type { Team } from "@repo/types";
import { Instagram, Mail } from "lucide-react";
import { unstable_cache } from "next/cache";
import Image from "next/image";

type TeamCardData = Pick<
  Team,
  "id" | "photo" | "full_name" | "email" | "division" | "motto" | "instagram"
>;

type TeamRow = RowDataPacket & TeamCardData;

function resolveInstagramUrl(instagram: string | null): string {
  if (!instagram) return "#";
  if (instagram.startsWith("http://") || instagram.startsWith("https://")) {
    return instagram;
  }

  return `https://instagram.com/${instagram.replace(/^@/, "")}`;
}

const getTeam = unstable_cache(async (): Promise<TeamCardData[]> => {
  try {
    const rows = await queryMySQL<TeamRow[]>(
      `SELECT id, photo, full_name, email, division, motto, instagram
       FROM team
       ORDER BY id DESC
       LIMIT 10`,
    );

    return rows.map(
      ({ id, photo, full_name, email, division, motto, instagram }) => ({
        id,
        photo: photo || null,
        full_name: full_name || null,
        email: email || null,
        division: division || null,
        motto: motto || null,
        instagram: instagram || null,
      }),
    );
  } catch (error) {
    console.error("Failed to fetch team:", error);
    return [];
  }
}, ["home-team"], { revalidate: 300, tags: ["team"] });

function TeamCard({ item }: { item: TeamCardData }) {
  const name = item.full_name || "Nama Tim";
  const role = item.division || "Tim Nande Nihon";
  const motto =
    item.motto || "Belajar bahasa Jepang itu kayak ramen kadang rumit, tapi nagih!";
  const instagramHref = item.instagram ? resolveInstagramUrl(item.instagram) : null;

  return (
    <article className="p-5 flex-none w-65 h-135 bg-white shadow-[0_0_20px_2px_#0000001A] border border-[#F0F0F0] rounded-full">
      <Image
        src={resolveUploadUrl(item.photo)}
        alt={name}
        className="mx-auto h-62.5 w-62.5 object-cover rounded-full aspect-square"
        width={250}
        height={250}
        sizes="250px"
      />

      <div className="text-center mt-2">
        <h3 className="lg:text-2xl text-xl font-semibold">{name}</h3>
        <p className="lg:text-xl text-lg font-medium mt-3 text-gray-700">
          {role}
        </p>
        <p className="lg:text-base text-sm text-gray-500 mt-2 text-wrap">
          {motto}
        </p>
      </div>

      <div className="flex justify-center items-center gap-4 mt-10">
        {item.email && (
          <a href={`mailto:${item.email}`} aria-label={`Email ${name}`}>
            <Mail className="w-6 h-6 text-gray-900" />
          </a>
        )}
        {instagramHref && (
          <a
            href={instagramHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram ${name}`}
          >
            <Instagram className="w-6 h-6 text-gray-900" />
          </a>
        )}
      </div>
    </article>
  );
}

async function OurTeamList() {
  const team = await getTeam();
  const displayItems = duplicateForMarquee(team);

  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        <h2 className={`${HOME_SECTION_TITLE_CLASS} text-center mb-10`}>
          Temui Tim Kami
        </h2>
      </div>

      <div className="overflow-hidden relative mt-20">
        <div className="flex gap-12 whitespace-nowrap animate-marquee-right py-5">
          {displayItems.length > 0 ? (
            displayItems.map((item, index) => (
              <TeamCard key={`${item.id}-${index}`} item={item} />
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
