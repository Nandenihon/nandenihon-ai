import {
  LOCAL_IMAGE_FALLBACK,
  resolveUploadImageUrl,
} from "@/lib/images";

export const HOME_SECTION_TITLE_CLASS =
  "lg:text-4xl text-2xl font-bold text-gray-900";

export { LOCAL_IMAGE_FALLBACK };

export function duplicateForMarquee<T>(items: readonly T[]): T[] {
  return [...items, ...items];
}

export const resolveUploadUrl = resolveUploadImageUrl;
