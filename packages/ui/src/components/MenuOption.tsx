"use client";

import React, { useState } from "react";
import { Down } from "../icons";

export interface SubMenuOption {
  text: string;
  onClick?: () => void;
}

interface MenuOptionProps {
  icon: React.ReactNode;
  text: string;
  options?: SubMenuOption[];
  className?: string;
}

export const MenuOption = ({
  icon,
  text,
  options = [],
  className = "",
}: MenuOptionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`w-full flex flex-col ${className}`}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between py-3 px-9 text-lg font-medium transition-all cursor-pointer text-primary-10 hover:bg-primary-40"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{text}</span>
        </div>
        <Down colorMode="white"
          className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
        />
      </div>

      <div 
        className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        {options.map((option, index) => (
          <div
            key={index}
            onClick={option.onClick}
            className="py-2 px-9 pl-14 text-base font-medium transition-all cursor-pointer text-primary-10 hover:bg-primary-40"
          >
            {option.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuOption;