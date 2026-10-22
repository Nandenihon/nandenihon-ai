import {
  duplicateForMarquee,
  HOME_SECTION_TITLE_CLASS,
  resolveUploadUrl,
} from "@/components/home/shared";
import type { HomeTranslations } from "@/lib/i18n";
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
  t,
}: {
  item: TestimonyCardData;
  t: HomeTranslations["testimonials"];
}) => {
  const name = item.nickname || t.anonymous;

  return (
    // Right margin (not flex gap) keeps both marquee halves the same width, so the loop is seamless.
    <div className="mr-5 flex flex-none sm:mr-10">
      <article className="relative flex w-[82vw] max-w-132 flex-col whitespace-normal rounded-2xl bg-white shadow hover-lift sm:w-132">
        <div className="flex-1 rounded-t-2xl px-5 pb-6 pt-5 sm:px-6">
          <p className="line-clamp-6 text-sm leading-relaxed text-gray-600 sm:text-base">
            {item.testimonial_text || ""}
          </p>
        </div>
        <div className="flex h-20 flex-col justify-center rounded-b-2xl bg-[#F0F0F0] pl-5 pr-28 sm:pl-6 sm:pr-32">
          <h3 className="truncate text-base font-semibold text-gray-900 sm:text-lg">{name}</h3>
          {item.age && (
            <p className="mt-0.5 text-sm text-gray-600">
              {item.age} {t.yearSuffix}
            </p>
          )}
        </div>
        <Image
          src={resolveUploadUrl(item.photo)}
          className="absolute bottom-4 right-4 size-20 rounded-full border-[6px] border-white object-cover sm:right-5 sm:size-24 sm:border-8"
          alt={name}
          width={100}
          height={100}
          sizes="100px"
        />
      </article>
    </div>
  );
};

async function TestimonialSection({ t }: { t: HomeTranslations["testimonials"] }) {
  const testimonies = await getTestimonies();
  const displayItems = duplicateForMarquee(testimonies);

  return (
    <div className="py-12 bg-[#D3E0FB]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className={`${HOME_SECTION_TITLE_CLASS} text-center mb-10 title-reveal`}>
          {t.title}
        </h2>
      </div>
      <div className="relative mt-10 overflow-hidden lg:mt-14">
        <div className={`flex items-stretch py-2 ${displayItems.length > 0 ? "w-max animate-marquee-left" : ""}`}>
          {displayItems.length > 0 ? (
            displayItems.map((item, index) => (
              <TestimonialCard key={`${item.id}-${index}`} item={item} t={t} />
            ))
          ) : (
            <p className="w-full text-center text-gray-500">
              {t.empty}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TestimonialSection;
