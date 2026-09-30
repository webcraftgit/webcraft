/**
 * Shown for any link that doesn't resolve: mistyped, replaced by a new link,
 * or an archived project. Deliberately one message for all of them, so the
 * page says nothing about which links exist. Bilingual because we don't know
 * the client's language without a project.
 */
export default function PortalNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="glass w-full max-w-[460px] rounded-panel p-8">
        <p className="eyebrow">Weturn</p>
        <h1 className="mt-2 font-display text-2xl font-medium text-ink">Ten link nie działa</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
          Mógł zostać zastąpiony nowym albo wpisany z błędem. Napisz do nas, a wyślemy aktualny link.
        </p>
        <hr className="my-6 border-[var(--glass-border)]" />
        <h2 className="font-display text-lg font-medium text-ink">This link doesn&apos;t work</h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
          It may have been replaced by a new one, or mistyped. Write to us and we&apos;ll send you the current link.
        </p>
      </div>
    </main>
  );
}
