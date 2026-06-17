import React from "react";

interface Props {
  title: string;
  description: string;
  children: React.ReactNode;
}
const MainSection = ({ title, description, children }: Props) => {
  return (
    <div className="py-15 max-w-7xl mx-auto px-6 lg:px-0 ">
      <div className="flex items-center space-x-6 w-full">
        <div className="flex-1">
          <h3 className="lg:text-2xl text-xl  font-bold lg:text-nowrap">
            {title}
          </h3>
          <p className="mt-2 text-gray-600 lg:text-nowrap">{description}</p>
        </div>
        <div className="h-0.5 w-full hidden lg:block bg-neutral-40"></div>
      </div>
      <div className="grid lg:grid-cols-3 grid-cols-1 gap-6 mt-15">
        {children}
      </div>
    </div>
  );
};

export default MainSection;
