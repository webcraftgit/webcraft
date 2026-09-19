import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

/**
 * Web app manifest (CP4_17-seo). Not a ranking factor by itself, but it is
 * what gives an installed/pinned shortcut a real name and icon instead of a
 * screenshot of the page, and mobile-friendliness signals read it.
 *
 * The icon entries point at the files Next generates from app/icon.svg and
 * app/apple-icon.svg. Replace those two files and everything here follows.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Webcraft — studio cyfrowe",
    short_name: "Webcraft",
    description:
      "Tworzymy strony internetowe, które zamieniają wyświetlenia w sprzedaż.",
    lang: DEFAULT_LOCALE,
    start_url: "/",
    display: "standalone",
    background_color: "#05080F",
    theme_color: "#05080F",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  };
}
