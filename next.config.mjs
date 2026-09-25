/** @type {import('next').NextConfig} */

// Security headers (CP6-backend). Everything here is a default-deny that we
// then poke holes in for things the site actually uses — Fontshare (Clash
// Display) and Supabase (auth + API). Add nothing without a reason.
//
// CSP note, honestly stated: script-src keeps 'unsafe-inline' because Next's
// bootstrap/flight payload is inlined and a nonce-based policy forces every
// page to render dynamically — which would cost us the static hero and the
// LCP budget. The XSS surface here is small (no user-generated content is
// rendered anywhere on the marketing site), so the trade is deliberate.
// If /admin ever renders inquiry text as HTML, revisit this immediately.
const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // 'wasm-unsafe-eval' (CP3.9) is required by the self-hosted Draco decoder in
  // /public/draco — WebAssembly.instantiate is blocked by a bare script-src.
  // It permits WASM compilation only; it does NOT re-enable eval() for JS.
  // Without it the Blackwood models fail in PRODUCTION ONLY (dev has
  // 'unsafe-eval'), which is the same trap as the CP6 HDRI bug.
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline' https://api.fontshare.com",
  "font-src 'self' https://cdn.fontshare.com data:",
  // `https:` added CP4_3. Photos pointed at ANY off-domain host (Unsplash CDN,
  // S3, a client's asset host) were silently killed by a bare `'self'` — the
  // browser blocks the request before the network, so the <img> just never
  // arrives and there is no network error to read. Same failure shape as the
  // CP6 HDRI and CP3.9 Draco bugs. This is a narrow loosening: images cannot
  // execute, `script-src`/`connect-src`/`object-src` are untouched, so the
  // worst case is a third-party host seeing a referer. Self-hosting photos in
  // /public is still preferred — this exists so a remote URL FAILS LOUDLY on
  // its own merits rather than being blocked by policy nobody remembers.
  "img-src 'self' data: blob: https:",
  // blob: + data: → three.js CanvasTextures and the R3F offscreen canvases
  "worker-src 'self' blob:",
  // blob: → GLTFLoader decodes textures EMBEDDED in a .glb (barrel + bottle
  // since CP4_38/39) by wrapping them in a blob: URL and loading it with
  // ImageBitmapLoader, which uses fetch() — so it is connect-src, NOT img-src,
  // that must allow blob:. Without it every embedded map fails ("Couldn't load
  // texture blob:…") and the models render flat white. blob: URLs can only be
  // minted by this page's own JS, so this opens no network destination.
  `connect-src 'self' blob: ${SUPABASE_HOST} https://api.fontshare.com`.trim(),
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // stop advertising the framework
  // Pin the Turbopack root to this project. Without it, Next 16 walks up and
  // can latch onto a stray lockfile in a parent directory as the workspace
  // root, which changes how files resolve. Keep it explicit.
  turbopack: { root: import.meta.dirname },
  // CP4_17-seo: /showcase used to be a rendered page whose only job was to call
  // redirect(), which costs a render and returns a TEMPORARY 307 — telling
  // crawlers to keep coming back and to leave the old URL in the index. A
  // config redirect is a 308 handled before any React runs, so the move is
  // declared once and permanently. (The hash is client-side and is preserved
  // by the browser, not by the redirect.)
  async redirects() {
    return [{ source: "/showcase", destination: "/#showcase", permanent: true }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // the dashboard must never be cached by a proxy or a shared browser
      {
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
