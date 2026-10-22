import {
  LOCAL_IMAGE_FALLBACK,
  resolveUploadImageUrl,
} from "@/lib/images";

export const HOME_SECTION_TITLE_CLASS =
  "lg:text-4xl text-2xl font-bold text-gray-900";

export { LOCAL_IMAGE_FALLBACK };

/**
 * Marquees animate by -50%, so the track is two identical halves. Each half repeats the items until
 * it holds at least `minPerHalf`, otherwise a short list leaves an empty gap on wide screens.
 */
export function duplicateForMarquee<T>(items: readonly T[], minPerHalf = 6): T[] {
  if (items.length === 0) return [];
  const half: T[] = [];
  while (half.length < minPerHalf) half.push(...items);
  return [...half, ...half];
}

export const resolveUploadUrl = resolveUploadImageUrl;
