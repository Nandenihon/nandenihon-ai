import {
  duplicateForMarquee,
  HOME_SECTION_TITLE_CLASS,
} from "@/components/home/shared";
import type { HomeTranslations } from "@/lib/i18n";
import Image from "next/image";

type Partner = {
  name: string;
  src: string;
};

const partners = [
  { name: "Arka Learn", src: "/images/partner/arkalearn.png" },
  { name: "Jurnal Post", src: "/images/partner/jurnal-post.jpg" },
  { name: "Meiko Global", src: "/images/partner/meiko-global.png" },
  { name: "Smiling Kids", src: "/images/partner/smiling-kids.png" },
] as const satisfies readonly Partner[];

const partnerItems = duplicateForMarquee(partners);

const PartnerItem = ({ name, src }: Partner) => (
  <div className="flex items-center flex-none">
    <Image
      src={src}
      alt={name}
      width={280}
      height={160}
      sizes="80px"
      className="h-15 w-40 object-contain opacity-80 hover:opacity-100 transition"
    />
  </div>
);

export const OurPartnerSection = ({ t }: { t: HomeTranslations["partners"] }) => {
  return (
    <div className="py-32 mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        <h2 className={`${HOME_SECTION_TITLE_CLASS} text-center mb-10 title-reveal`}>
          {t.title}
        </h2>
      </div>

      <div className="overflow-hidden relative mt-20">
        <div className="flex gap-12 whitespace-nowrap animate-marquee-left">
          {partnerItems.map((item, index) => (
            <PartnerItem
              key={`${item.name}-${index}`}
              name={item.name}
              src={item.src}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
