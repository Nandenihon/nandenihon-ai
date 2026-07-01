import React from "react";
import Image from "next/image";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import { TeamCard } from "@/components/shared/TeamCard";
import { resolveUploadImageUrl } from "@/lib/images";

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

export default async function AboutPage() {
  const teamMembers = await getTeamData();

  const founders = teamMembers.filter(
    (member) => member.division?.toLowerCase().includes("founder"),
  );

  const adminData = teamMembers.filter(
    (member) =>
      member.division?.toLowerCase().includes("admin") ||
      member.division?.toLowerCase().includes("data"),
  );

  return (
    <div className="relative pb-24 font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto pt-32 lg:pt-48 px-6 text-center">
        <h1 className="font-bold text-[36px] lg:text-[48px] leading-tight text-[#1A1A1A]">
          Eksplorasi Serunya Belajar di{" "}
          <span className="text-primary-base">Nande Nihon</span>
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-0 mt-16 lg:mt-24 relative">
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
              Kenapa Memilih Nande Nihon?
            </h2>
            <p className="text-gray-500 italic text-sm lg:text-[15px] leading-relaxed">
              Didirikan oleh mereka yang berbekal kegigihan, keberanian, dan
              tekad yang telah berhasil mengalahkan keputusasaan, kebingungan,
              dan kesulitan. Kini, giliran kami untuk membantumu.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">
            <div className="w-full lg:w-1/2 relative z-20">
              <div className="space-y-4 text-gray-700 text-sm lg:text-[15px] leading-relaxed text-justify">
                <p>
                  Nande Nihon bukan sekadar lembaga kursus, bukan pula lembaga
                  bahasa yang besar.
                </p>
                <p>
                  Kami adalah teman belajar yang mengerti perjuanganmu.
                  Didirikan oleh orang-orang yang pernah merasakan kebingungan
                  yang sama.
                </p>
                <p>
                  Kami punya sistem belajar yang menyenangkan, terarah, dan
                  didukung dengan suasana yang positif.
                </p>
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative z-10 flex justify-center lg:justify-start -mt-20">
              <div className="relative w-[90%] max-w-[503px] aspect-[503/453] bg-[#ffde72] rounded-[40px] overflow-hidden shadow-xl rotate-[2deg]">
                <Image
                  src="/images/Rectangle 6.png"
                  alt="Ilustrasi"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-0 mt-32 relative z-10">
        <div className="mb-20">
          <h2 className="font-bold text-[28px] lg:text-[36px] text-center mb-10 text-[#1A1A1A]">
            Founder & Co-Founder
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {founders.length > 0 ? (
              founders.map((member) => (
                <TeamCard
                  key={member.id}
                  name={member.full_name || "Nama"}
                  role={member.division || "Founder"}
                  description={member.motto || "Motto belum diisi."}
                  imageSrc={resolveUploadImageUrl(member.photo)}
                  instagramUrl={member.instagram || "#"}
                />
              ))
            ) : (
              <p className="text-center col-span-full text-gray-400 font-medium italic">
                Data Founder belum tersedia.
              </p>
            )}
          </div>
        </div>

        <div className="mb-20">
          <h2 className="font-bold text-[28px] lg:text-[36px] text-center mb-10 text-[#1A1A1A]">
            Admin & Data
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {adminData.length > 0 ? (
              adminData.map((member) => (
                <TeamCard
                  key={member.id}
                  name={member.full_name || "Nama"}
                  role={member.division || "Admin"}
                  description={member.motto || "Motto belum diisi."}
                  imageSrc={resolveUploadImageUrl(member.photo)}
                  instagramUrl={member.instagram || "#"}
                />
              ))
            ) : (
              <p className="text-center col-span-full text-gray-400 font-medium italic">
                Data Admin & Data belum tersedia.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
