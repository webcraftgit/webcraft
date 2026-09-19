"use client";

import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import LogoMesh from "./LogoMesh";
import FitGroup from "./FitGroup";
import ParticleField from "./ParticleField";
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/useMediaQuery";

/**
 * Graceful fallback when the HDR fails to load.
 * Matches the manual lights already in the scene, so nothing looks broken —
 * the logo just loses its reflections and nobody notices on a first visit.
 */
/**
 * MOBILE REFLECTIONS WITHOUT THE 2.8MB HDRI.
 *
 * The HDRI is desktop-only on purpose (asset budget + LCP), and without ANY
 * env map the CP1.2 fallback has to drop metalness .9 -> .3, which strips the
 * mark of every highlight and most of its modelling — it reads as a flat blue
 * cutout instead of the extruded, beveled solid it is on desktop.
 *
 * A procedural Environment fixes that at zero download cost: a few Lightformer
 * emitters rendered ONCE (`frames={1}`) into a tiny 64px cube map. That is
 * enough for a metallic surface to have something to reflect, so mobile can
 * run the SAME material as desktop. The same technique the Blackwood scene
 * uses (CP4_43) rather than hoping real lights show up in the reflection.
 *
 * Positions echo the two directional lights below, so the reflections agree
 * with the lighting instead of fighting it.
 */
