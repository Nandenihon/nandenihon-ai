import React from "react";
import MainSection from "./MainSection";
import { WEBINAR } from "@/data/webinar";
import WebinarItem from "./WebinarItem";

const FeaturedWebinar = () => {
  return (
    <MainSection
      title="Webinar"
      description="Webinar padat ilmu dengan penyampaian yang gak ngebosenin."
    >
      {WEBINAR.map((item) => (
        <WebinarItem key={item.id} {...item} />
      ))}
    </MainSection>
  );
};

export default FeaturedWebinar;
