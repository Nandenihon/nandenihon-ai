import React from "react";

interface DividerProps {
  mode?: "horizontal" | "vertical";
  size?: "small" | "large";
  type?: "default" | "dot";
  length?: string | number;
  className?: string;
}

export const Divider = ({
  mode = "horizontal",
  size = "small",
  type = "default",
  length = "100%",
  className = "",
}: DividerProps) => {
  const thickness = size === "large" ? 4 : 2;
  const dotSize = size === "large" ? 6 : 4;

  if (type === "dot") {
    return (
      <svg
        width={dotSize}
        height={dotSize}
        viewBox="0 0 6 6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
        style={!className ? { color: "var(--color-neutral-10)" } : {}}
      >
        <circle cx="3" cy="3" r="3" fill="currentColor" />
      </svg>
    );
  }

  const style = mode === "horizontal" 
    ? { width: typeof length === "number" ? `${length}px` : length, height: `${thickness}px` } 
    : { width: `${thickness}px`, height: typeof length === "number" ? `${length}px` : length };

  return (
    <div 
      className={`shrink-0 ${className}`} 
      style={{
        backgroundColor: !className ? "var(--color-neutral-10)" : undefined,
        ...style
      }}
      aria-orientation={mode}
      role="separator"
    />
  );
};

export default Divider;
