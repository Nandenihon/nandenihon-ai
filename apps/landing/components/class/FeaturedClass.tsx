import React from "react";
import MainSection from "./MainSection";
import { CLASSES } from "@/data/class";
import ClassItem from "./ClassItem";

const FeaturedClass = () => {
  return (
    <MainSection
      title="Kelas Insentif"
      description="Kelas intensif dengan mentor yang asik dan materi daging!"
    >
      {CLASSES.map((item) => (
        <ClassItem key={item.id} {...item} />
      ))}
    </MainSection>
  );
};

export default FeaturedClass;
