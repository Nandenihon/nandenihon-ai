import React from "react";
import HeroSection from "@/components/information/HeroSection";
import TopicSection from "@/components/information/TopicSection";
import StepsSection from "@/components/information/StepsSection";

export default function InformationPage() {
  return (
    <main>
      <HeroSection />
      <TopicSection />
      <StepsSection />
    </main>
  );
}
