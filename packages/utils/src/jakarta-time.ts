export const JAKARTA_TIMEZONE = "Asia/Jakarta";

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Converts a `<input type="datetime-local">` value (e.g. "2026-08-17T08:00") into the UTC
 * "YYYY-MM-DD HH:mm:ss" string MySQL DATETIME columns expect. The input is always treated as
 * Asia/Jakarta wall-clock time — not the browser/device's own timezone — so admins get the same
 * result no matter where they physically are.
 */
export function datetimeLocalToJakartaUtc(value: string): string {
    if (!value) return "";
    const asUtc = new Date(`${value}:00.000Z`);
    if (Number.isNaN(asUtc.getTime())) return "";
    return new Date(asUtc.getTime() - JAKARTA_OFFSET_MS).toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Inverse of datetimeLocalToJakartaUtc: given a UTC datetime string from the API, returns the
 * Asia/Jakarta wall-clock value formatted for `<input type="datetime-local">`, independent of the
 * viewing device's own timezone.
 */
export function utcToJakartaDatetimeLocal(value: string): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const jakarta = new Date(date.getTime() + JAKARTA_OFFSET_MS);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${jakarta.getUTCFullYear()}-${pad(jakarta.getUTCMonth() + 1)}-${pad(jakarta.getUTCDate())}T${pad(jakarta.getUTCHours())}:${pad(jakarta.getUTCMinutes())}`;
}
