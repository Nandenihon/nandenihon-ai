import { createHash, createHmac, randomUUID } from "crypto";

const DEFAULT_R2_BUCKET_URL = "https://47442afd5a8cb46b3fa8ff4781a1188d.r2.cloudflarestorage.com/nande-nihon";
const DEFAULT_R2_PUBLIC_BASE_URL = "https://pub-3100e4c32b054e6598de798c71120dc1.r2.dev";
const DEFAULT_R2_BUCKET = "nande-nihon";
const DEFAULT_UPLOAD_PUBLIC_PATH = "/uploads";
const EMPTY_SHA256_HASH = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const R2_ENV_PREFIXES = new Set(["dev", "prod"]);

const EXTENSIONS_BY_CONTENT_TYPE: Record<string, string> = {
    "application/msword": "doc",
    "application/octet-stream": "bin",
    "application/pdf": "pdf",
    "application/vnd.ms-excel": "xls",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/svg+xml": "svg",
    "image/webp": "webp",
    "text/csv": "csv",
    "text/plain": "txt",
};

export interface R2UploadInput {
    buffer: Buffer;
    contentType: string;
    folder: string;
    originalFilename?: string;
    filenamePrefix?: string;
    cacheControl?: string;
}

export interface R2UploadResult {
    bucket: string;
    contentType: string;
    filename: string;
    key: string;
    pathname: string;
    publicUrl: string;
    size: number;
    storage: "r2";
}

interface R2Config {
    accessKeyId: string;
    bucket: string;
    endpointOrigin: string;
    publicBaseUrl: string;
    secretAccessKey: string;
}

interface R2FetchOptions {
    body?: Buffer;
    cacheControl?: string;
    contentDisposition?: string;
    contentType?: string;
    requireCredentials?: boolean;
}

export function getUploadPublicPath() {
    return process.env.UPLOAD_PUBLIC_PATH || DEFAULT_UPLOAD_PUBLIC_PATH;
}

export function getR2UploadPrefix() {
    const configuredPrefix = process.env.R2_UPLOAD_PREFIX || process.env.R2_OBJECT_PREFIX;
    const defaultPrefix = process.env.NODE_ENV === "production" ? "prod" : "dev";
    const prefix = configuredPrefix || defaultPrefix;

    return prefix
        .split("/")
        .map((part) => part.toLowerCase().trim().replace(/[^a-z0-9-_]/g, ""))
        .filter(Boolean)
        .join("/");
}

function isR2EnvironmentPrefixedKey(key: string) {
    const firstSegment = key.split("/")[0];
    return firstSegment === getR2UploadPrefix() || R2_ENV_PREFIXES.has(firstSegment);
}

function stripR2EnvironmentPrefix(key: string) {
    if (!isR2EnvironmentPrefixedKey(key)) {
        return key;
    }

    return key.split("/").slice(1).join("/");
}

export function getR2StorageKey(publicKey: string) {
    assertSafeR2Key(publicKey);

    if (isR2EnvironmentPrefixedKey(publicKey)) {
        return publicKey;
    }

    const prefix = getR2UploadPrefix();
    return [prefix, publicKey].filter(Boolean).join("/");
}

export function getR2LookupKeys(publicKey: string) {
    const storageKey = getR2StorageKey(publicKey);
    return [storageKey, publicKey].filter((key, index, keys) => keys.indexOf(key) === index);
}

export function sanitizeUploadFolder(folder: FormDataEntryValue | string | null): string {
    if (typeof folder !== "string") {
        return "documents";
    }

    const sanitized = folder.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
    return sanitized || "documents";
}

export function getUploadPathFromKey(key: string) {
    return `${getUploadPublicPath().replace(/\/$/, "")}/${stripR2EnvironmentPrefix(key)}`;
}

export function getR2ObjectKeyFromUploadPath(pathname: string) {
    const uploadPublicPath = getUploadPublicPath().replace(/\/$/, "");
    const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

    if (!normalizedPath.startsWith(`${uploadPublicPath}/`)) {
        return "";
    }

    return normalizedPath.slice(uploadPublicPath.length + 1);
}

