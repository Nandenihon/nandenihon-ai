import BenefitSection from "@/components/home/BenefitSection";
import CtaSection from "@/components/home/CtaSection";
import { OurPartnerSection } from "@/components/home/OurPartnerSection";
import OurTeamList from "@/components/home/OurTeamList";
import PublicationSection from "@/components/home/PublicationSection";
import TestimonialSection from "@/components/home/TestimonialSection";
import Image from "next/image";

export const dynamic = "force-dynamic";

const BackgroundPattern = () => (
  <>
    <div className="absolute top-0 w-328 -mt-50 z-0 hidden lg:block">
      <Image
        src="/images/pattern-hero.png"
        alt="pattern-hero"
        width={1200}
        height={1200}
        className="w-full"
        priority
      />
    </div>

    <div className="absolute top-0 right-0 z-0">
      <Image
        src="/images/vector-gradient.png"
        alt="vector-gradient"
        width={800}
        height={800}
        priority
      />
    </div>
  </>
);

const HeroSection = () => (
  <div className="relative max-w-7xl mx-auto z-10 flex flex-col lg:flex-row items-center justify-between px-6 lg:px-0 pt-48">
    <div className="w-full lg:w-1/2">
      <h1 className="font-bold text-[36px] lg:text-[48px] leading-tight lg:leading-17">
        Belajar Bahasa Jepang
        <br /> Jadi Lebih Mudah &<br /> Menyenangkan
      </h1>

      <p className="text-base lg:text-lg leading-relaxed mt-4">
        Berangkat dari pengalaman pernah kesulitan dan merasa bingung
        <br className="hidden lg:block" /> sendirian. Kami tergerak untuk
        mewujudkan gerakan bermanfaat melalu akses belajar yang lebih mudah dan
        menyenangkan. Berperan menjadi seorang teman saat kamu sedang di fase
        sulit dan bingung belajar Bahasa Jepang.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 w-full lg:w-auto">
        <button className="btn w-full sm:w-auto justify-center">
          Mulai Belajar
        </button>
        <button className="btn bg-white text-primary-base border border-primary-base w-full sm:w-auto justify-center">
          Lihat Kelas
        </button>
      </div>
    </div>

    <div className="hidden lg:block">
      <Image
        src="/images/hero.png"
        alt="hero"
        width={620}
        height={620}
        className="w-150"
        priority
      />
    </div>
  </div>
);

function HomeContent() {
  return (
    <div className="relative">
      <BackgroundPattern />

      <HeroSection />

      <OurPartnerSection />
      <BenefitSection />
      <PublicationSection />
      <TestimonialSection />
      <OurTeamList />
      <CtaSection />
    </div>
  );
}

export default HomeContent;
