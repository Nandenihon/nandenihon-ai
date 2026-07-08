export const LOCAL_IMAGE_FALLBACK = "/images/Rectangle 6.png";

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const GOOGLE_DRIVE_HOSTS = new Set(["drive.google.com", "www.drive.google.com"]);
const LEGACY_UPLOAD_HOSTS = new Set(["nandenihon.com", "www.nandenihon.com"]);
const UPLOAD_PATH_PREFIX = "/uploads/";
const UPLOAD_BASE_URL = process.env.NEXT_PUBLIC_UPLOAD_BASE_URL?.replace(/\/$/, "");
const WORDPRESS_MEDIA_BASE_URL = "https://blog.nandenihon.com";
const WORDPRESS_MEDIA_PATH_PREFIX = "/wp-content/uploads/";
const WORDPRESS_PROXIED_MEDIA_PATH_PREFIX = "/blog/wp-content/uploads/";

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

function shouldUseConfiguredUploadBaseUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return !LEGACY_UPLOAD_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function normalizeImageUrl(value: string | null | undefined) {
  const source = value?.trim();

  if (!source) {
    return "";
  }

  if (source.startsWith(UPLOAD_PATH_PREFIX)) {
    return source;
  }

  if (source.replace(/^\/+/, "").startsWith("uploads/")) {
    return `/${source.replace(/^\/+/, "")}`;
  }

  const driveFileId = getGoogleDriveFileId(source);

  if (driveFileId) {
    return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(
      driveFileId,
    )}`;
  }

  try {
    const url = new URL(source);

    if (
      (url.hostname === "nandenihon.com" ||
        url.hostname === "www.nandenihon.com") &&
      url.pathname.startsWith(UPLOAD_PATH_PREFIX)
    ) {
      return url.pathname;
    }

    if (
      (url.hostname === "nandenihon.com" ||
        url.hostname === "www.nandenihon.com") &&
      url.pathname.startsWith(WORDPRESS_PROXIED_MEDIA_PATH_PREFIX)
    ) {
      url.hostname = "blog.nandenihon.com";
      url.pathname = url.pathname.replace(
        WORDPRESS_PROXIED_MEDIA_PATH_PREFIX,
        WORDPRESS_MEDIA_PATH_PREFIX,
      );
      return url.toString();
    }
  } catch {
    if (source.startsWith(WORDPRESS_PROXIED_MEDIA_PATH_PREFIX)) {
      return `${WORDPRESS_MEDIA_BASE_URL}${source.replace(
        WORDPRESS_PROXIED_MEDIA_PATH_PREFIX,
        WORDPRESS_MEDIA_PATH_PREFIX,
      )}`;
    }

    if (source.startsWith(WORDPRESS_MEDIA_PATH_PREFIX)) {
      return `${WORDPRESS_MEDIA_BASE_URL}${source}`;
    }
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

  if (source.startsWith(UPLOAD_PATH_PREFIX)) {
    return source;
  }

  if (source.startsWith("/")) {
    return source;
  }

  if (shouldUseConfiguredUploadBaseUrl(UPLOAD_BASE_URL)) {
    return `${UPLOAD_BASE_URL}/${source.replace(/^\/+/, "")}`;
  }

  return `${UPLOAD_PATH_PREFIX}${source.replace(/^\/+/, "")}`;
}
