import { IconProps } from "./types";
import React from "react";



export const Down = ({ colorMode = "blue", ...props }: IconProps) => {
  const fillColor = colorMode === "blue" ? "#2563EB" : colorMode === "white" ? "#F9F9F9" : "currentColor";
  return (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"   {...props}>
    <path d="M19 9L12 15L5 9" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>

  );
};