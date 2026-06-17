"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface DropdownItem {
  label: string;
  onClick?: () => void;
  className?: string;
}

interface DropdownMenuProps {
  trigger?: React.ReactNode;
  placeholder?: string;
  items: DropdownItem[];
  className?: string;
  width?: string;
}

export const DropdownMenu = ({
  trigger,
  placeholder = "Select Option",
  items,
  className = "",
  width = "w-full",
}: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative inline-block text-left ${width}`} ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer h-full">
        {trigger ? (
          trigger
        ) : (
          <div className={`border border-neutral-30 rounded-lg px-4 py-3 bg-absolute-white flex items-center justify-between transition-colors hover:border-primary-base ${isOpen ? 'border-primary-base ring-1 ring-primary-base' : ''}`}>
            <span className="text-neutral-90 font-medium">{placeholder}</span>
            <ChevronDown className={`w-5 h-5 text-neutral-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        )}
      </div>

      <div
        className={`
          absolute z-50 mt-2 bg-absolute-white rounded-xl shadow-xl border border-neutral-10 overflow-hidden
          transition-all duration-200 origin-top
          ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}
          ${width} ${className}
        `}
      >
        <div className="py-2 flex flex-col">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick && item.onClick();
                setIsOpen(false);
              }}
              className={`
                text-left px-5 py-3 text-base font-medium text-neutral-90 
                hover:bg-primary-10 transition-colors
                ${item.className || ""}
              `}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DropdownMenu;