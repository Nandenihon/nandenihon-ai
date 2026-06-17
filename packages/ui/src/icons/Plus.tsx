import { IconProps } from "./types";
import React from "react";



export const Plus = ({ colorMode = "blue", ...props }: IconProps) => {
  const fillColor = colorMode === "blue" ? "#2563EB" : colorMode === "white" ? "#F9F9F9" : "currentColor";
  return (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"   {...props}>
    <path opacity="0.5" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={fillColor} strokeWidth="1.5"/>
    <path d="M15 12H12M12 12H9M12 12V9M12 12V15" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>

  );
};