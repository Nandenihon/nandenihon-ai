import Link from "next/link";
import { ListNumberIcon } from "../icons";
import CategoryTag from "./CategoryTag";

interface ArticleProps {
  id: number;
  slug: string;
  title: string;
  category: string;
  date: string;
  i: number;
}

export default function Article({
  id,
  slug,
  title,
  category,
  date,
  i,
}: ArticleProps) {
  return (
    <Link
      key={id}
      href={`/article/${slug}`}
      className="flex flex-col gap-6 group cursor-pointer"
    >
      <div className="flex items-center gap-4 bg-primary-10 rounded-2xl p-2">
        <ListNumberIcon number={i + 1} />
        <div className="flex flex-col gap-2">
          <h2 className="text-lg md:text-xl font-semibold text-neutral-90 leading-tight group-hover:text-primary-base transition-colors cursor-pointer">
            {title}
          </h2>
          <div className="flex items-center gap-4">
            <CategoryTag category={category} />
            <p className="text-base font-normal text-neutral-70">{date}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
