import { HOME_SECTION_TITLE_CLASS } from "@/components/home/shared";
import type { HomeTranslations } from "@/lib/i18n";
import Image from "next/image";

type Benefit = {
  image: string;
  title: string;
  description: string;
};

const benefitImages = [
  "/images/benefit/0.png",
  "/images/benefit/1.png",
  "/images/benefit/2.png",
  "/images/benefit/3.png",
  "/images/benefit/4.png",
  "/images/benefit/5.png",
] as const;

const BenefitCard = ({ image, title, description }: Benefit) => (
  <article className="relative flex h-full flex-col items-center bg-[#F0F0F0] px-8 pb-10 pt-24 rounded-[40px] mb-10 text-center hover-lift">
    <div className="absolute -top-20">
      <Image
        src={image}
        alt={title}
        width={160}
        height={160}
        sizes="160px"
        className="w-40 h-40 object-contain drop-shadow-lg"
      />
    </div>

    <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight">
      {title}
    </h3>
    <p className="text-gray-600 text-[14px] leading-relaxed">{description}</p>
  </article>
);

function BenefitSection({ t }: { t: HomeTranslations["benefits"] }) {
  const benefits = t.items.map((item, index) => ({
    ...item,
    image: benefitImages[index],
  })) satisfies Benefit[];

  return (
    <div className="py-12 bg-[#FFFBFD]">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        <h2 className={`${HOME_SECTION_TITLE_CLASS} text-center mb-10 title-reveal`}>
          {t.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-20 mt-40">
          {benefits.map((item) => (
            <BenefitCard
              key={item.title}
              image={item.image}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default BenefitSection;
