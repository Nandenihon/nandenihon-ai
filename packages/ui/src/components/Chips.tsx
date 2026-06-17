import React from "react";

interface ChipsProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  isSelected?: boolean;
  size?: "small" | "large";
}

export const Chips = ({
  label,
  isSelected = false,
  size = "small",
  className = "",
  ...props
}: ChipsProps) => {
  const sizeClasses = {
    small: "px-6 py-2 text-sm",
    large: "px-8 py-3 text-lg",
  };

  const stateClasses = isSelected
    ? "bg-primary-50 border-primary-80 text-absolute-white shadow-md"
    : "bg-primary-10 border-primary-30 text-primary-base hover:bg-primary-20 hover:border-primary-base";

  return (
    <button
      className={`rounded-full font-bold transition-all whitespace-nowrap border-2 cursor-pointer ${sizeClasses[size]} ${stateClasses} ${className}`}
      {...props}
    >
      {label}
    </button>
  );
};

export default Chips;
