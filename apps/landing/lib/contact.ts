/** Official Nande Nihon contact channels, shared by the footer, contact page, merchandise and webinars. */
export const CONTACT = {
  email: "nandenihon6@gmail.com",
  phoneDisplay: "+62 812-9923-6462",
  whatsappNumber: "6281299236462",
  instagramHandle: "nandenihon",
} as const;

export const CONTACT_LINKS = {
  email: `mailto:${CONTACT.email}`,
  whatsapp: `https://wa.me/${CONTACT.whatsappNumber}`,
  instagram: `https://www.instagram.com/${CONTACT.instagramHandle}/`,
} as const;

export function whatsappLink(message: string) {
  return `${CONTACT_LINKS.whatsapp}?text=${encodeURIComponent(message)}`;
}

/**
 * Team members store Instagram as "@handle", "handle" or a full URL.
 * Returns a usable profile URL, or null when nothing usable is stored.
 */
export function instagramProfileUrl(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw || raw === "#" || raw === "-") return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const handle = raw
    .replace(/^(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? `https://www.instagram.com/${handle}/` : null;
}
