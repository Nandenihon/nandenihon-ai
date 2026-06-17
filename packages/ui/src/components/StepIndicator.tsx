
interface CircleIndicatorProps {
  active?: boolean;
  size?: number | string;
  className?: string;
}

export const CircleIndicator = ({
  active = false,
  size = 12,
  className = "",
}: CircleIndicatorProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="6"
        cy="6"
        r="6"
        fill="currentColor"
        className={active ? "text-primary-base" : "text-neutral-20"}
      />
    </svg>
  );
};

interface StepIndicatorProps {
  count?: number;
  activeIndex?: number;
  className?: string;
}

export const StepIndicator = ({
  count = 4,
  activeIndex = 0,
  className = "",
}: StepIndicatorProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <CircleIndicator key={i} active={i === activeIndex} />
      ))}
    </div>
  );
};

export default StepIndicator;
