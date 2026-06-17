import { IconProps } from "./types";
import React from "react";

interface ArrowCircleIconProps {
  direction?: "left" | "right";
  className?: string;
  size?: number | string;
}

export const ArrowCircleIcon = ({
  direction = "right",
  className = "",
  size = 48,
}: ArrowCircleIconProps) => {
  return (
    <div 
      className={`inline-flex items-center justify-center shrink-0 rounded-full bg-primary-base transition-transform ${
        direction === "left" ? "rotate-180" : ""
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width="10"
        height="18"
        viewBox="0 0 10 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 17L9 9L1 1"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default ArrowCircleIcon;
