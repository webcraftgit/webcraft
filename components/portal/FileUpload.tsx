"use client";

import { useRef, useState } from "react";
import type { PortalFile } from "@/lib/portal/data";
import { MAX_BYTES, MAX_FILES, checkUpload, formatBytes, mimeOf, type UploadKind } from "@/lib/portal/uploads";
import { confirmUploadAction, removeUploadAction, requestUploadAction } from "@/app/portal/[token]/actions";

type Lang = "pl" | "en";
type Pending = { key: string; name: string; progress: number; error?: string };

const T = {
  pl: {
    drop: { logo: "Przeciągnij tu logo albo", photo: "Przeciągnij tu zdjęcia albo" },
    pick: "wybierz pliki",
    rules: (max: number) => `JPG, PNG, WebP, HEIC, SVG, PDF · do ${Math.round(MAX_BYTES / 1024 / 1024)} MB na plik · maks. ${max} plików`,
    remove: "Usuń",
    removing: "Usuwanie…",
    uploaded: (n: number) => `Przesłane: ${n}`,
    errors: {
      bad_type: "Ten typ pliku nie jest obsługiwany.",
      too_big: `Plik jest większy niż ${Math.round(MAX_BYTES / 1024 / 1024)} MB.`,
      empty: "Plik jest pusty.",
      too_many: "Osiągnięto limit plików.",
      rate_limited: "Za dużo przesyłania naraz. Spróbuj za kilka minut.",
      locked: "Ankieta została już wysłana.",
      default: "Nie udało się przesłać. Spróbuj ponownie.",
    } as Record<string, string>,
  },
  en: {
    drop: { logo: "Drag your logo here or", photo: "Drag your photos here or" },
    pick: "choose files",
    rules: (max: number) => `JPG, PNG, WebP, HEIC, SVG, PDF · up to ${Math.round(MAX_BYTES / 1024 / 1024)} MB each · max ${max} files`,
    remove: "Remove",
    removing: "Removing…",
    uploaded: (n: number) => `Uploaded: ${n}`,
    errors: {
      bad_type: "This file type isn't supported.",
      too_big: `The file is larger than ${Math.round(MAX_BYTES / 1024 / 1024)} MB.`,
      empty: "The file is empty.",
      too_many: "File limit reached.",
      rate_limited: "Too many uploads at once. Try again in a few minutes.",
      locked: "This questionnaire has already been sent.",
      default: "Upload failed. Please try again.",
    } as Record<string, string>,
  },
} as const;

/** PUT the file to the signed URL with progress (fetch can't report upload progress). */
function put(url: string, file: File, mime: string, onProgress: (p: number) => void): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    // Same body shape as supabase-js uploadToSignedUrl; the Blob's type is
    // what storage records as the content type.
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", new Blob([file], { type: mime }), file.name);
    xhr.send(body);
  });
}

