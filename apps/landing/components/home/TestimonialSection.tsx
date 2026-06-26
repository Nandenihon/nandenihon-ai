import { queryMySQL, type RowDataPacket } from "@repo/database";
import type { Testimony } from "@repo/types";

const UPLOAD_BASE_URL =
  process.env.NEXT_PUBLIC_UPLOAD_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://nandenihon.com";

async function getTestimonies(): Promise<Testimony[]> {
  try {
    const rows = await queryMySQL<RowDataPacket[]>(
      "SELECT id, photo, nickname, email, age, testimonial_text FROM testimony ORDER BY id DESC LIMIT 10"
    );

    return rows as Testimony[];
  } catch (error) {
    console.error("Failed to fetch testimonies:", error);
    return [];
  }
}

function resolvePhotoUrl(photo: string | null, fallbackId: number, index: number): string {
  if (!photo) {
    return `https://i.pravatar.cc/300?u=${fallbackId || index}`;
  }

  if (photo.startsWith("http://") || photo.startsWith("https://")) {
    return photo;
  }

  return `${UPLOAD_BASE_URL}${photo.startsWith("/") ? photo : `/${photo}`}`;
}

async function TestimonialSection() {
  const testimonies = await getTestimonies();

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
                  src={resolvePhotoUrl(item.photo, item.id, id)}
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