export function getContentTypeFromFilename(filename: string) {
    const extension = getFilenameExtension(filename);
    const match = Object.entries(EXTENSIONS_BY_CONTENT_TYPE).find(([, value]) => value === extension);
    return match?.[0] || "application/octet-stream";
}

export function sanitizeFilenamePrefix(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function getR2Config(requireCredentials = true): R2Config {
    const rawEndpoint = process.env.R2_ENDPOINT || process.env.R2_BUCKET_URL || DEFAULT_R2_BUCKET_URL;
    const endpointUrl = new URL(rawEndpoint);
    const pathBucket = endpointUrl.pathname.split("/").filter(Boolean)[0];
    const bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME || pathBucket || DEFAULT_R2_BUCKET;

    endpointUrl.pathname = "";
    endpointUrl.search = "";
    endpointUrl.hash = "";

    const accessKeyId = (process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "").trim();
    const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "").trim();

    if (requireCredentials && (!accessKeyId || !secretAccessKey)) {
        throw new Error("Missing R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY");
    }

    if (requireCredentials && accessKeyId && accessKeyId.length !== 32) {
        throw new Error(
            "Invalid R2_ACCESS_KEY_ID. Use the 32-character Access Key ID from Cloudflare R2 API Tokens, not the API endpoint, public URL, account ID, or API token."
        );
    }

    return {
        accessKeyId,
        bucket,
        endpointOrigin: endpointUrl.origin,
        publicBaseUrl: (process.env.R2_PUBLIC_BASE_URL || DEFAULT_R2_PUBLIC_BASE_URL).replace(/\/$/, ""),
        secretAccessKey,
    };
}

function getFilenameExtension(filename = "") {
    const extension = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
    return extension.length <= 12 ? extension : "";
}

function getUploadExtension(originalFilename: string | undefined, contentType: string) {
    return EXTENSIONS_BY_CONTENT_TYPE[contentType] || getFilenameExtension(originalFilename) || "bin";
}

function createStoredFilename(originalFilename: string | undefined, contentType: string, filenamePrefix?: string) {
    const extension = getUploadExtension(originalFilename, contentType);
    const prefix = filenamePrefix ? `${sanitizeFilenamePrefix(filenamePrefix)}-` : "";

    return `${prefix}${Date.now()}-${randomUUID()}.${extension}`;
}

function encodeR2Path(value: string) {
    return value.split("/").map(encodeURIComponent).join("/");
}

function assertSafeR2Key(key: string) {
    if (!key || key.startsWith("/") || key.includes("..") || key.includes("\\")) {
        throw new Error("Invalid R2 object key");
    }
}

function formatR2Error(status: number, details: string) {
    const code = details.match(/<Code>([^<]+)<\/Code>/)?.[1];
    const message = details.match(/<Message>([^<]+)<\/Message>/)?.[1];
    const parsedDetails = [code, message].filter(Boolean).join(": ");

    if (message?.includes("Credential access key")) {
        return `R2 upload failed with status ${status}: ${parsedDetails}. Check R2_ACCESS_KEY_ID; it must be the 32-character R2 Access Key ID.`;
    }

    return `R2 upload failed with status ${status}: ${parsedDetails || details}`;
}

function sha256Hex(value: Buffer | string) {
    return createHash("sha256").update(value).digest("hex");
}

function hmacSha256(key: Buffer | string, value: string) {
    return createHmac("sha256", key).update(value).digest();
}

function hmacSha256Hex(key: Buffer | string, value: string) {
    return createHmac("sha256", key).update(value).digest("hex");
}

function getAmzDates(date = new Date()) {
    const isoDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");

    return {
        amzDate: isoDate,
        dateStamp: isoDate.slice(0, 8),
    };
}

function getSigningKey(secretAccessKey: string, dateStamp: string) {
    const dateKey = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
    const regionKey = hmacSha256(dateKey, "auto");
    const serviceKey = hmacSha256(regionKey, "s3");
    return hmacSha256(serviceKey, "aws4_request");
}

function getContentDisposition(contentType: string, filename: string) {
    const disposition = contentType.startsWith("image/") || contentType === "application/pdf" ? "inline" : "attachment";
    return `${disposition}; filename="${filename.replace(/"/g, "")}"`;
}

