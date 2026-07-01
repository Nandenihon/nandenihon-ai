import {
  duplicateForMarquee,
  HOME_SECTION_TITLE_CLASS,
  resolveUploadUrl,
} from "@/components/home/shared";
import { queryMySQL, type RowDataPacket } from "@repo/database";
import type { Testimony } from "@repo/types";
import { unstable_cache } from "next/cache";
import Image from "next/image";

type TestimonyCardData = Pick<
  Testimony,
  "id" | "photo" | "nickname" | "age" | "testimonial_text"
>;

type TestimonyRow = RowDataPacket & TestimonyCardData;

const getTestimonies = unstable_cache(async (): Promise<TestimonyCardData[]> => {
  try {
    const rows = await queryMySQL<TestimonyRow[]>(
      "SELECT id, photo, nickname, age, testimonial_text FROM testimony ORDER BY id DESC LIMIT 10",
    );

    return rows.map(({ id, photo, nickname, age, testimonial_text }) => ({
      id,
      photo: photo || null,
      nickname: nickname || null,
      age: age || null,
      testimonial_text: testimonial_text || null,
    }));
  } catch (error) {
    console.error("Failed to fetch testimonies:", error);
    return [];
  }
}, ["home-testimonies"], { revalidate: 300, tags: ["testimonies"] });

const TestimonialCard = ({
  item,
}: {
  item: TestimonyCardData;
}) => {
  const name = item.nickname || "Anonymous";

  return (
    <article className="w-132 flex-none shadow relative">
      <div className="px-5 pt-5 pb-8 bg-white rounded-t-2xl">
        <p className="text-wrap text-gray-600">{item.testimonial_text || ""}</p>
        <Image
          src={resolveUploadUrl(item.photo)}
          className="size-25 object-cover rounded-full border-8 border-white absolute right-5 bottom-4"
          alt={name}
          width={100}
          height={100}
          sizes="100px"
        />
      </div>
      <div className="h-20 bg-[#F0F0F0] rounded-b-2xl px-5 flex justify-center flex-col">
        <h3 className="text-gray-900 font-semibold text-lg">{name}</h3>
        {item.age && (
          <p className="text-gray-600 mt-1 text-sm">{item.age} Tahun</p>
        )}
      </div>
    </article>
  );
};

async function TestimonialSection() {
  const testimonies = await getTestimonies();
  const displayItems = duplicateForMarquee(testimonies);

  return (
    <div className="py-12 bg-[#D3E0FB]">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        <h2 className={`${HOME_SECTION_TITLE_CLASS} text-center mb-10`}>
          Kata Mereka
        </h2>
      </div>
      <div className="overflow-hidden relative mt-20">
        <div className="flex gap-12 whitespace-nowrap animate-marquee-left">
          {displayItems.length > 0 ? (
            displayItems.map((item, index) => (
              <TestimonialCard key={`${item.id}-${index}`} item={item} />
            ))
          ) : (
            <p className="w-full text-center text-gray-500">
              Belum ada testimoni.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TestimonialSection;
