/* ————————————————————————————————————————————————————————————————
 * WIŚNIOWA — brand mark (candidate 2a from the design round).
 *
 * Two equal cherries on green stems rising to a single join. Slightly ovoid
 * bodies, a darker rim along the lower edge, a dimple where each stem meets
 * the fruit, and one tilted highlight on the upper-right of the RIGHT cherry.
 * No leaf, no gradients — flat fills only, so it stays crisp at any size and
 * costs nothing to render.
 *
 * `plain` drops the highlight and the rim. Use it below ~24px (favicon, inline
 * footer marks): at that size the highlight is a single pale pixel that reads
 * as a rendering artefact rather than as shine, and the rim muddies the
 * silhouette. Same shape, fewer lies.
 * ———————————————————————————————————————————————————————————————— */

export const CHERRY = "#B33A45";
export const CHERRY_RIM = "#8E2C36";
export const STEM = "#4C6257";

export function CherryMark({
  size = 32,
  plain = false,
  mono,
  className = "",
  title,
}: {
  size?: number;
  plain?: boolean;
  /** Render the whole mark in one colour (e.g. on a dark footer). */
  mono?: string;
  className?: string;
  title?: string;
}) {
  const body = mono ?? CHERRY;
  const rim = mono ?? CHERRY_RIM;
  const stem = mono ?? STEM;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {/* stems — both rise from one join at the top */}
      <path
        d="M32,9 C27.5,19 23.5,25.5 21.4,32.5"
        fill="none"
        stroke={stem}
        strokeWidth="3.1"
        strokeLinecap="round"
      />
      <path
        d="M32,9 C36.5,18.5 40.5,25 42.6,31.2"
        fill="none"
        stroke={stem}
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      {/* the nub where the two stems meet */}
      <circle cx="32" cy="9" r="2.4" fill={stem} />

      {/* left cherry — slightly ovoid, wider than tall */}
      {!plain && <ellipse cx="20.6" cy="44.4" rx="10.1" ry="9.6" fill={rim} />}
      <ellipse cx="20.6" cy="43.2" rx="10.1" ry="9.6" fill={body} />
      {/* dimple at the stem attachment */}
      <ellipse cx="21.4" cy="34.2" rx="2.5" ry="1.5" fill={rim} opacity={plain ? 0 : 0.85} />

      {/* right cherry */}
      {!plain && <ellipse cx="43.2" cy="43.9" rx="9.5" ry="9.0" fill={rim} />}
      <ellipse cx="43.2" cy="42.8" rx="9.5" ry="9.0" fill={body} />
      <ellipse cx="42.6" cy="34.4" rx="2.3" ry="1.4" fill={rim} opacity={plain ? 0 : 0.85} />

      {/* the highlight — upper-right of the right cherry only */}
      {!plain && !mono && (
        <ellipse
          cx="46.9"
          cy="38.4"
          rx="2.9"
          ry="1.9"
          fill="#FFFFFF"
          opacity="0.72"
          transform="rotate(-34 46.9 38.4)"
        />
      )}
    </svg>
  );
}

/**
 * Horizontal lockup: mark + STOMATOLOGIA over Wiśniowa.
 * `compact` drops the eyebrow for tight bars (mobile header, sticky bar).
 */
export function Wordmark({
  compact = false,
  onDark = false,
}: {
  compact?: boolean;
  onDark?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <CherryMark size={compact ? 24 : 30} plain={compact} />
      <span className="flex flex-col leading-none">
        {!compact && (
          <span
            className="wis-sans"
            style={{
              fontSize: 8.5,
              letterSpacing: "0.19em",
              color: onDark ? "rgba(246,244,239,.62)" : "#8A8A83",
              marginBottom: 3,
            }}
          >
            STOMATOLOGIA
          </span>
        )}
        <span
          className="wis-serif"
          style={{
            fontSize: compact ? 17 : 19,
            letterSpacing: "0.005em",
            color: onDark ? "#F6F4EF" : "#1D2421",
          }}
        >
          Wiśniowa
        </span>
      </span>
    </span>
  );
}
