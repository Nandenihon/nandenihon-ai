import { IconProps } from "./types";
import React from "react";



export const Calendar = ({ colorMode = "blue", ...props }: IconProps) => {
  const fillColor = colorMode === "blue" ? "#2563EB" : colorMode === "white" ? "#F9F9F9" : "currentColor";
  return (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"   {...props}>
    <path d="M21 20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V10.5352H20.9961L21 20Z" fill={fillColor}/>
    <path opacity="0.5" d="M19 4H5C3.89543 4 3 4.89543 3 6V10.5H21V6C21 4.89543 20.1046 4 19 4Z" fill={fillColor}/>
    <path d="M16 2V6" stroke={fillColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 2V6" stroke={fillColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>

  );
};