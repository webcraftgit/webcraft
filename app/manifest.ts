import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

/**
 * Web app manifest (CP4_17-seo). Not a ranking factor by itself, but it is
 * what gives an installed/pinned shortcut a real name and icon instead of a
 * screenshot of the page, and mobile-friendliness signals read it.
 *
 * The icon entries point at /public/icon.svg, /public/apple-icon.png and the
 * icon-192/512 PNGs (rendered from icon.svg), as declared in app/layout.tsx.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Weturn — studio cyfrowe",
    short_name: "Weturn",
    description:
      "Tworzymy strony internetowe, które zamieniają wyświetlenia w sprzedaż.",
    lang: DEFAULT_LOCALE,
    start_url: "/",
    display: "standalone",
    background_color: "#05080F",
    theme_color: "#05080F",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