function ProceduralEnv() {
  return (
    <Environment resolution={64} frames={1}>
      {/* A METAL SURFACE SHOWS ITS ENVIRONMENT, SO THE ENVIRONMENT HAS TO BE
          MOSTLY FULL. The first attempt used three small emitters; at
          metalness .9 the mark then reflected mostly black and read darker
          than the matte fallback it replaced. These six large panels are a
          cheap studio box — bright above, dim below, cool at the sides — so
          there is something to reflect in every direction, and the two
          brighter cards on top of it draw the actual highlights. */}
      <Lightformer form="rect" intensity={1.35} color="#BFE4FF" position={[0, 520, 0]} scale={[1400, 1400, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.5} color="#0E2036" position={[0, -520, 0]} scale={[1400, 1400, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.85} color="#2E7FB8" position={[-560, 0, 0]} scale={[1200, 1200, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.85} color="#2E7FB8" position={[560, 0, 0]} scale={[1200, 1200, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.75} color="#1E5F92" position={[0, 0, -560]} scale={[1200, 1200, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.95} color="#7FC6F0" position={[0, 0, 560]} scale={[1200, 1200, 1]} target={[0, 0, 0]} />

      {/* key card, upper-left — the long highlight down the strokes */}
      <Lightformer form="rect" intensity={4.5} color="#F0F9FF" position={[-360, 340, 300]} scale={[380, 380, 1]} target={[0, 0, 0]} />
      {/* brand rim, lower-right and behind — separates the bevel from the page */}
      <Lightformer form="rect" intensity={3} color="#7DD3FC" position={[380, -160, -240]} scale={[300, 300, 1]} target={[0, 0, 0]} />
    </Environment>
  );
}

function EnvMapFallback() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[0, 200, 100]} intensity={0.6} color="#A5F3FC" />
    </>
  );
}

/**
 * Error boundary scoped to the Environment subtree.
 *
 * R3F's <Suspense> catches loading states; this catches load ERRORS (fetch
 * failed, 403, network timeout). Without it, a failed useLoader call throws
 * an uncaught exception that propagates out of the Canvas, kills the WebGL
 * context, and takes down the whole page.
 *
 * Scoped tightly: only the env map is inside this boundary. A failure here
 * never reaches the Canvas, the page, or the application error overlay.
 */
class EnvErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onFail?: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    // Visible in Vercel's function logs — useful if the HDR URL ever rotates.
    console.warn("[LogoScene] Environment map failed to load:", err);
    // Tell the scene the env map is gone so the logo material can drop its
    // metalness — a near-metallic surface with nothing to reflect renders
    // almost black, which reads as a "shadow" of the W instead of the logo.
    this.props.onFail?.();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * The local HDR file fixes two separate production failures:
 *
 * 1. NETWORK: `<Environment preset="city">` fetches from
 *    raw.githack.com/pmndrs/drei-assets — an external CDN we don't control.
 *    In production that request fails intermittently (rate-limit, outage,
 *    DNS) and throws, killing the WebGL context.
 *
 * 2. CSP: next.config.mjs sets connect-src 'self' <supabase> <fontshare>.
 *    raw.githack.com is not on that list, so the browser blocks the fetch
 *    with a CSP violation before it even hits the network.
 *
 * Fix: host the file ourselves. /public/potsdamer_platz_1k.hdr ships with
 * the build, so the fetch is same-origin and CSP-clean.
 *
 * Download command (run once from the project root):
 *   curl -L "https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/potsdamer_platz_1k.hdr" \
 *        -o public/potsdamer_platz_1k.hdr
 * File is ~2.8MB. Vercel serves it from the CDN edge, so the cost is one
 * build-time upload — not a per-request external fetch.
 */
const LOCAL_HDR = "/potsdamer_platz_1k.hdr";

export default function LogoScene({ onReady }: { onReady?: () => void }) {
  const isMobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  // Desktop uses the HDR env map for reflections. If it fails to load, drop the
  // material's metalness so the W stays a lit blue solid instead of a shadow.
  const [envFailed, setEnvFailed] = useState(false);
  /* Mobile now gets a procedural env map (see ProceduralEnv), so it can run
     the same material as desktop. Only a genuine LOAD FAILURE of the desktop
     HDRI drops us back to the matte fallback. */
  const hasEnvMap = !envFailed;

  // CP4_46: only render while the hero is on screen AND no demo player covers
  // the page. R3F's default loop renders every frame forever, so the logo and
  // its 400 particles kept drawing behind the fullscreen Blackwood scene.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [playerOpen, setPlayerOpen] = useState(false);
  useEffect(() => {
    const el = canvasRef.current;
    const io = el ? new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting)) : null;
    if (el && io) io.observe(el);
    const onPlayer = (e: Event) => setPlayerOpen(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener("webcraft:demo-player", onPlayer);
    return () => {
      io?.disconnect();
      window.removeEventListener("webcraft:demo-player", onPlayer);
    };
  }, []);

  return (
    <Canvas
      ref={canvasRef}
      frameloop={onScreen && !playerOpen ? "always" : "never"}
      camera={{ position: [0, 0, 320], fov: 45 }}
      dpr={[1, isMobile ? 1.5 : 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
      onCreated={() => onReady?.()}
      aria-hidden
    >
      <Suspense fallback={null}>
        {/* Soft key light, top-left */}
        <directionalLight position={[-180, 220, 160]} intensity={1.2} color="#E0F2FE" />
        {/* Brand rim light */}
        <directionalLight position={[200, -80, -120]} intensity={0.8} color="#38BDF8" />
        {/* Mobile keeps a touch more ambient: the procedural env is a handful
            of emitters, not a full city, so it fills less than the HDRI. */}
        <ambientLight intensity={isMobile ? 0.42 : 0.3} />

        {/* ONLY THE MARK IS FITTED. It is ~330 world units wide against a
            ~122-unit viewport on a phone, so without FitGroup the hero is a
            wall of cyan. Capped at 1, so desktop is unchanged.

            THE PARTICLES ARE DELIBERATELY OUTSIDE IT. They were briefly inside
            — the reasoning being that a shrunken mark with a full-size swarm
            would look mismatched — and the opposite happened: at the phone fit
            scale (~0.2) the swarm collapsed into a small band in the middle of
            the screen instead of filling it. The swarm is ambient depth, not
            part of the mark's composition, so it stays at world scale and
            spills off every edge exactly as it does on desktop. */}
        <FitGroup>
          <LogoMesh interactive={!isMobile && !reduced} hasEnvMap={hasEnvMap} />
        </FitGroup>
        {!reduced && <ParticleField count={isMobile ? 200 : 400} />}

        {/* Reflections. Desktop: self-hosted HDR, error-bounded. Mobile: the
            procedural cube map above — same material either way. */}
        {isMobile ? (
          <ProceduralEnv />
        ) : (
          <EnvErrorBoundary
            fallback={<EnvMapFallback />}
            onFail={() => setEnvFailed(true)}
          >
            <Suspense fallback={<EnvMapFallback />}>
              <Environment files={LOCAL_HDR} />
            </Suspense>
          </EnvErrorBoundary>
        )}
      </Suspense>
    </Canvas>
  );
}
