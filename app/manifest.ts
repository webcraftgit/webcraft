import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

/**
 * Web app manifest (CP4_17-seo). Not a ranking factor by itself, but it is
 * what gives an installed/pinned shortcut a real name and icon instead of a
 * screenshot of the page, and mobile-friendliness signals read it.
 *
 * The icon entries point at /public/icon.svg and /public/apple-icon.png, the
 * same two files app/layout.tsx declares. Replace those and everything follows.
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
    ],
  };
}
