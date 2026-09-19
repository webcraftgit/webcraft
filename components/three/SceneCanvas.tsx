"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

/**
 * Dynamic wrapper: the static SVG renders instantly (fast LCP),
 * then cross-fades to the 3D scene once Three.js is ready.
 */
const LogoScene = dynamic(() => import("./LogoScene"), {
  ssr: false,
  loading: () => null,
});

export default function SceneCanvas() {
  const [ready, setReady] = useState(false);

  return (
    <div className="relative h-full w-full">
      {/* Static fallback — visually complete before any JS */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        src="/logo-w.svg"
        alt="Webcraft logo"
        animate={{ opacity: ready ? 0 : 0.9 }}
        transition={{ duration: 0.8 }}
        className="absolute left-1/2 top-1/2 w-[52%] max-w-[420px] -translate-x-1/2 -translate-y-1/2"
      />
      <motion.div
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0"
      >
        <LogoScene onReady={() => setReady(true)} />
      </motion.div>
    </div>
  );
}
