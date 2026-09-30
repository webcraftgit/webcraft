import { describe, expect, it } from "vitest";
import { MAX_BYTES, MAX_FILES, checkUpload, cleanName, formatBytes, mimeOf } from "./uploads";

describe("checkUpload", () => {
  const ok = { kind: "photo", mime: "image/jpeg", size: 2_000_000 };

  it("accepts a normal photo and logo", () => {
    expect(checkUpload(ok, 0)).toBeNull();
    expect(checkUpload({ kind: "logo", mime: "image/svg+xml", size: 5000 }, 0)).toBeNull();
    expect(checkUpload({ kind: "logo", mime: "application/pdf", size: 5000 }, 0)).toBeNull();
  });

  it("rejects unknown kinds and types", () => {
    expect(checkUpload({ ...ok, kind: "contract" }, 0)).toBe("bad_kind");
    expect(checkUpload({ ...ok, mime: "text/html" }, 0)).toBe("bad_type");
    expect(checkUpload({ ...ok, mime: "application/x-msdownload" }, 0)).toBe("bad_type");
  });

  it("rejects empty, oversized and non-numeric sizes", () => {
    expect(checkUpload({ ...ok, size: 0 }, 0)).toBe("empty");
    expect(checkUpload({ ...ok, size: "big" }, 0)).toBe("empty");
    expect(checkUpload({ ...ok, size: MAX_BYTES + 1 }, 0)).toBe("too_big");
    expect(checkUpload({ ...ok, size: MAX_BYTES }, 0)).toBeNull();
  });

  it("enforces the per-slot file limit", () => {
    expect(checkUpload(ok, MAX_FILES.photo - 1)).toBeNull();
    expect(checkUpload(ok, MAX_FILES.photo)).toBe("too_many");
    expect(checkUpload({ ...ok, kind: "logo" }, MAX_FILES.logo)).toBe("too_many");
  });
});

describe("mimeOf", () => {
  it("trusts a known reported type, falls back to the extension", () => {
    expect(mimeOf("a.jpg", "image/png")).toBe("image/png");
    expect(mimeOf("IMG_0001.HEIC", "")).toBe("image/heic");
    expect(mimeOf("logo.svg", "")).toBe("image/svg+xml");
    expect(mimeOf("virus.exe", "")).toBe("");
  });
});

describe("cleanName / formatBytes", () => {
  it("strips path separators and control chars", () => {
    expect(cleanName("../../etc/passwd")).toBe("....etcpasswd");
    expect(cleanName("logo\u0000.svg")).toBe("logo.svg");
    expect(cleanName("")).toBe("file");
    expect(cleanName(42)).toBe("file");
  });

  it("formats sizes", () => {
    expect(formatBytes(500)).toBe("1 KB");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