function buildR2ObjectUrl(config: R2Config, key: string) {
    return `${config.endpointOrigin}/${encodeURIComponent(config.bucket)}/${encodeR2Path(key)}`;
}

export function buildR2PublicUrl(key: string) {
    assertSafeR2Key(key);
    const config = getR2Config(false);
    return `${config.publicBaseUrl}/${encodeR2Path(key)}`;
}

async function signedR2Fetch(method: "GET" | "PUT", key: string, options: R2FetchOptions = {}) {
    assertSafeR2Key(key);

    const config = getR2Config(options.requireCredentials ?? true);

    if (!config.accessKeyId || !config.secretAccessKey) {
        return fetch(buildR2PublicUrl(key), { cache: "no-store" });
    }

    const url = new URL(buildR2ObjectUrl(config, key));
    const { amzDate, dateStamp } = getAmzDates();
    const payloadHash = options.body ? sha256Hex(options.body) : EMPTY_SHA256_HASH;
    const signedHeaderValues: Record<string, string> = {
        host: url.host,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
    };

    if (options.cacheControl) {
        signedHeaderValues["cache-control"] = options.cacheControl;
    }

    if (options.contentDisposition) {
        signedHeaderValues["content-disposition"] = options.contentDisposition;
    }

    if (options.contentType) {
        signedHeaderValues["content-type"] = options.contentType;
    }

    const signedHeaders = Object.keys(signedHeaderValues).sort();
    const canonicalHeaders = signedHeaders
        .map((header) => `${header}:${signedHeaderValues[header].trim().replace(/\s+/g, " ")}`)
        .join("\n");
    const canonicalRequest = [
        method,
        url.pathname,
        "",
        `${canonicalHeaders}\n`,
        signedHeaders.join(";"),
        payloadHash,
    ].join("\n");
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const stringToSign = [
        "AWS4-HMAC-SHA256",
        amzDate,
        credentialScope,
        sha256Hex(canonicalRequest),
    ].join("\n");
    const signature = hmacSha256Hex(getSigningKey(config.secretAccessKey, dateStamp), stringToSign);
    const headers = new Headers();

    for (const [header, value] of Object.entries(signedHeaderValues)) {
        if (header !== "host") {
            headers.set(header, value);
        }
    }

    headers.set(
        "authorization",
        `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders.join(";")}, Signature=${signature}`
    );

    const fetchInit: RequestInit = {
        method,
        headers,
        body: options.body ? new Uint8Array(options.body) : undefined,
    };

    if (method === "GET") {
        fetchInit.cache = "no-store";
    }

    return fetch(url, fetchInit);
}

export async function uploadFileToR2(input: R2UploadInput): Promise<R2UploadResult> {
    const contentType = input.contentType || "application/octet-stream";
    const folder = sanitizeUploadFolder(input.folder);
    const filename = createStoredFilename(input.originalFilename, contentType, input.filenamePrefix);
    const publicKey = `${folder}/${filename}`;
    const key = getR2StorageKey(publicKey);
    const cacheControl = input.cacheControl || "public, max-age=31536000, immutable";
    const response = await signedR2Fetch("PUT", key, {
        body: input.buffer,
        cacheControl,
        contentDisposition: getContentDisposition(contentType, filename),
        contentType,
    });

    if (!response.ok) {
        const details = await response.text().catch(() => "");
        throw new Error(formatR2Error(response.status, details));
    }

    const config = getR2Config();

    return {
        bucket: config.bucket,
        contentType,
        filename,
        key,
        pathname: getUploadPathFromKey(publicKey),
        publicUrl: buildR2PublicUrl(key),
        size: input.buffer.length,
        storage: "r2",
    };
}

export async function fetchR2Object(key: string) {
    for (const lookupKey of getR2LookupKeys(key)) {
        try {
            const signedResponse = await signedR2Fetch("GET", lookupKey, { requireCredentials: true });
            if (signedResponse.ok) {
                return signedResponse;
            }
        } catch {
            // Public R2 URLs can still work for read-only access if credentials are unavailable.
        }

        try {
            const publicResponse = await fetch(buildR2PublicUrl(lookupKey), { cache: "no-store" });
            if (publicResponse.ok) {
                return publicResponse;
            }
        } catch {
            continue;
        }
    }

    return null;
}
