
interface ListNumberIconProps {
  number?: string | number;
  className?: string;
}

export const ListNumberIcon = ({
  number = "01",
  className = "",
}: ListNumberIconProps) => {
  const displayNum = typeof number === "number" && number < 10 
    ? `0${number}` 
    : String(number);

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full p-4 bg-white text-2xl font-bold text-neutral-90 overflow-hidden ${className}`}
    >
      {displayNum}
    </div>
  );
};

export default ListNumberIcon;
