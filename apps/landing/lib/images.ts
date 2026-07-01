export const LOCAL_IMAGE_FALLBACK = "/images/Rectangle 6.png";

const UPLOAD_BASE_URL = (
  process.env.NEXT_PUBLIC_UPLOAD_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://nandenihon.com"
).replace(/\/$/, "");

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const GOOGLE_DRIVE_HOSTS = new Set(["drive.google.com", "www.drive.google.com"]);

function getGoogleDriveFileId(value: string): string | null {
  try {
    const url = new URL(value);

    if (!GOOGLE_DRIVE_HOSTS.has(url.hostname)) {
      return null;
    }

    const pathId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
    return pathId || url.searchParams.get("id");
  } catch {
    return null;
  }
}

export function normalizeImageUrl(value: string | null | undefined) {
  const source = value?.trim();

  if (!source) {
    return "";
  }

  const driveFileId = getGoogleDriveFileId(source);

  if (driveFileId) {
    return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(
      driveFileId,
    )}`;
  }

  return source;
}

export function resolveUploadImageUrl(
  value: string | null | undefined,
  fallback = LOCAL_IMAGE_FALLBACK,
) {
  const source = normalizeImageUrl(value);

  if (!source) {
    return fallback;
  }

  if (ABSOLUTE_URL_PATTERN.test(source)) {
    return source;
  }

  return `${UPLOAD_BASE_URL}/${source.replace(/^\/+/, "")}`;
}
