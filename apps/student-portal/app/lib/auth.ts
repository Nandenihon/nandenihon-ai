import type { UserSession } from "@repo/types";

export const COOKIE_NAME = "nn_student_session";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const encoder = new TextEncoder();

function getJwtSecret(): string {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error(
            "JWT_SECRET environment variable is not set. Please define it in your .env.local file."
        );
    }

    return jwtSecret;
}

function base64UrlEncode(str: string): string {
    return btoa(unescape(encodeURIComponent(str)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}

function base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    return decodeURIComponent(escape(atob(base64)));
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64UrlToBuffer(str: string): Uint8Array {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["sign", "verify"]
    );
}

export async function signToken(payload: UserSession): Promise<string> {
    const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const now = Math.floor(Date.now() / 1000);
    const claims = base64UrlEncode(JSON.stringify({ ...payload, iat: now, exp: now + COOKIE_MAX_AGE }));
    const data = encoder.encode(`${header}.${claims}`);
    const key = await getCryptoKey(getJwtSecret());
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
    return `${header}.${claims}.${bufferToBase64Url(signatureBuffer)}`;
}

export async function verifyToken(token: string): Promise<UserSession | null> {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const [header, claims, signature] = parts;
        const data = encoder.encode(`${header}.${claims}`);
        const key = await getCryptoKey(getJwtSecret());
        const sigBytes = base64UrlToBuffer(signature);
        const isValid = await crypto.subtle.verify(
            "HMAC", key,
            sigBytes as unknown as BufferSource,
            data as unknown as BufferSource
        );
        if (!isValid) return null;
        const payload = JSON.parse(base64UrlDecode(claims));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) return null;
        return payload as UserSession;
    } catch {
        return null;
    }
}
