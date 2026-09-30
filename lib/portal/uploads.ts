/**
 * Upload rules for the portal's logo and photo slots. Shared by the browser
 * (instant feedback before anything is sent) and the server (the real check,
 * run twice: before a signed upload URL is issued, and again against the
 * size and type storage actually recorded). The bucket repeats the type and
 * size limits in supabase/portal.sql.
 */

export const MAX_BYTES = 50 * 1024 * 1024;

/** Enough for a logo pack (SVG + PNG + PDF variants) and a real photo shoot. */
export const MAX_FILES = { logo: 10, photo: 80 } as const;

export type UploadKind = keyof typeof MAX_FILES;
export const UPLOAD_KINDS = Object.keys(MAX_FILES) as UploadKind[];

/** MIME → stored extension. The client's file name never becomes a path. */
export const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/svg+xml": "svg",
  "image/gif": "gif",
  "image/tiff": "tif",
  "application/pdf": "pdf",
};

/** Types a browser can show as an <img> thumbnail. */
export const PREVIEWABLE = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"]);

/**
 * Browsers report an empty type for some files (HEIC on Windows is the usual
 * one). Fall back to the extension so a client's iPhone photos still go in.
 */
export function mimeOf(name: string, reported: string): string {
  if (reported && reported in MIME_EXT) return reported;
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const byExt: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    heic: "image/heic", heif: "image/heif", svg: "image/svg+xml", gif: "image/gif",
    tif: "image/tiff", tiff: "image/tiff", pdf: "application/pdf",
  };
  return byExt[ext] ?? reported;
}

export type UploadError = "bad_kind" | "bad_type" | "too_big" | "empty" | "too_many";

export function checkUpload(
  f: { kind: unknown; mime: unknown; size: unknown },
  existing: number
): UploadError | null {
  if (typeof f.kind !== "string" || !(UPLOAD_KINDS as string[]).includes(f.kind)) return "bad_kind";
  if (typeof f.mime !== "string" || !(f.mime in MIME_EXT)) return "bad_type";
  if (typeof f.size !== "number" || !Number.isFinite(f.size) || f.size <= 0) return "empty";
  if (f.size > MAX_BYTES) return "too_big";
  if (existing >= MAX_FILES[f.kind as UploadKind]) return "too_many";
  return null;
}

/** The client's file name, cleaned for display and the admin download name. */
export function cleanName(v: unknown): string {
  const s = typeof v === "string" ? v : "";
  const cleaned = s.replace(/[\u0000-\u001F\u007F/\\]/g, "").trim().slice(0, 200);
  return cleaned || "file";
}

export function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
