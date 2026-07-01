import { HOME_SECTION_TITLE_CLASS } from "@/components/home/shared";
import Image from "next/image";

type Benefit = {
  image: string;
  title: string;
  description: string;
};

const benefits = [
  {
    image: "/images/benefit/0.png",
    title: "Belajar Dari 0",
    description:
      "Mulai dari Hiragana, Katakana, hingga percakapan sehari-hari (materi disusun bertahap dan mudah dipahami)",
  },
  {
    image: "/images/benefit/1.png",
    title: "Kelas Online Interaktif",
    description:
      "2x pertemuan via Zoom. Setiap sesi direkam, jadi kamu bisa tonton ulang kapan saja (fleksibel banget)",
  },
  {
    image: "/images/benefit/2.png",
    title: "E-book & Worksheet Eksklusif",
    description:
      "Desain menarik dan bisa dicetak (bisa bantu kamu latihan dan belajar kapan saja)",
  },
  {
    image: "/images/benefit/3.png",
    title: "Belajar Bahasa Sambil Mengenal Budaya",
    description:
      "Bukan cuma bahasa, kami ajarkan juga etika, kehidupan sehari-hari, dan cara memahami Jepang dari perspektif budaya.",
  },
  {
    image: "/images/benefit/4.png",
    title: "Komunitas Belajar yang Supportif",
    description:
      "Kamu nggak akan merasa sendirian di group komunitas kami (berinteraksi, berbagi informasi, dan saling memotivasi)",
  },
  {
    image: "/images/benefit/5.png",
    title: "Didampingin pengajar & Tim yang responsif",
    description:
      "Kami pantau perkembanganmu, jawab pertanyaan, dan siap membimbing setiap kali kamu membutuhkan.",
  },
] as const satisfies readonly Benefit[];

const BenefitCard = ({ image, title, description }: Benefit) => (
  <article className="relative flex h-full flex-col items-center bg-[#F0F0F0] px-8 pb-10 pt-24 rounded-[40px] mb-10 text-center hover:shadow-lg transition-shadow duration-300">
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

function BenefitSection() {
  return (
    <div className="py-12 bg-[#FFFBFD]">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        <h2 className={`${HOME_SECTION_TITLE_CLASS} text-center mb-10`}>
          Benefit yang Akan Kamu Dapatkan di Nande Nihon
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
