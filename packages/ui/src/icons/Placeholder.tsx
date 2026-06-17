import { IconProps } from "./types";
import React from "react";



export const Placeholder = ({ colorMode = "blue", ...props }: IconProps) => {
  const fillColor = colorMode === "blue" ? "#2563EB" : colorMode === "white" ? "#F9F9F9" : "currentColor";
  return (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"   {...props}>
    <rect width="24" height="24" rx="4" fill={fillColor}/>
    {colorMode !== "blue" && (
      <>
        <line x1="2.17678" y1="1.82322" x2="22.1768" y2="21.8232" stroke="black" strokeWidth="0.5"/>
        <line x1="22.1768" y1="2.18361" x2="2.17678" y2="22.1836" stroke="black" strokeWidth="0.5"/>
      </>
    )}
  </svg>

  );
};