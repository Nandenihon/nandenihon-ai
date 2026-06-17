
export type CategoryType = 
  | "Budaya" 
  | "Filosofi" 
  | "Makanan" 
  | "Lifestyle" 
  | "Travel" 
  | "Edukasi"
  | string;

interface CategoryTagProps {
  category: CategoryType;
  className?: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  budaya: "bg-secondary-10 text-secondary-base",
  filosofi: "bg-primary-10 text-primary-base",
  makanan: "bg-warning-10 text-warning-base",
  lifestyle: "bg-error-10 text-error-base",
  travel: "bg-neutral-10 text-neutral-70",
  edukasi: "bg-success-10 text-success-base",
};

export const CategoryTag = ({ category, className = "" }: CategoryTagProps) => {
  const normalizedCategory = category.toLowerCase();
  const styleClass = CATEGORY_STYLES[normalizedCategory] || "bg-primary-10 text-primary-base";

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide inline-block ${styleClass} ${className}`}
    >
      {category}
    </span>
  );
};

export default CategoryTag;
