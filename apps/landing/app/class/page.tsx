import FeaturedClass from "@/components/class/FeaturedClass";
import FeaturedWebinar from "@/components/class/FeaturedWebinar";
import HeroSection from "@/components/class/HeroSection";
import CtaSection from "@/components/home/CtaSection";

export const dynamic = "force-dynamic";

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
