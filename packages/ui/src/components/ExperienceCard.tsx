import React from "react";

export interface ExperienceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

export const ExperienceCard = ({
  title,
  description,
  icon,
  className = "",
}: ExperienceCardProps) => {
  return (
    <div className={`relative mt-12 ${className} group`}>
      <div className="flex flex-col gap-4 bg-neutral-10 rounded-4xl p-8 pt-16 text-center h-full transition-all duration-300 hover:shadow-lg hover:bg-white border border-transparent hover:border-neutral-20">
        <h3 className="text-xl font-bold text-neutral-80 mb-3 section-title">
          {title}
        </h3>
        <p className="text-neutral-70 font-normal text-base leading-relaxed">
          {description}
        </p>
      </div>
      
      {/* 3D Icon */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 flex items-center justify-center transition-transform duration-300 group-hover:scale-100 group-hover:-translate-y-2 drop-shadow-xl">
        {icon}
      </div>
    </div>
  );
};

export default ExperienceCard;
