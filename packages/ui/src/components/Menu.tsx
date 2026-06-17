import React from "react";
import Divider from "./Divider";

interface MenuProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  text: string;
  isSelected?: boolean;
}

export const Menu = ({
  icon,
  text,
  isSelected = false,
  className = "",
  ...props
}: MenuProps) => {
  const baseClasses = "flex items-center gap-3 py-3 px-9 text-lg font-medium transition-all cursor-pointer";
  
  const stateClasses = isSelected
    ? "bg-primary-base text-absolute-white"
    : "text-primary-10 hover:bg-primary-40 hover:text-absolute-white";

  return (
    <div
      className={`${baseClasses} ${stateClasses} ${className}`}
      {...props}
    >
      <div className="flex items-center gap-2">
        {isSelected && (
          <Divider 
            type="dot" 
            size="large" 
            className="text-absolute-white" 
          />
        )}
        {icon}
      </div>
      <span>{text}</span>
    </div>
  );
};

export default Menu;