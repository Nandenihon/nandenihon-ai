import {
  duplicateForMarquee,
  HOME_SECTION_TITLE_CLASS,
} from "@/components/home/shared";
import Image from "next/image";

type Partner = {
  name: string;
  src: string;
};

const partners = [
  { name: "DHL", src: "/images/partner/dhl.png" },
  { name: "UPS", src: "/images/partner/ups.png" },
  { name: "India Post", src: "/images/partner/india-pos.png" },
  { name: "USPS", src: "/images/partner/us-pos.png" },
  { name: "FedEx", src: "/images/partner/feedex.png" },
  { name: "Bring", src: "/images/partner/bring.png" },
] as const satisfies readonly Partner[];

const partnerItems = duplicateForMarquee(partners);

const PartnerItem = ({ name, src }: Partner) => (
  <div className="flex items-center flex-none">
    <Image
      src={src}
      alt={name}
      width={160}
      height={60}
      sizes="160px"
      className="h-15 w-40 object-contain opacity-80 hover:opacity-100 transition"
    />
  </div>
);

export const OurPartnerSection = () => {
  return (
    <div className="py-32 mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        <h2 className={`${HOME_SECTION_TITLE_CLASS} text-center mb-10`}>
          Our Partner
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