export default function FileUpload({
  token, kind, lang, files, onChange, labelledBy,
}: {
  token: string;
  kind: UploadKind;
  lang: Lang;
  files: PortalFile[];
  onChange: (update: (prev: PortalFile[]) => PortalFile[]) => void;
  labelledBy: string;
}) {
  const t = T[lang];
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const mine = files.filter((f) => f.kind === kind);

  const patch = (key: string, p: Partial<Pending>) =>
    setPending((list) => list.map((x) => (x.key === key ? { ...x, ...p } : x)));

  async function uploadOne(file: File, key: string, countBefore: number) {
    const mime = mimeOf(file.name, file.type);
    const local = checkUpload({ kind, mime, size: file.size }, countBefore);
    if (local) return patch(key, { error: t.errors[local] ?? t.errors.default });

    const slot = await requestUploadAction(token, { kind, mime, size: file.size }).catch(() => null);
    if (!slot?.ok) return patch(key, { error: t.errors[slot?.reason ?? ""] ?? t.errors.default });

    const sent = await put(slot.url, file, mime, (p) => patch(key, { progress: p }));
    if (!sent) return patch(key, { error: t.errors.default });

    const done = await confirmUploadAction(token, { path: slot.path, name: file.name }).catch(() => null);
    if (!done?.ok) return patch(key, { error: t.errors[done?.reason ?? ""] ?? t.errors.default });

    onChange((prev) => [...prev, done.file]);
    setPending((list) => list.filter((x) => x.key !== key));
  }

  async function add(list: FileList | null) {
    if (!list?.length) return;
    const batch = Array.from(list).map((file, i) => ({ file, key: `${Date.now()}-${i}-${file.name}` }));
    setPending((p) => [...p.filter((x) => !x.error), ...batch.map(({ file, key }) => ({ key, name: file.name, progress: 0 }))]);
    // One at a time: predictable on a phone connection, and the count limit
    // stays accurate without racing.
    let count = mine.length;
    for (const { file, key } of batch) {
      await uploadOne(file, key, count);
      count++;
    }
    if (input.current) input.current.value = "";
  }

  async function remove(f: PortalFile) {
    setRemoving(f.id);
    const r = await removeUploadAction(token, f.id).catch(() => null);
    setRemoving(null);
    if (r?.ok) onChange((prev) => prev.filter((x) => x.id !== f.id));
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); void add(e.dataTransfer.files); }}
        className={`rounded-input border border-dashed p-5 text-center transition-colors ${
          over ? "border-brand-400 bg-brand-400/10" : "border-[var(--glass-border)]"
        }`}
      >
        <p className="text-[14.5px] text-ink">
          {t.drop[kind]}{" "}
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="font-medium text-brand-300 underline decoration-brand-400/40 underline-offset-4 hover:decoration-brand-300"
          >
            {t.pick}
          </button>
        </p>
        <p className="mt-1.5 text-[12.5px] text-ink-soft">{t.rules(MAX_FILES[kind])}</p>
        <input
          ref={input}
          type="file"
          multiple
          accept="image/*,.heic,.heif,.svg,application/pdf"
          aria-labelledby={labelledBy}
          onChange={(e) => void add(e.target.files)}
          className="sr-only"
          tabIndex={-1}
        />
      </div>

      {pending.length > 0 && (
        <ul className="space-y-2" aria-live="polite">
          {pending.map((p) => (
            <li key={p.key} className="rounded-input border border-[var(--glass-border)] px-3 py-2 text-[13.5px]">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-ink">{p.name}</span>
                {p.error ? (
                  <span className="shrink-0 text-red-300">{p.error}</span>
                ) : (
                  <span className="shrink-0 tabular-nums text-ink-soft">{Math.round(p.progress * 100)}%</span>
                )}
              </div>
              {!p.error && (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/5" aria-hidden>
                  <div className="h-full bg-brand-400 transition-[width]" style={{ width: `${p.progress * 100}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {mine.length > 0 && (
        <>
          <p className="text-[13px] text-ink-soft">{t.uploaded(mine.length)}</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {mine.map((f) => (
              <li key={f.id} className="overflow-hidden rounded-input border border-[var(--glass-border)] bg-[rgba(5,8,15,0.55)]">
                <div className="grid aspect-[4/3] place-items-center bg-white/[0.03]">
                  {f.preview ? (
                    // Signed, short-lived storage URL: next/image would try to
                    // optimise (and cache) a private file, so a plain <img>.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.preview} alt="" className={`size-full ${kind === "logo" ? "object-contain p-3" : "object-cover"}`} />
                  ) : (
                    <span className="text-[12px] font-medium uppercase tracking-wider text-ink-soft">
                      {f.original_name.split(".").pop()}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] text-ink" title={f.original_name}>{f.original_name}</span>
                    <span className="block text-[11.5px] text-ink-soft">{formatBytes(f.size_bytes)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void remove(f)}
                    disabled={removing === f.id}
                    aria-label={`${t.remove}: ${f.original_name}`}
                    className="shrink-0 rounded-full border border-[var(--glass-border)] px-2.5 py-1 text-[12px] text-ink-soft hover:border-red-400/50 hover:text-red-300 disabled:opacity-50"
                  >
                    {removing === f.id ? t.removing : t.remove}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
