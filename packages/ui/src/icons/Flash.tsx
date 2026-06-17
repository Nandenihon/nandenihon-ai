import { IconProps } from "./types";
import React from "react";



export const Flash = ({ colorMode = "blue", ...props }: IconProps) => {
  const fillColor = colorMode === "blue" ? "#2563EB" : colorMode === "white" ? "#F9F9F9" : "currentColor";
  return (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"   {...props}>
    <path d="M14.2748 3.70585L12.75 9.5L20.2215 9.12642C21.1273 9.08113 21.6208 10.1681 20.9905 10.8202L10.9101 21.2482C10.1944 21.9885 8.96198 21.2945 9.22404 20.2987L10.75 14.5H3.60556C2.72309 14.5 2.2732 13.4403 2.88616 12.8054L12.5883 2.75676C13.3038 2.01575 14.5369 2.70972 14.2748 3.70585Z" fill={fillColor}/>
  </svg>

  );
};