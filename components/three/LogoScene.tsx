"use client";

import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Environment } from "@react-three/drei";
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
 * MOBILE REFLECTIONS WITHOUT THE 1.5MB HDRI — A SMALL COPY OF THE SAME HDRI.
 *
 * ————— WHY THIS IS NOT A PROCEDURAL LIGHT BOX ANYMORE —————
 * CP4_52 and the first half of CP4_53 tried to hand-build the environment out
 * of `Lightformer` panels. Four measured passes, all wrong, in both directions:
 *   v1  bright panel facing the mark  -> flat cyan slab, 2x desktop brightness
 *   v2  dark camera side              -> mean lum 45 vs desktop 63, near-black
 *   v3  bright/dark split at the rear -> NO change at all (TL 64 / TR 67)
 *   v4  same split brought in close   -> blew out to near-white (mean 185)
 * The lesson is structural, not a tuning failure. A metal at roughness .22
 * reflects its surroundings almost specularly, so the face IS a picture of the
 * environment. Six flat panels have no picture in them — whatever you do with
 * their intensities you get a flat face, a blown face, or a dead one. The
 * desktop mark looks the way it does because it is reflecting a real outdoor
 * plate with structure in it.
 *
 * So mobile now reflects THE SAME PLATE, just small: `potsdamer_platz_256.hdr`
 * is the desktop 1k file resized to 256x128, which is **99KB against 1.5MB**.
 * Same environment means the same look by construction rather than by tuning —
 * which is exactly the client's ask, "the same as on PC, just smaller".
 *
 * Regenerate it with (needs opencv-python):
 *   im    = cv2.imread('public/potsdamer_platz_1k.hdr',
 *                      cv2.IMREAD_ANYDEPTH | cv2.IMREAD_COLOR)
 *   small = cv2.resize(im, (256,128), interpolation=cv2.INTER_AREA)
 *   # INTER_AREA averages, which clips the sun's peak (11.81 -> 7.56) and takes
 *   # the specular bite with it; re-seat the top 0.5% before writing.
 *   hi = small > np.percentile(small, 99.5); small[hi] *= 11.81/7.56
 *   cv2.imwrite('public/potsdamer_platz_256.hdr', small)
 *
 * At 99KB this sits inside the asset budget with room to spare, and it loads
 * AFTER the static SVG fallback has already painted, so LCP is untouched.
 */
const MOBILE_HDR = "/potsdamer_platz_256.hdr";
/* ————— WHY THE MOBILE ENVIRONMENT IS ROTATED —————
 * Measured, particles off, mark pixels only. Desktop: mean 62, TL 90, TR 58,
 * BL 50, BR 44. Mobile with the same plate unrotated: mean 52, TL 59, and the
 * other three quadrants ALREADY within a few points. So the whole deficit was
 * one thing — the top-left hotspot was missing.
 *
 * It is missing for a geometric reason that no amount of lighting fixes. A
 * face reflects the view ray back into the front hemisphere, so the patch of
 * sky it samples depends on how far off-axis it sits. Desktop's mark spans
 * ~+/-29 deg, so its top-left reaches ~16 deg out and catches bright sky.
 * `FitGroup` shrinks the mobile mark to ~0.29, so it spans only ~+/-9 deg and
 * its top-left reaches ~5 deg — it never gets there. Proven three ways: wide
 * emitter panels changed nothing (TL 64/TR 67 twice), narrow ones blew the
 * whole face out uniformly (mean 185), and raising azimuth here lifts every
 * quadrant together rather than tilting them. `envMapIntensity` 1.4 -> 3.0
 * moved the mean by 2 points, so it is not the lever either.
 *
 * Rotating the plate brings that bright region INTO the narrow cone the small
 * mark actually samples. (0.06, 0.22) measures mean 68, TL 85, TR 64, BL 63,
 * BR 53, left/right 1.26 against desktop's 1.37 — top-left brightest, falling
 * off to the right and down, which is the shape of the desktop mark.
 *
 * IT IS A COMPROMISE, AND THE REMAINING GAP IS NOT FIXABLE HERE. Desktop's
 * across-face contrast comes from the mark being angularly 3.4x larger. The
 * only ways to close it fully are to enlarge the mark or move the camera in,
 * and the client has signed off on the current size — so do not "fix" this by
 * touching FitGroup or REFERENCE_WIDTH. */
const MOBILE_ENV_ROT = new THREE.Euler(0.06, 0.22, 0);

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
  /* Both platforms load an HDRI now (mobile a 99KB 256x128 copy of the same
     plate), so the metallic material runs everywhere. Only a genuine LOAD
     FAILURE drops us back to the matte fallback. */
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
      /* MOBILE dpr 1.5 -> 2 (CP4_53). On a dpr-3 phone a 390x844 canvas was
         rendering into a 585x1266 buffer — half native — and every bevel edge
         and all four pixel fragments arrived upscaled and soft. Desktop is
         1:1; this is the other half of the mobile/desktop parity gap. Still
         capped well under the device's own 3, so the fill cost is bounded. */
      dpr={[1, 2]}
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
        {/* CP4_53: the mobile ambient boost (.42) is gone. It was added when
            the procedural env was three small emitters and the mark needed
            propping up; against a full box it just washes the faces flat and
            works against the dark camera-side hemisphere above. Both platforms
            now run the same .3, which is the point — parity, not compensation. */}
        <ambientLight intensity={0.3} />

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

        {/* Reflections. SAME PLATE ON BOTH PLATFORMS — 1k on desktop, the
            99KB 256x128 copy on mobile — so the mark's shading is the same
            picture at two resolutions rather than two different lighting
            models that have to be reconciled by hand. Both go through the
            same error boundary, so a failed fetch on either drops to the
            matte fallback instead of killing the WebGL context. */}
        <EnvErrorBoundary
          fallback={<EnvMapFallback />}
          onFail={() => setEnvFailed(true)}
        >
          <Suspense fallback={<EnvMapFallback />}>
            <Environment files={isMobile ? MOBILE_HDR : LOCAL_HDR} environmentRotation={isMobile ? MOBILE_ENV_ROT : undefined} />
          </Suspense>
        </EnvErrorBoundary>
      </Suspense>
    </Canvas>
  );
}
