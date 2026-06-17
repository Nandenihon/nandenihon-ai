import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface BreadcrumbProps {
  category: string;
  title: string;
  author?: string;
  date?: string;
}

export default function Breadcrumb({
  category,
  title,
  author,
  date,
}: BreadcrumbProps) {
  return (
    <div className="flex flex-col gap-3 mb-8">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm">
          <li>
            <Link
              href="/"
              className="text-neutral-50 hover:text-primary-base transition-colors"
            >
              Home
            </Link>
          </li>
          <li className="text-neutral-30">
            <ChevronRight size={14} />
          </li>
          <li>
            <Link
              href="/article"
              className="text-neutral-50 hover:text-primary-base transition-colors"
            >
              Artikel
            </Link>
          </li>
          <li className="text-neutral-30">
            <ChevronRight size={14} />
          </li>
          <li>
            <span className="text-neutral-50">{category}</span>
          </li>
          <li className="text-neutral-30">
            <ChevronRight size={14} />
          </li>
          <li>
            <span className="text-neutral-80 font-medium line-clamp-1 max-w-xs">
              {title}
            </span>
          </li>
        </ol>
      </nav>

      {(author || date) && (
        <div className="flex items-center gap-3 text-sm text-neutral-50">
          {author && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-20 flex items-center justify-center">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.99984 8.33341C11.8408 8.33341 13.3332 6.84103 13.3332 5.00008C13.3332 3.15913 11.8408 1.66675 9.99984 1.66675C8.15889 1.66675 6.6665 3.15913 6.6665 5.00008C6.6665 6.84103 8.15889 8.33341 9.99984 8.33341Z"
                    fill="#2563EB"
                  />
                  <path
                    opacity="0.5"
                    d="M16.6668 14.5833C16.6668 16.6541 16.6668 18.3333 10.0002 18.3333C3.3335 18.3333 3.3335 16.6541 3.3335 14.5833C3.3335 12.5124 6.3185 10.8333 10.0002 10.8333C13.6818 10.8333 16.6668 12.5124 16.6668 14.5833Z"
                    fill="#2563EB"
                  />
                </svg>
              </div>
              <span className="font-medium text-neutral-70">{author}</span>
            </div>
          )}
          {author && date && <span className="text-neutral-30">•</span>}
          {date && (
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.79935 1.6665C6.14768 1.6665 6.42935 1.92484 6.42935 2.24317V3.40817C6.98768 3.39817 7.61435 3.39817 8.31935 3.39817H11.6793C12.3843 3.39817 13.0102 3.39817 13.5693 3.40817V2.24317C13.5693 1.92484 13.851 1.6665 14.1993 1.6665C14.5477 1.6665 14.8293 1.92484 14.8293 2.24317V3.45817C16.0377 3.5465 16.8318 3.76484 17.4152 4.29817C17.9985 4.83234 18.236 5.559 18.3327 6.6665V7.49984H1.66602V6.6665C1.76268 5.559 2.00018 4.83317 2.58352 4.29817C3.16685 3.76484 3.96018 3.5465 5.16935 3.45817V2.24317C5.16935 1.92484 5.45185 1.6665 5.79935 1.6665Z"
                  fill="#2563EB"
                />
                <path
                  opacity="0.5"
                  d="M18.3325 11.6667V10C18.3325 9.30083 18.3217 8.05417 18.3108 7.5H1.67083C1.66 8.05417 1.67083 9.30083 1.67083 10V11.6667C1.67083 14.8092 1.67083 16.3808 2.64583 17.3567C3.62333 18.3333 5.19416 18.3333 8.33583 18.3333H11.6692C14.8108 18.3333 16.3808 18.3333 17.3575 17.3567C18.3342 16.38 18.3325 14.8092 18.3325 11.6667Z"
                  fill="#2563EB"
                />
              </svg>
              <span className="font-medium text-neutral-70">{date}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
