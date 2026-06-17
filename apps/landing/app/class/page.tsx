import FeaturedClass from "@/components/class/FeaturedClass";
import FeaturedWebinar from "@/components/class/FeaturedWebinar";
import HeroSection from "@/components/class/HeroSection";
import MainSection from "@/components/class/MainSection";
import CtaSection from "@/components/home/CtaSection";

export default function ClassPage() {
  return (
    <div className="bg-[#FBFCFF]">
      <HeroSection />
      <FeaturedClass />
      <FeaturedWebinar />
      <CtaSection />
    </div>
  );
}
