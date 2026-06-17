import { IconProps } from "./types";
import React from "react";



export const Mail = ({ colorMode = "blue", ...props }: IconProps) => {
  const fillColor = colorMode === "blue" ? "#2563EB" : colorMode === "white" ? "#F9F9F9" : "currentColor";
  return (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"   {...props}>
    <path opacity="0.5" d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" fill={fillColor}/>
    <path d="M12 14L2 7V6C2 4.89543 2.89543 4 4 4H20C21.1046 4 22 4.89543 22 6V7L12 14Z" fill={fillColor}/>
  </svg>

  );
};