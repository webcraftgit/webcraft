"use client";

import { createContext, Suspense, useContext, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor, useGLTF, useTexture } from "@react-three/drei";
import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  HueSaturation,
  N8AO,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, Effect, EffectPass, ToneMappingMode, type DepthOfFieldEffect } from "postprocessing";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { damp, damp3 } from "maath/easing";
import * as THREE from "three";
import { useIsMobile } from "@/hooks/useMediaQuery";
import DragSpin from "@/components/showcase/DragSpin";

/* ————————————————————————————————————————————————————————————————
 * BLACKWOOD — the cellar.
 *
 * Composition (metres, +Y up; every asset's origin is its BASE CENTRE, so a
 * y of 0 sits it on the floor — see docs/BLACKWOOD_ASSETS.md):
 *
 *   the gothic OAK TABLE (Poly Haven, CC0, 0.559 tall) at the origin, BOTTLE on it
 *   lantern 1 on the stones front-left; the key spot is the product shadow
 *   barrel B behind right, carrying lantern 2 as a low kicker
 *   the rack (2 tiers × 9 casks) against the back brick wall
 *   stone floor, fogExp2, cold hemisphere fill so it is not amber-on-amber
 *
 * The copy column occupies the left ~25% of the page, so every camera beat
 * aims LEFT of the bottle (baked into each beat's look target) to push the
 * bottle right of centre.
 *
 * Rules that still bind (PROJECT_STATE.md):
 *  - Max 2 WebGL canvases site-wide. This demo owns one.
 *  - Preview card is poster-gated (livePreview:false) — none of this loads on `/`.
 *  - GLBs load as useGLTF(url, "/draco/") — the CDN decoder is CSP-blocked.
 *  - Diffuse maps are SRGBColorSpace; normal + roughness stay LINEAR.
 *  - Glass/Whiskey depth is attenuationColor + attenuationDistance. glTF only
 *    carries flat transmission + IOR; without these the bottle looks like milk.
 * ———————————————————————————————————————————————————————————————— */

export type Quality = "preview" | "full";

/** CP4_46 render tier. "full" = desktop; "mobile" = phones/tablets (same scene,
 *  lean shaders + post, no point-light shadows); "preview" = poster-card path. */
type Tier = "preview" | "mobile" | "full";
const TierCtx = createContext<Tier>("full");
const useTier = () => useContext(TierCtx);

/** Headless-verification hook, inert unless the URL carries ?bwdebug. SwiftShader
 *  renders a frame every few seconds, so the scroll spring never catches up and
 *  a scrolled screenshot shows a mid-flight (or not-yet-drawn) frame. With the
 *  flag, `window.__bwSnap = true` makes the camera jump straight to the scroll
 *  position. Costs one string check at mount. */
const BW_DEBUG = typeof window !== "undefined" && window.location.search.includes("bwdebug");
/** ?bwdebug&bwnopost — skip the composer, to isolate post cost in headless runs. */
const BW_NOPOST = BW_DEBUG && window.location.search.includes("bwnopost");
/** ?bwdebug&bwmerge — CP4_65 A/B: restore the fused ("auto") effect shaders. */
const BW_MERGE = BW_DEBUG && window.location.search.includes("bwmerge");
/** CP4_60 bisect switch for GPU-only artefacts (SwiftShader cannot reproduce
 *  them): ?bwdebug&bwno=ao,dof,bloom,grade,sanitize drops those passes. */
const BW_NO = new Set(
  BW_DEBUG ? (new URLSearchParams(window.location.search).get("bwno") ?? "").split(",").filter(Boolean) : [],
);
const bwOn = (k: string) => !BW_NO.has(k);

/** Top of the LID, not the barrel. The head is recessed 35mm inside the chime
 *  (rim 0.872, lid 0.837 — measured from the source .blend), so anything
 *  standing "on the barrel" stands on the lid, below the rim. */
const BARREL_TOP = 0.837; // barrel B still carries lantern 2
/** CP4_47: the bottle stands on the Poly Haven GOTHIC COFFEE TABLE (CC0), which
 *  replaces the client's leather stool. 1.443 × 1.443 m footprint, top plane a
 *  FLAT 0.5588 measured off the shipped GLB (128 verts within 4 mm of the max,
 *  spanning the full ±0.70 — it is a real plane, not a lip). That is 7.3 mm
 *  above the old seat, so the whole rig moves up by TOP_SHIFT. */
/** The model is 1.443 m square at true scale, which filled the bottom half of
 *  the frame and pushed every carved detail out of shot. CP4_48: 0.75 → 0.62 —
 *  0.89 m across, 0.347 tall. The bottle is 0.2925 tall, so the plinth has to
 *  read as furniture UNDER the product and never as the subject: at 0.62 the
 *  top is ~3 bottle-widths deep instead of 5, and the 2K albedo lands at
 *  ~23 px/cm where the camera gets closest. */
/** CP4_59: the proportions now live IN THE GEOMETRY, not in a non-uniform
 *  scale. `blackwood_table.glb` was re-cut (scripts/blackwood-table-recut.mjs):
 *  the 28 carved foliage PENDANTS hanging under the arches are deleted (they
 *  read as sharp icicles and cluttered the silhouette under the bottle), and
 *  the LEGS are lengthened +1.247 m native through their plain tapered shaft
 *  only — the one span of the model with no vertices (0.02–0.16 native), so
 *  no carving, collar, arch or roundel is distorted. Native height 0.5588 →
 *  1.8058. CP4_57's 2.35x vertical stretch squashed every carved detail; the
 *  scale is UNIFORM again. 0.36 → 0.52 m square, top 0.650 = three quarters
 *  of a barrel (rim 0.872), per the client. Change the height by re-running
 *  the script, NOT by un-uniforming this scale. */
const TABLE_SCALE = 0.36;
const TABLE_NATIVE_H = 1.8058;
const TABLE_TOP = TABLE_NATIVE_H * TABLE_SCALE; // 0.650
const STOOL_TOP = TABLE_TOP; // legacy name, kept so the Caustic maths reads the same
const BOTTLE_Y = TABLE_TOP; // base-centre origin → drops straight onto the top

/** How far the frame is swung left, so the bottle sits right of the copy
 *  column. PROPORTIONAL TO CAMERA DISTANCE, not a fixed world offset — a
 *  constant offset is a gentle nudge at 2.3m and a violent swing at 0.45m,
 *  which threw the bottle off the right edge on the close beats. */

/** Which way the camera swings on the close beat. +1 = around to the right. */

/* ————— the camera path ————————————————————————————————————————————
 * Five beats across the seven sections. Read them as a storyboard:
 *   0.00  high and left, looking down into the room — the floor is the subject
 *   0.32  descending, closing, the bottle starts to own the frame
 *   0.54  close enough to read the label
 *   0.72  swung right around the bottle, raking light across the shoulder
 *   1.00  pulled back — the whole cellar, barrels and both lanterns
 * Interpolated with a smoothstep between beats, then damped, so scroll jitter
 * never shakes the camera. */
type Beat = {
  p: number;
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
};

const PATH: Beat[] = [
  /* CP4_48 — THE BOTTLE IS THE HERO. The old path opened 1.44 m out at fov 34,
   * which put a 0.2925 m bottle across ~15% of frame height above a metre of
   * empty tabletop — the plinth read as the subject. Every beat is now framed
   * on the BOTTLE: distance set so the glass fills ~50–75% of frame height,
   * look target biased LEFT of it so it sits in the right third, clear of the
   * copy column. The table is only ever a foreground edge, the rack is bokeh. */
  // opening: 3/4 front-right, eye just above the shoulder
  { p: 0.0, pos: [0.52, 0.55, 0.7], look: [-0.12, 0.47, -0.02], fov: 32 },
  // closing in
  { p: 0.3, pos: [0.22, 0.5, 0.58], look: [-0.08, 0.47, 0.0], fov: 32 },
  // label at eye level, close enough to read it
  { p: 0.55, pos: [-0.02, 0.47, 0.46], look: [-0.02, 0.46, 0.0], fov: 34 },
  // swung right, raking light across the shoulder
  { p: 0.75, pos: [0.4, 0.52, 0.22], look: [0.0, 0.47, -0.02], fov: 36 },
  // and only now the room — CP4_59: pulled IN from 2.5 m to ~1.2 m (client).
  // At 2.5 m the bottle was ~15% of frame height and dead centre, under a wall
  // of casks. Now ~35%, and the look target is swung ~10° LEFT of the bottle so
  // it holds the right third like every other beat, clear of the copy column.
  // The rack is still the whole background — it is the room reveal — but it
  // is backdrop now, not subject.
  { p: 1.0, pos: [0.62, 0.86, 1.05], look: [-0.68, 0.3, -0.5], fov: 40 },
];


/* CP4_44 SMOOTH CAMERA. The shake had three causes:
 *  1. scrollTop arrives in wheel-notch STEPS, and each step kicked the camera;
 *  2. smoothstep per segment stops the camera dead at every beat (stop-go);
 *  3. position and look-target were damped SEPARATELY, so they lagged by
 *     different amounts and the view twisted on every notch.
 * Now ONE scalar (progress) goes through a critically-damped spring, and both
 * position and target are read from centripetal Catmull-Rom splines at that
 * same value — continuous velocity, no per-beat stops, no relative lag. The
 * camera is SET from the curve, never damped on its own. */
/** The beats above were authored against a 0.3465 tabletop (CP4_48). They are
 *  framing on the BOTTLE, so when the plinth's height changes the whole path
 *  has to ride up with it or the close beats end up looking at the cork — or,
 *  worse, at the table edge. Every beat's Y (camera AND target) is shifted by
 *  the difference, so the table height is now a safe dial: raise the table and the
 *  framing is unchanged, which is exactly what it should be. X/Z are left alone
 *  — the footprint shrank, so the distances still hold. */
const BEAT_Y_REF = 0.3465;
const BEAT_DY = TABLE_TOP - BEAT_Y_REF;
const liftY = (v: [number, number, number]) => new THREE.Vector3(v[0], v[1] + BEAT_DY, v[2]);
const POS_CURVE = new THREE.CatmullRomCurve3(PATH.map((b) => liftY(b.pos)), false, "centripetal");
const LOOK_CURVE = new THREE.CatmullRomCurve3(PATH.map((b) => liftY(b.look)), false, "centripetal");

/** beat progress → curve parameter (each segment gets an equal share of u) */
function curveU(p: number) {
  const t = Math.min(1, Math.max(0, p));
  let i = 0;
  while (i < PATH.length - 2 && t > PATH[i + 1].p) i++;
  const a = PATH[i];
  const b = PATH[i + 1];
  const k = (t - a.p) / (b.p - a.p || 1);
  return { u: (i + k) / (PATH.length - 1), fov: a.fov + (b.fov - a.fov) * k };
}

/* CP4_46: the lantern's creased normals are now BAKED into the GLB
 * (scripts/blackwood-lantern-normals.mjs — three's toCreasedNormals at 50°,
 * then re-welded + Draco). The runtime smoothNormals() pass is gone: it ran
 * toCreasedNormals on the main thread at load and left NON-INDEXED geometry
 * (~141k GPU verts; the baked, indexed file uploads ~72k). */

/* ————— LOOK: every CP4_43 dial in one place ————————————————————————
 * Nothing below has been eyeballed in a browser yet (no GPU in the build
 * sandbox). If something reads wrong, it is almost certainly one of these. */
const LOOK = {
  camDamp: 0.6, //             scroll spring (s) on PROGRESS — higher = smoother, laggier
  /* CP4_58: max background blur RADIUS as a FRACTION OF FRAME HEIGHT. The old
   * dofBokehClose 2.6 / Wide 0.6 were fed straight to bokehScale, which in
   * postprocessing 6.39 is a radius in DRAWING-BUFFER PIXELS (step = texelSize
   * × coc × scale, kernel on the unit disc) — 2.6 px on a 2880×1800 buffer,
   * ~1.3 CSS px. Invisible. That is the whole "DoF does nothing" bug. */
  dofBlurClose: 0.011, //      close beats: casks become soft shapes, hoops go to bokeh
  dofBlurWide: 0.0035, //      wide beat: a hint of lens, the room must still read
  chroma: 0.0007, //           chromatic fringe at the frame edge
  keyIntensity: 26, //         CP4_48 hotter + tighter: the bottle must out-light the wood
  shaftOpacity: 0.035, //      dusty key-light beam
  dustOpacity: 0.32, //        drifting motes (CP4_46: fewer, larger, softer, beam only)
  haloOpacity: 0.28, //        glow in the dusty air around each lantern flame
  causticOpacity: 0.22, //     warm light the whiskey throws onto the seat (was .55: read as a sticker)
  floorEnv: 0.4, //            CP4_46 floor env strength (replaces the planar reflector)
  rackLight: 1.2, //           grazing light along the barrel rack (CP4_59: 3.2 → 1.2, backdrop)
  rackBack: 0.24, //           CP4_45 brightness at the BACK of the rack (1 = no depth shading)
  rackEnds: 0.5, //            …and at the far left/right ends
  rackWall: 0.3, //            brick behind the rack (in its shadow)
  webOpacity: 0.55, //         CP4_45 cobwebs
  /* CP4_59 GRADE — warm subject, cool room. Before: bottle, casks, brick,
   * floor and fog all sat in one amber band, so the product separated by
   * highlight alone and the room had no depth. Now warmth is RESERVED for the
   * bottle and the lantern flames; everything that recedes goes darker, less
   * saturated and cooler (atmospheric perspective). */
  fog: "#07090c", //           was #0a0806 (warm). Cool slate: distance reads as depth
  fogDensity: 0.13, //         was .12
  hemiSky: "#4a5a70", //       cool bounce on every shadow side
  hemiIntensity: 0.2,
  keyColor: "#FFC896", //      was #FFB06A: the whiskey supplies the amber
  rimCool: "#CFE0FF", //       one of the two glass rims goes cool — edge vs body
  roomTint: "#8a8a8f", //      floor albedo multiplier (was white): below the casks
  brickTint: "#77736c", //     was #9a8a7c
  rackColorA: "#E0A06C", //    rack grazers, desaturated (were #FF9A4A / #FF8A3D)
  rackColorB: "#D4966A",
  contrast: 0.12, //           after AgX, which is flat by design
  saturation: -0.1, //         global, after tone mapping
} as const;


/* ————— surface break-up ——————————————————————————————————————————
 * The lantern brass is one flat colour and one roughness — the biggest "CG"
 * tell left on it. It has no UVs, so the mottling works in OBJECT space.
 * Patched once per shared material (clones share materials). */
const NOISE_GLSL = /* glsl */ `
varying vec3 vObjPos;
float bwHash(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float bwNoise(vec3 x){
  vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(bwHash(i),bwHash(i+vec3(1,0,0)),f.x), mix(bwHash(i+vec3(0,1,0)),bwHash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(bwHash(i+vec3(0,0,1)),bwHash(i+vec3(1,0,1)),f.x), mix(bwHash(i+vec3(0,1,1)),bwHash(i+vec3(1,1,1)),f.x),f.y), f.z);
}
#ifndef BW_OCT
#define BW_OCT 4
#endif
float bwFbm(vec3 p){ float a=.5, r=0.; for(int i=0;i<BW_OCT;i++){ r+=a*bwNoise(p); p*=2.03; a*=.5; } return r; }
`;

/** Brass only now: the barrel ships real PBR maps (CP4_38). The lantern still
 *  has no UVs, so its mottling stays procedural. */
function ageBrass(mat: THREE.MeshStandardMaterial) {
  if (mat.userData.__aged) return;
  mat.userData.__aged = true;
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjPos = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\n" + NOISE_GLSL)
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
      float blot = bwFbm(vObjPos * 28.0);
      diffuseColor.rgb *= mix(0.55, 1.05, blot);
      float bwRough = mix(0.22, 0.62, 1.0 - blot);`,
      )
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = bwRough;");
  };
  mat.needsUpdate = true;
}

function CameraRig({ progress }: { progress?: MutableRefObject<number> }) {
  const { camera } = useThree();
  const smooth = useRef({ p: progress?.current ?? 0 });
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    if (BW_DEBUG && (window as unknown as { __bwSnap?: boolean }).__bwSnap) smooth.current.p = progress?.current ?? 0;
    else damp(smooth.current, "p", progress?.current ?? 0, LOOK.camDamp, dt);
    const { u, fov } = curveU(smooth.current.p);
    POS_CURVE.getPoint(u, pos);
    LOOK_CURVE.getPoint(u, look);
    camera.position.copy(pos);
    camera.lookAt(look);
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - fov) > 0.001) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}

/* ————— floor ————————————————————————————————————————————————————
 * A PLANE, deliberately — not tiled geometry. Tiles break no silhouette above
 * the surface, and this camera path looks DOWN at the floor (where a normal
 * map is most accurate) and never drops to a grazing angle beside it. The
 * displacement map was dropped at CP3.9 for the same reason.
 * Diffuse is sRGB; normal + roughness MUST stay linear or the stones go flat. */
/** CP4_43: breaks the 2 m tile repeat, visible from the wide beats — large
 *  damp/dry patches in albedo + roughness, in WORLD space so it never tiles.
 *  Chains after any existing onBeforeCompile. */
function addMacroVariation(mat: THREE.Material) {
  if (mat.userData.__macro) return;
  mat.userData.__macro = true;
  const base = mat.onBeforeCompile.bind(mat);
  mat.onBeforeCompile = (sh, r) => {
    base(sh, r);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBwWorld;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvBwWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBwWorld;\n" + NOISE_GLSL.replace("varying vec3 vObjPos;", ""))
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        float bwMacro = bwFbm(vec3(vBwWorld.xz * 0.35, 1.7));
        float bwDamp = smoothstep(0.52, 0.72, bwFbm(vec3(vBwWorld.xz * 0.6, 8.3)));
        diffuseColor.rgb *= mix(0.72, 1.12, bwMacro) * (1.0 - bwDamp * 0.28);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor - bwDamp * 0.35, 0.18, 1.0);",
      );
  };
  mat.needsUpdate = true;
}

function Floor({ full }: { full: boolean }) {
  const [diff, nor, rough] = useTexture([
    "/textures/dark_planks/diff_2k.webp",
    "/textures/dark_planks/nor_gl_1k.webp",
    "/textures/dark_planks/rough_1k.webp",
  ]);

  useMemo(() => {
    diff.colorSpace = THREE.SRGBColorSpace;
    [diff, nor, rough].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      // CP4_47: Poly Haven dark_wooden_planks, authored as a 2 x 2 m tile —
      // same true scale as the stones it replaces. 26m / 2m = 13.
      t.repeat.set(13, 13);
      t.anisotropy = 16;
      t.needsUpdate = true;
    });
  }, [diff, nor, rough]);

  const normalScale = useMemo(() => new THREE.Vector2(1, 1), []);
  const matRef = (m: THREE.Material | null) => {
    if (m) addMacroVariation(m);
  };

  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[26, 26]} />
      {/* CP4_46: MeshReflectorMaterial removed. It re-rendered the WHOLE scene
          (18 casks, walls, rack) every frame for a reflection it then blurred
          to mush on rough stone. The wet read now comes from the macro damp
          pockets (low roughness) picking up the Environment strips. */}
      <meshStandardMaterial
        ref={matRef}
        map={diff}
        normalMap={nor}
        roughnessMap={rough}
        normalScale={normalScale}
        envMapIntensity={full ? LOOK.floorEnv : 0.35}
        /* 1 = the roughness MAP is authoritative (it multiplies). */
        roughness={1}
        color={LOOK.roomTint}
      />
    </mesh>
  );
}

/* ————— bottle ————————————————————————————————————————————————————
 * CP4_39: the client's textured model (`blackwood_whisky_bottle.blend`),
 * 0.080 × 0.081 × 0.2925 m, origin at base centre. Six meshes / six draw calls,
 * matched BY MATERIAL NAME (substring, case-insensitive):
 *   Glass · Whiskey · LabelPaper · Gold · Brass · CharredOak
 *
 * Label, gold, brass and cork ship REAL PBR maps (base / normal / packed ORM,
 * WebP in the GLB) and are used EXACTLY AS LOADED — the canvas-painted label
 * and the flat colour overrides are gone. The label artwork is in the file.
 *
 * Do NOT run smoothNormals() on it: the exported normals are the authored
 * shading (cork cracks, embossed B on the shoulder, label edge). Re-creasing
 * softens all of it. Same rule as the barrel.
 *
 * Only Glass and Whiskey are rebuilt, because glTF cannot carry what Cycles
 * does with them (see each branch). */
function Bottle() {
  const { scene } = useGLTF("/models/blackwood_bottle.glb", "/draco/");

  const model = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const src = m.material as THREE.MeshStandardMaterial;
      const name = (src?.name ?? "").toLowerCase();
      m.castShadow = true;
      m.receiveShadow = true;

      if (name.includes("glass")) {
        // CP4_41 — ROLES SWAPPED. three's transmission pass only sees OPAQUE
        // objects, so glass and whiskey cannot both be transmissive. CP4_39 made
        // the glass transmissive and faked the liquid as an opaque glowing body —
        // it read as a thick orange blob. Now the LIQUID owns the refraction and
        // the glass is a thin reflective shell: black base colour, additive
        // blending, so it contributes only Fresnel reflections + highlights and
        // never darkens what is behind it. That is also the physics: a 3 mm wall
        // barely refracts; 70 mm of whiskey is what bends and tints the view.
        m.material = new THREE.MeshPhysicalMaterial({
          name: src.name,
          color: "#000000",
          metalness: 0,
          roughness: 1, // × roughnessMap (G) → authored frosted base ring
          roughnessMap: src.roughnessMap,
          normalMap: src.normalMap, // embossed B + seams, now visible in reflections
          normalScale: new THREE.Vector2(0.85, 0.85),
          ior: 1.52,
          specularIntensity: 1,
          clearcoat: 1,
          clearcoatRoughness: 0.04,
          envMapIntensity: 1.6,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false, // must not hide the whiskey drawn before it
          side: THREE.DoubleSide, // inner wall doubles the long highlights
        });
        m.castShadow = false;
        m.receiveShadow = false;
      } else if (name.includes("whiskey") || name.includes("whisky")) {
        // Real transmission: refracts the barrel head, floor and far label
        // behind it. Tint is attenuation, not colour — light loses blue/green
        // over distance, so the thin edges stay pale ginger and the centre goes
        // amber, like the reference. Dials: attenuationDistance (lower = darker),
        // attenuationColor (hue).
        m.material = new THREE.MeshPhysicalMaterial({
          name: src.name,
          color: "#ffffff",
          transmission: 1,
          ior: 1.36, // ethanol/water — from the .blend
          roughness: 0.04,
          metalness: 0,
          thickness: 0.07, // bottle interior is ~74 mm across
          attenuationColor: new THREE.Color("#e59a4a"),
          attenuationDistance: 0.09,
          specularIntensity: 0.35, // the liquid surface sits behind glass — no double glare
          envMapIntensity: 0.4,
        });
        // CP4_43 MENISCUS: the liquid climbs the glass and catches light in a
        // thin bright line — the detail that says "liquid", not "orange solid".
        // Fill-line height from the .blend (0.1327). Side walls only.
        const liquid = m.material as THREE.MeshPhysicalMaterial;
        const fill = (m.geometry.boundingBox ?? (m.geometry.computeBoundingBox(), m.geometry.boundingBox))!.max.y;
        liquid.onBeforeCompile = (sh) => {
          sh.uniforms.uFill = { value: fill };
          sh.vertexShader = sh.vertexShader
            .replace("#include <common>", "#include <common>\nvarying vec3 vBwObj; varying vec3 vBwObjN;")
            .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBwObj = position; vBwObjN = normal;");
          sh.fragmentShader = sh.fragmentShader
            .replace("#include <common>", "#include <common>\nuniform float uFill; varying vec3 vBwObj; varying vec3 vBwObjN;")
            .replace(
              "#include <emissivemap_fragment>",
              `#include <emissivemap_fragment>
              float bwSide = 1.0 - abs(normalize(vBwObjN).y);
              float bwLine = smoothstep(0.0028, 0.0, uFill - vBwObj.y) * bwSide;
              totalEmissiveRadiance += vec3(1.0, 0.72, 0.42) * bwLine * 0.9;`,
            );
        };
        liquid.needsUpdate = true;
        m.castShadow = false;
      } else if (name.includes("label")) {
        // The "dent": the paper is 0.4 mm thick and was DoubleSide + castShadow,
        // so its own back face shadowed its front under the key spot — a dark
        // band down the bowed panel. Paper that thin casts nothing visible.
        src.side = THREE.FrontSide;
        // .35 → .6 (CP4_46): the RectAreaLight card that lit the paper is gone;
        // the soft Lightformer card in <Environment> now does it as IBL diffuse.
        src.envMapIntensity = 0.6;
        // CP4_45 GHOST LABEL FIX. three's transmission pass refracts a SCREEN-SPACE
        // copy of every OPAQUE object — with no depth test against the liquid, so
        // it includes the front label that sits IN FRONT of the whiskey. The
        // refraction offset (largest at the liquid's top face and side walls)
        // then smeared that label up onto the fill line and out to the edges.
        // Moving the paper into the transparent queue keeps it out of that copy.
        // Still fully opaque: opacity 1 + depthWrite, drawn after the liquid.
        src.transparent = true;
        src.opacity = 1;
        src.depthWrite = true;
        m.renderOrder = 2;
        src.needsUpdate = true;
        m.castShadow = false;
      } else if (src && "envMapIntensity" in src) {
        // gold / brass / cork: authored materials, env strength only
        src.envMapIntensity = 0.9;
      }
    });
    /* CP4_58 DEPTH PROXY. The glass shell has depthWrite:false (it must not
     * hide the whiskey), so between the fill line and the capsule — the empty
     * shoulder — the depth buffer held the RACK, 3 m behind. Once DoF actually
     * blurred (same pass), that patch of glass was blurred as background and
     * the shoulder highlights smeared into bokeh blobs. A second, colourless
     * copy of the glass writes DEPTH ONLY, drawn LAST (renderOrder 10, after
     * the whiskey, the glass and the label at 2), so it can occlude nothing
     * that is already on screen but DoF/N8AO now see the glass surface.
     * FrontSide: the near wall is the one in focus. Not in the transmission
     * copy (transparent queue), casts no shadow. Collected first, added after
     * the traverse, so the traverse never visits (and restyles) the proxy. */
    const glass: THREE.Mesh[] = [];
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && (m.material as THREE.Material).name.toLowerCase().includes("glass")) glass.push(m);
    });
    const depthOnly = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
      transparent: true,
      side: THREE.FrontSide,
    });
    for (const g of glass) {
      const proxy = new THREE.Mesh(g.geometry, depthOnly);
      proxy.renderOrder = 10;
      proxy.castShadow = false;
      proxy.receiveShadow = false;
      g.add(proxy);
    }
    return root;
  }, [scene]);

  return <primitive object={model} />;
}

/* ————— Dublin-cut tumbler (CP4_63) ——————————————————————————————————
 * Client model `dublin_cut_whiskey_glass_square_v2.blend`, 548k tris →
 * collapse-decimated to ~51k (scripts/blackwood-glass-export.py), Draco,
 * 197 KB, no textures. 76 × 76 × 95 mm, origin at base centre.
 *
 * A SUPPORTING PROP: left of the bottle and ~12–15 cm behind it on every
 * beat, so it fills the empty top without competing. Placement was checked
 * by projecting both objects through the whole camera path — it only passes
 * behind the bottle on the raking beat (p ≈ .7–.8), which is intended.
 *
 * Transmissive crystal. Rules it relies on:
 *  - It is BEHIND the bottle, so no opaque object sits between camera and it
 *    (the CP4_45 ghost rule). The whiskey is transmissive too, so the glass is
 *    simply absent from the whiskey's refraction — invisible at this size.
 *  - castShadow OFF: three shadows are binary, a crystal would cast a solid
 *    black silhouette. N8AO grounds it instead.
 *  - Writes depth (transmissive default), so DoF treats it as a surface.
 *  - Never smoothNormals(): the export splits normals at 30° so the cut
 *    facets stay faceted. */
const GLASS_POS: [number, number, number] = [-0.155, TABLE_TOP, -0.03];
const GLASS_ROT = 0.75; // a corner towards the camera catches the rim strips

function Tumbler() {
  const { scene } = useGLTF("/models/blackwood_glass.glb", "/draco/");
  const model = useMemo(() => {
    const root = scene.clone(true);
    const crystal = new THREE.MeshPhysicalMaterial({
      name: "Crystal",
      color: "#ffffff",
      metalness: 0,
      roughness: 0,
      transmission: 1,
      ior: 1.52,
      thickness: 0.005, // render check: .012 bent the view onto the dark table edge — the glass read as a dark box
      attenuationColor: new THREE.Color("#fff3e2"),
      attenuationDistance: 0.25,
      specularIntensity: 1,
      // CP4_63 render check: at .9 it read as a dark box — cut crystal only
      // reads through its highlights. Still under the bottle glass's 1.6.
      envMapIntensity: 1.4,
      // CP4_65: dispersion REMOVED — new transmission-shader variant introduced
      // in the same deploy as the white-islands report; not worth the doubt.
      side: THREE.FrontSide,
    });
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.material = crystal;
      m.castShadow = false;
      m.receiveShadow = true;
    });
    return root;
  }, [scene]);
  return (
    <>
      <group position={GLASS_POS} rotation-y={GLASS_ROT}>
        <primitive object={model} />
        <Pour />
      </group>
      {/* CP4_65: the glint pointLight is GONE. A scene light is compiled into
          EVERY lit material's shader (NUM_POINT_LIGHTS), so it changed every
          program in the scene in the deploy that brought the white islands back. */}
    </>
  );
}

/* ————— the pour in the tumbler (CP4_64) ————————————————————————————
 * Cavity measured by raycasting the exported mesh in bpy: flat interior floor
 * at y 0.016, inner half-width 0.0317 (0.0304 on the diagonal → ~4.5 mm
 * corner radius), near-vertical walls up to ~6 cm. The pour is a rounded-
 * square slab 0.5 mm inside the walls, 22 mm deep — a neat double measure.
 * Its bottom corners dip into the floor's edge fillet, which is inside the
 * glass solid and never seen.
 *
 * OPAQUE ON PURPOSE. The glass is transmissive and three's transmission pass
 * only sees opaque objects: an opaque pour is exactly what the crystal then
 * refracts, so the liquid reads THROUGH the cut walls. A transmissive pour
 * would be invisible inside it (same limit as the bottle, CP4_41). The
 * "depth" of the spirit is faked with a view-facing emissive (the CP4_39
 * trick): centre of the slab glows amber, edges fall to a darker rim. The
 * surface gets the bottle's meniscus line. No shadow (a black blob is worse
 * than none; N8AO grounds it). Dials: POUR_H, colour, emissive strength. */
const POUR_FLOOR = 0.0165;
const POUR_H = 0.022;
const POUR_HALF = 0.0312;
const POUR_CORNER = 0.005;

function Pour() {
  const { geometry, material } = useMemo(() => {
    const a = POUR_HALF, r = POUR_CORNER;
    const sh = new THREE.Shape();
    sh.moveTo(-a + r, -a);
    sh.lineTo(a - r, -a);
    sh.quadraticCurveTo(a, -a, a, -a + r);
    sh.lineTo(a, a - r);
    sh.quadraticCurveTo(a, a, a - r, a);
    sh.lineTo(-a + r, a);
    sh.quadraticCurveTo(-a, a, -a, a - r);
    sh.lineTo(-a, -a + r);
    sh.quadraticCurveTo(-a, -a, -a + r, -a);
    const g = new THREE.ExtrudeGeometry(sh, { depth: POUR_H, bevelEnabled: false, curveSegments: 6 });
    g.rotateX(-Math.PI / 2); // extrude +Z → +Y
    g.translate(0, POUR_FLOOR, 0);
    g.computeVertexNormals();
    const top = POUR_FLOOR + POUR_H;
    const m = new THREE.MeshPhysicalMaterial({
      name: "Pour",
      color: "#3a1805", // render check: #6e3510 + .55 glow read as a pale salmon block under AgX
      roughness: 0.06,
      metalness: 0,
      clearcoat: 0.6, // the liquid surface: a sharp second highlight
      clearcoatRoughness: 0.02,
      envMapIntensity: 0.5,
      emissive: "#c9651f",
      emissiveIntensity: 0.0, // driven in the shader below
    });
    m.onBeforeCompile = (shd) => {
      shd.uniforms.uTop = { value: top };
      shd.vertexShader = shd.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vPwObj; varying vec3 vPwObjN;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPwObj = position; vPwObjN = normal;");
      shd.fragmentShader = shd.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float uTop; varying vec3 vPwObj; varying vec3 vPwObjN;")
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          // spirit depth: facing the eye = looking through more whisky = glow
          float pwFace = pow(clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.0);
          // deeper at the bottom (more spirit above the eye line), lit near the surface
          float pwUp = smoothstep(uTop - ${POUR_H.toFixed(4)}, uTop, vPwObj.y);
          totalEmissiveRadiance += vec3(0.62, 0.26, 0.06) * pwFace * (0.08 + 0.16 * pwUp);
          // meniscus: a thin bright line where the liquid meets the wall
          float pwSide = 1.0 - abs(normalize(vPwObjN).y);
          float pwLine = smoothstep(0.0022, 0.0, uTop - vPwObj.y) * pwSide;
          totalEmissiveRadiance += vec3(1.0, 0.68, 0.36) * pwLine * 0.6;`,
        );
    };
    return { geometry: g, material: m };
  }, []);
  return <mesh geometry={geometry} material={material} castShadow={false} receiveShadow />;
}

/* ————— barrels ————————————————————————————————————————————————
 * Poly Haven wine_barrel_01 (CC0), CP4_38. ONE mesh / ONE material with real
 * PBR maps (diffuse 2K, normal 1K, metal+rough packed 1K, WebP inside the GLB),
 * so the material is used exactly as loaded.
 * Do NOT run smoothNormals() on it: the source bakes Weighted Normal modifier
 * output into the exported normals, and re-creasing throws that away (the hoop
 * edges and stave bevels go soft and blobby). Every barrel in the scene shares
 * this one geometry + material through clone(true). */
function Barrel({
  position,
  rotation = 0,
  castShadow = true,
  rack = false,
}: {
  position: [number, number, number];
  rotation?: number;
  castShadow?: boolean;
  /** CP4_45: rack casks get their own material copy with depth shading + dust */
  rack?: boolean;
}) {
  const { scene } = useGLTF("/models/blackwood_barrel.glb", "/draco/");
  const model = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = castShadow;
      m.receiveShadow = true;
      const mat = m.material as THREE.MeshStandardMaterial;
      // Lightformers are tuned for glass; at 1.0 the oak picked up a studio sheen
      if (mat && "envMapIntensity" in mat) mat.envMapIntensity = 0.45;
      if (rack && mat) m.material = rackCaskMaterial(mat);
    });
    return root;
  }, [scene, castShadow, rack]);

  return <primitive object={model} position={position} rotation-y={rotation} />;
}

/* ————— the plinth ————————————————————————————————————————————————
 * CP4_47: Poly Haven `gothic_coffee_table` (CC0) replaces the client's leather
 * stool — which read as cheap pine and carried an unresolved licence. Carved
 * dark oak, 1.443 × 1.443 × 0.5588 m, ONE mesh / ONE material / ONE draw call,
 * 23,836 tris, 848 KB Draco (q14/q10/UV q12). Real PBR maps ship inside the GLB
 * (diff 2K + normal 1K + packed ORM 1K, WebP), so the material is used AS
 * LOADED — envMapIntensity only. AO channel of the ORM is left WHITE on
 * purpose: N8AO does occlusion live, a baked one would double it.
 * Geometry-nodes + weighted-normal modifiers are applied at export and the
 * origin is moved to BASE CENTRE, so it drops onto y=0.
 * Do NOT smoothNormals() it — the weighted normals are the authored shading.
 * Signed volume is positive (CP4_44's inverted-face lesson, checked at export).
 * Export: `scripts/blackwood-table-export.py` (bpy 5.2) + gltf-transform. */
function Table({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  const { scene } = useGLTF("/models/blackwood_table.glb", "/draco/");
  const model = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      const src = m.material as THREE.MeshStandardMaterial;
      if (src) {
        // CP4_48: the top was a big bright plane competing with the glass.
        // Darkened at the MATERIAL (not the light, which also lights the
        // bottle) and given almost no env, so the wood sits under the product.
        src.color = new THREE.Color(0.42, 0.4, 0.38);
        src.envMapIntensity = 0.22;
      }
    });
    return root;
  }, [scene]);
  return (
    <primitive
      object={model}
      position={position}
      rotation-y={rotation}
      scale={TABLE_SCALE}
    />
  );
}

/* ————— lantern ————————————————————————————————————————————————
 * The source point light is not exported, so it is recreated here — deliberate,
 * because it means WE own which one casts shadows. Exactly one does.
 * Flicker is a 3-sine sum so it never settles into a readable loop. */
function Lantern({
  position,
  intensity = 6,
  castShadow = false,
}: {
  position: [number, number, number];
  intensity?: number;
  castShadow?: boolean;
}) {
  const { scene } = useGLTF("/models/blackwood_lantern.glb", "/draco/");
  const light = useRef<THREE.PointLight>(null);
  const seed = useMemo(() => Math.random() * 10, []);

  const model = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const name = ((m.material as THREE.Material)?.name ?? "").toLowerCase();
      if (name.includes("glass")) {
        // transmission + opacity 0.4 made the globe vanish, leaving the cage
        // reading as line art. Soot-tinted, slightly rough glass instead.
        m.material = new THREE.MeshPhysicalMaterial({
          color: "#fff1dc",
          transmission: 1,
          ior: 1.5,
          roughness: 0.12,
          thickness: 0.004,
          attenuationColor: new THREE.Color("#8a5a2c"),
          attenuationDistance: 0.05,
          envMapIntensity: 1.4,
        });
      } else if (name.includes("flame")) {
        // HDR colour, well above 1.0 → this is what the bloom pass keys on
        m.material = new THREE.MeshBasicMaterial({
          color: new THREE.Color("#FF8A3D").multiplyScalar(14),
          toneMapped: false,
        });
      } else {
        const brass = new THREE.MeshStandardMaterial({
          color: "#7a5a32",
          metalness: 1,
          roughness: 0.4,
        });
        ageBrass(brass);
        m.material = brass;
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return root;
  }, [scene]);

  useFrame((state) => {
    if (!light.current) return;
    const t = state.clock.elapsedTime + seed;
    const f =
      Math.sin(t * 2.1) * 0.06 + Math.sin(t * 5.3) * 0.035 + Math.sin(t * 11.7) * 0.02;
    light.current.intensity = intensity * (1 + f);
  });

  return (
    <group position={position}>
      <primitive object={model} />
      <LanternHalo />
      <pointLight
        ref={light}
        // at the WICK (source rig: y≈0.10), inside the cage — so the frame
        // throws real bar shadows across the stones. It was at 0.3, above
        // the globe, which is why the floor pool looked like a spotlight.
        position={[0, 0.13, 0]}
        color="#FF8A3D"
        intensity={intensity}
        distance={7}
        decay={2}
        castShadow={castShadow}
        // CP4_46 2048 → 1024: a cube shadow is SIX renders; with the shadow
        // map now cached (ShadowGate) this is paid on load + drag, not per frame.
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
        // default shadow near plane is 0.5m: the floor (0.13m away) and the
        // cage (0.05m away) sat INSIDE it and never produced a shadow at all
        shadow-camera-near={0.02}
        shadow-camera-far={7}
      />
    </group>
  );
}

/* ————— lighting (CP4_43: product-shot rig) ———————————————————————
 * Premium spirits are lit like jewellery: a big SOFT key, a hard thin RIM
 * that draws the glass edge out of the dark, and practicals (the lanterns)
 * for mood only. The key moved up and out (it stands in for a high cellar
 * window) so its dusty beam can be seen crossing the room. */
/** Rides up with the tabletop (BEAT_DY) so the angle of incidence on the glass
 *  — and therefore the shoulder highlight and the shadow length on the top —
 *  is identical whatever height the table is. */
const KEY_POS: [number, number, number] = [-1.35, 1.85 + BEAT_DY, 0.35];
const HERO: [number, number, number] = [0.02, BOTTLE_Y + 0.14, 0.015]; // bottle midpoint

function KeyLight() {
  const light = useRef<THREE.SpotLight>(null);
  useEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.set(HERO[0], HERO[1] - 0.04, HERO[2]);
    l.target.updateMatrixWorld();
  }, []);
  return (
    <spotLight
      ref={light}
      position={KEY_POS}
      color={LOOK.keyColor}
      intensity={LOOK.keyIntensity}
      distance={8}
      decay={2}
      angle={0.26}
      penumbra={1}
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.01}
      shadow-camera-near={1}
      shadow-camera-far={5}
    />
  );
}

/* ————— room (CP4_43) ————————————————————————————————————————————————
 * The product sat in black fog, which reads as a render. A dim brick corner
 * and a two-tier rack of barrels lying on their sides make it a PLACE, kept
 * dark and edge-lit so it never competes with the bottle. Brick is generated
 * (scripts/blackwood-brick-gen.py), 1 tile = 0.9 m. */
function BrickWall({
  position,
  rotationY = 0,
  w,
  h,
  behindRack = false,
}: {
  position: [number, number, number];
  rotationY?: number;
  w: number;
  h: number;
  /** CP4_45: the brick seen THROUGH the rack gaps was brighter than the rack's
   *  back half and flattened it; the rack's footprint on the wall now sits in
   *  its shadow, feathered at the ends and above the top plate. */
  behindRack?: boolean;
}) {
  const [diff, nor, rough] = useTexture([
    "/textures/brick_wall/diff_1k.webp",
    "/textures/brick_wall/nor_gl_1k.webp",
    "/textures/brick_wall/rough_1k.webp",
  ]);
  useMemo(() => {
    diff.colorSpace = THREE.SRGBColorSpace;
    [diff, nor, rough].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
      t.needsUpdate = true;
    });
  }, [diff, nor, rough]);
  // repeat in the GEOMETRY, so both walls share the same three textures
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, h);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / 0.9, (uv.getY(i) * h) / 0.9);
    return g;
  }, [w, h]);
  return (
    <mesh geometry={geo} position={position} rotation-y={rotationY} receiveShadow>
      <meshStandardMaterial
        map={diff}
        normalMap={nor}
        roughnessMap={rough}
        roughness={1}
        color={LOOK.brickTint}
        envMapIntensity={0.15}
        onBeforeCompile={
          behindRack
            ? (sh) => {
                sh.vertexShader = sh.vertexShader
                  .replace("#include <common>", "#include <common>\nvarying vec3 vBwW;")
                  .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvBwW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
                sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vBwW;").replace(
                  "#include <opaque_fragment>",
                  `#include <opaque_fragment>
                  float bwIn = (1.0 - smoothstep(${(RACK_LEN / 2 - 0.2).toFixed(3)}, ${(RACK_LEN / 2 + 0.5).toFixed(3)}, abs(vBwW.x)))
                             * (1.0 - smoothstep(${(RACK_TOP - 0.1).toFixed(3)}, ${(RACK_TOP + 0.6).toFixed(3)}, vBwW.y));
                  gl_FragColor.rgb *= mix(1.0, ${LOOK.rackWall.toFixed(3)}, bwIn);`,
                );
              }
            : undefined
        }
        customProgramCacheKey={behindRack ? () => "bw-wall-rack" : undefined}
      />
    </mesh>
  );
}

/* CP4_44 RACK — rebuilt as real warehouse racking, measured against the barrel.
 * Barrel profile (from the GLB): bilge r .371 at mid-length, r .340 at ±0.25 m
 * along the axis — where the runners bear. Old rack failed because posts sat
 * INSIDE barrels (post x 1.05 vs barrel 1.17 ± .37) and tier-2 rails cut into
 * tier-1 barrel tops. Now:
 *  - bays of 3 casks at 0.80 pitch; 140 mm posts stand in 260 mm gaps between bays
 *  - front/back RUNNERS bolted to the post faces carry each tier; casks sit on
 *    them bung-up (cooper's practice) with oak chocks either side
 *  - bearers (front-to-back) under tier 2 live in the post gaps, clear of casks
 *  - ground runners lie on the floor; tier-2 runners clear tier-1 by 74 mm
 *  - end frames get diagonal braces; bolts on every front joint
 * Timber is bevelled (RoundedBox — the bevel is what catches the edge light)
 * with procedural grain along each beam's own long axis. */
const RACK_Z = -2.75; // cask centres; heads face the camera
const PITCH = 0.8;
const BAY_GAP = 0.26;
const POST = 0.14;
const BAYS = 3;
const PER_BAY = 3;
const BAY_W = PITCH * PER_BAY + BAY_GAP;
const RACK_X0 = -((BAYS - 1) * BAY_W + (PER_BAY - 1) * PITCH) / 2;
const CASK_X = Array.from({ length: BAYS * PER_BAY }, (_, k) => RACK_X0 + Math.floor(k / PER_BAY) * BAY_W + (k % PER_BAY) * PITCH);
// posts centred in the space between bays (and outside both ends): 318 mm of
// clear air between cask bilges, 140 mm of post → 89 mm clearance each side
const POST_X = Array.from({ length: BAYS + 1 }, (_, b) => RACK_X0 + b * BAY_W - (BAY_W - (PER_BAY - 1) * PITCH) / 2);
const RUNNER_DZ = 0.25; //       runner offset along the cask axis
const RUNNER_H = 0.14;
const RUNNER_W = 0.1;
const POST_DZ = RUNNER_DZ + RUNNER_W / 2 + POST / 2; // posts just outside the runners
const TIER1_TOP = RUNNER_H; //   ground runners lie on the floor
const TIER1_Y = TIER1_TOP + 0.345;
const TIER2_BOTTOM = TIER1_Y + 0.341 + 0.074; // clear of tier-1 casks at the runner line
const TIER2_Y = TIER2_BOTTOM + RUNNER_H + 0.345;
const RACK_TOP = 2.1;
const RACK_LEN = POST_X[POST_X.length - 1] - POST_X[0] + POST;

type Axis = 0 | 1 | 2;

/* ————— CP4_45 rack DEPTH ————————————————————————————————————————————
 * The rack read as one flat lit plane: back posts, back runners and the far
 * ends of each cask were as bright as the heads facing the camera. Real racks
 * are caves — light enters at the heads and dies along the cask. Applied to the
 * FINAL colour (after lighting, before fog), so specular dies with it too;
 * darkening only the albedo would leave the back rails glinting.
 * Every value is world space against the RACK_* constants. */
const f = (n: number) => n.toFixed(4);
const RACK_SHADE_GLSL = /* glsl */ `
float bwRackShade(vec3 W){
  // front of the rack (cask heads) → back: 1.0 → LOOK.rackBack
  float back = smoothstep(${f(RACK_Z + 0.4)}, ${f(RACK_Z - 0.5)}, W.z);
  float s = mix(1.0, ${f(LOOK.rackBack)}, back);
  // anything behind the head plane and under the top plate sits in the cavity
  float inside = smoothstep(${f(RACK_Z + 0.47)}, ${f(RACK_Z + 0.15)}, W.z)
               * (1.0 - smoothstep(${f(RACK_TOP - 0.2)}, ${f(RACK_TOP)}, W.y));
  s *= mix(1.0, 0.72, inside);
  // the far ends of a long rack fall out of the light
  s *= mix(1.0, ${f(LOOK.rackEnds)}, smoothstep(2.2, 4.3, abs(W.x)));
  // floor level is the darkest band
  s *= mix(0.62, 1.0, smoothstep(0.0, 0.7, W.y));
  return s;
}`;

/** Rack casks share the barrel GLB's material; a CLONE carries the depth shade
 *  plus settled dust on up-facing staves, so barrel B stays untouched. */
const rackCaskCache = new WeakMap<THREE.Material, THREE.Material>();
function rackCaskMaterial(src: THREE.MeshStandardMaterial) {
  const hit = rackCaskCache.get(src);
  if (hit) return hit;
  const m = src.clone();
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBwW; varying vec3 vBwN;")
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvBwW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvBwN = normalize(mat3(modelMatrix) * objectNormal);",
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vBwW; varying vec3 vBwN;\n" + NOISE_GLSL.replace("varying vec3 vObjPos;", "") + RACK_SHADE_GLSL,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        float bwDust = pow(clamp(vBwN.y, 0.0, 1.0), 3.0) * smoothstep(0.35, 0.75, bwFbm(vBwW * 7.0));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.075, 0.066, 0.055), bwDust * 0.5);
        roughnessFactor = mix(roughnessFactor, 1.0, bwDust);`,
      )
      .replace("#include <opaque_fragment>", "#include <opaque_fragment>\ngl_FragColor.rgb *= bwRackShade(vBwW);");
  };
  m.customProgramCacheKey = () => "bw-rack-cask";
  rackCaskCache.set(src, m);
  return m;
}

/* ————— CP4_45 DISTRESSED TIMBER ——————————————————————————————————————
 * Replaces the CP4_44 streak-noise oak. Still no textures and no UVs: every
 * feature is built in the beam's OWN frame (local position, long axis `axis`),
 * seeded per beam from its world centre so no two beams share a pattern.
 *   rings      flat-sawn arcs from a pith placed outside the section, fwidth-
 *              faded so they never moiré at rack distance
 *   knots      a dark core with the rings swirling around it (not on every beam)
 *   checks     long drying cracks along the grain — darkest, roughest, sunk
 *   edges      worn lighter and rounder, with chips knocked out
 *   end grain  darker and thirstier than the faces
 *   weather    silver-grey patches, tannin streaks running DOWN, damp at the
 *              floor, dust on anything facing up
 * Height from all of the above drives a derivative bump (no normal map).
 * Colours are LINEAR — the material colour is white and the shader owns it. */
const TIMBER_FRAME = [
  { u: "L.x", cs: "L.yz", hu: "uBwHalf.x", hc: "uBwHalf.yz" },
  { u: "L.y", cs: "L.xz", hu: "uBwHalf.y", hc: "uBwHalf.xz" },
  { u: "L.z", cs: "L.xy", hu: "uBwHalf.z", hc: "uBwHalf.xy" },
] as const;

/* CP4_46 COST. The rack is always 2+ m behind the focus plane, so on the close
 * beats DoF blurs this shader's finest layers into nothing, and on the wide beat
 * the rack fills half the frame. Full: fbm 4 → 3 octaves (the 4th is 6% of the
 * signal and sub-pixel at rack distance). Lite (mobile): 2 octaves and the
 * sub-centimetre layers (checks, chips, dents, derivative bump) are skipped.
 * NOT a texture bake — the RoundedBox beams have no usable UVs; a real bake
 * would need unwrapped geometry. */
function timberMaterial(axis: Axis, size: [number, number, number], lite = false) {
  const m = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.85, metalness: 0 });
  const F = TIMBER_FRAME[axis];
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = (lite ? "#define BW_LITE\n#define BW_OCT 2\n" : "#define BW_OCT 3\n") + sh.fragmentShader;
    sh.uniforms.uBwHalf = { value: new THREE.Vector3(size[0] / 2, size[1] / 2, size[2] / 2) };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBwW; varying vec3 vBwL; varying vec3 vBwC; varying vec3 vBwN;")
      .replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
#ifdef USE_INSTANCING
vBwW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
vBwC = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
#else
vBwW = (modelMatrix * vec4(transformed, 1.0)).xyz;
vBwC = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
#endif
vBwL = transformed;
vBwN = normalize(mat3(modelMatrix) * objectNormal);`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec3 uBwHalf;
varying vec3 vBwW; varying vec3 vBwL; varying vec3 vBwC; varying vec3 vBwN;
${NOISE_GLSL.replace("varying vec3 vObjPos;", "")}
${RACK_SHADE_GLSL}
vec3 bwBump(vec3 pos, vec3 n, float h){
  vec3 sx = dFdx(pos); vec3 sy = dFdy(pos);
  vec3 r1 = cross(sy, n); vec3 r2 = cross(n, sx);
  float det = dot(sx, r1) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
  return normalize(abs(det) * n - grad);
}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec3 L = vBwL;
        float u = ${F.u}; vec2 cs = ${F.cs};
        float hu = ${F.hu}; vec2 hc = ${F.hc};
        float sd1 = bwHash(floor(vBwC * 41.0) + 0.37);
        float sd2 = bwHash(floor(vBwC.zxy * 29.0) + 5.11);
        vec3 nW = normalize(vBwN);
        float up = clamp(nW.y, 0.0, 1.0);

        // knots (about half the beams), rings swirl around them
        float ku = (fract(u * 0.6 + sd1 * 3.0) - 0.5) / 0.6;
        float kc = hc.x * (sd2 * 1.2 - 0.6);
        float kd = length(vec2(ku, (cs.x - kc) * 0.8));
        float kOn = step(0.45, sd2);
        float knot = kOn * smoothstep(0.02, 0.007, kd);
        float kHalo = kOn * smoothstep(0.08, 0.015, kd);

        // growth rings: flat-sawn, pith outside the section
        vec2 pith = hc * vec2(sd1 * 3.6 - 1.8, -1.3 - sd2);
        float warp = bwFbm(vec3(u * 1.4 + sd1 * 20.0, cs * 7.0));
        float rr = length(cs - pith) * 260.0 + warp * 14.0 + u * 1.5 + kHalo * 9.0 / (kd * 50.0 + 1.0);
        float ringAA = clamp(1.0 - fwidth(rr) * 0.8, 0.0, 1.0);
        float late = smoothstep(0.5, 0.88, fract(rr)) * (1.0 - smoothstep(0.9, 1.0, fract(rr))) * ringAA;

        // long streaky fibre
        float fibre = bwFbm(vec3(u * 1.6 + sd2 * 9.0, cs * 150.0));

        // distance to the nearest box edge = second-smallest face distance
        vec3 dd = max(uBwHalf - abs(L), 0.0);
        float edgeD = dd.x + dd.y + dd.z - min(dd.x, min(dd.y, dd.z)) - max(dd.x, max(dd.y, dd.z));
#ifdef BW_LITE
        float crack = 0.0; float chip = 0.0; float dent = 0.0;
        float wear = smoothstep(0.016, 0.0, edgeD);
#else
        // drying checks along the grain
        float cn = bwNoise(vec3(u * 1.6 + sd1 * 31.0, cs.x * 34.0 + sd2 * 7.0, cs.y * 34.0));
        float cn2 = bwNoise(vec3(u * 2.3 + sd2 * 17.0, cs.x * 55.0, cs.y * 55.0 + sd1 * 3.0));
        float crackLine = max(1.0 - smoothstep(0.0, 0.03 + fwidth(cn), abs(cn - 0.5)),
                              0.7 * (1.0 - smoothstep(0.0, 0.02 + fwidth(cn2), abs(cn2 - 0.5))));
        float crack = crackLine * smoothstep(0.3, 0.6, bwNoise(vec3(u * 1.3 + sd1 * 5.0, sd2 * 11.0, 0.5)));

        float wear = smoothstep(0.016, 0.0, edgeD - bwNoise(vBwW * 60.0) * 0.012);
        float chip = smoothstep(0.66, 0.78, bwNoise(vBwW * 95.0)) * smoothstep(0.04, 0.0, edgeD);
        // dents and gouges anywhere on the faces
        float dent = smoothstep(0.74, 0.86, bwNoise(vec3(u * 9.0 + sd1 * 40.0, cs * 60.0)));
#endif
        // blotchy grime: old spills, handling, damp
        float blotch = smoothstep(0.4, 0.8, bwFbm(vBwW * 3.2 + sd2 * 7.0));
        float endGrain = smoothstep(hu - 0.004, hu, abs(u));

        // weather
        float weather = bwFbm(vBwW * 1.4 + sd1 * 10.0);
        float stain = smoothstep(0.46, 0.7, bwFbm(vec3(vBwW.x * 16.0, vBwW.y * 1.0, vBwW.z * 16.0))) * (1.0 - up);
        float damp = smoothstep(0.45, 0.0, vBwW.y) * smoothstep(0.3, 0.7, bwFbm(vBwW * 5.0));
        float dust = up * up * smoothstep(0.3, 0.75, bwFbm(vBwW * 6.5));

        vec3 early = vec3(0.105, 0.064, 0.036);
        vec3 lateC = vec3(0.042, 0.025, 0.014);
        vec3 col = mix(early, lateC, late * 0.55) * mix(0.6, 1.25, fibre);
        col *= 1.0 - blotch * 0.55;
        col *= mix(vec3(0.88, 0.92, 1.0), vec3(1.08, 1.0, 0.9), sd1);
        col = mix(col, vec3(0.02, 0.012, 0.007), knot);
        float lum = dot(col, vec3(0.3, 0.59, 0.11));
        col = mix(col, vec3(lum) * vec3(1.45, 1.36, 1.2), smoothstep(0.38, 0.72, weather) * 0.75 + up * 0.15);
        col = mix(col, col * 1.7 + vec3(0.018, 0.011, 0.006), wear * 0.65);
        col *= 1.0 - chip * 0.6;
        col *= 1.0 - dent * 0.4;
        col *= 1.0 - stain * 0.6;
        col *= 1.0 - endGrain * 0.35;
        col = mix(col, vec3(0.014, 0.016, 0.010), damp * 0.55);
        col *= 1.0 - crack * 0.88;
        col = mix(col, vec3(0.085, 0.075, 0.062), dust * 0.55);
        diffuseColor.rgb = col;

        float bwRough = clamp(0.8 + weather * 0.1 + dust * 0.1 + crack * 0.15 - wear * 0.12, 0.55, 1.0);
        float bwH = (fibre * 0.35 + late * 0.3 - crack * 1.6 - chip * 0.9 - dent * 0.6 + knot * 0.25) * 0.0014;`,
      )
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = bwRough;")
      .replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\n#ifndef BW_LITE\nnormal = bwBump(-vViewPosition, normal, bwH);\n#endif")
      .replace("#include <opaque_fragment>", "#include <opaque_fragment>\ngl_FragColor.rgb *= bwRackShade(vBwW);");
  };
  m.customProgramCacheKey = () => `bw-timber-${axis}-${size.join("x")}-${lite ? "lite" : "full"}`;
  return m;
}

/** One InstancedMesh per timber kind — the whole rack is a handful of draw calls. */
function Timbers({ size, axis, items }: { size: [number, number, number]; axis: Axis; items: [number, number, number][] }) {
  const lite = useTier() !== "full";
  const mesh = useMemo(() => {
    const geo = new RoundedBoxGeometry(size[0], size[1], size[2], 2, Math.min(0.014, Math.min(...size) * 0.2));
    const im = new THREE.InstancedMesh(geo, timberMaterial(axis, size, lite), items.length);
    const m4 = new THREE.Matrix4();
    items.forEach((p, i) => im.setMatrixAt(i, m4.makeTranslation(p[0], p[1], p[2])));
    im.receiveShadow = true;
    im.castShadow = false;
    return im;
  }, [size, axis, items, lite]);
  return <primitive object={mesh} />;
}

function Rack() {
  const lite = useTier() !== "full";
  const parts = useMemo(() => {
    const zF = RACK_Z + POST_DZ;
    const zB = RACK_Z - POST_DZ;
    const midX = (POST_X[0] + POST_X[POST_X.length - 1]) / 2;
    const runnerYs = [TIER1_TOP - RUNNER_H / 2, TIER2_BOTTOM + RUNNER_H / 2];
    const runners: [number, number, number][] = runnerYs.flatMap((y) =>
      [RACK_Z + RUNNER_DZ, RACK_Z - RUNNER_DZ].map((z) => [midX, y, z] as [number, number, number]),
    );
    const posts: [number, number, number][] = POST_X.flatMap((x) => [zF, zB].map((z) => [x, RACK_TOP / 2, z] as [number, number, number]));
    const bearers: [number, number, number][] = POST_X.map((x) => [x, TIER2_BOTTOM - 0.06, RACK_Z]);
    const plates: [number, number, number][] = [zF, zB].map((z) => [midX, RACK_TOP - 0.06, z]);
    const chocks: [number, number, number][] = [];
    [TIER1_TOP, TIER2_BOTTOM + RUNNER_H].forEach((top) =>
      CASK_X.forEach((x) =>
        [-1, 1].forEach((side) =>
          [RACK_Z + RUNNER_DZ, RACK_Z - RUNNER_DZ].forEach((z) => chocks.push([x + side * 0.25, top + 0.045, z])),
        ),
      ),
    );
    const bolts: [number, number, number][] = [];
    POST_X.forEach((x) =>
      runnerYs.forEach((y) => [-0.035, 0.035].forEach((dy) => bolts.push([x, y + dy, zF + POST / 2 + 0.006]))),
    );
    return { runners, posts, bearers, plates, chocks, bolts, zF, zB };
  }, []);

  const braces = useMemo(() => {
    // diagonal end-frame braces (y-z plane, outside the casks)
    const len = Math.hypot(POST_DZ * 2, TIER2_BOTTOM);
    const ang = Math.atan2(TIER2_BOTTOM, POST_DZ * 2);
    // just outside the end posts, so they never pass through post or bearer
    return [POST_X[0] - POST / 2 - 0.045, POST_X[POST_X.length - 1] + POST / 2 + 0.045].map((x) => ({ x, len, ang }));
  }, []);

  const iron = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a2420", metalness: 0.85, roughness: 0.55 }), []);
  const boltMesh = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.013, 0.013, 0.012, 10).rotateX(Math.PI / 2);
    const im = new THREE.InstancedMesh(geo, iron, parts.bolts.length);
    const m4 = new THREE.Matrix4();
    parts.bolts.forEach((p, i) => im.setMatrixAt(i, m4.makeTranslation(p[0], p[1], p[2])));
    return im;
  }, [iron, parts.bolts]);
  const braceMat = useMemo(() => timberMaterial(1, [0.08, 1, 0.08], lite), [lite]);
  const braceGeo = useMemo(() => new RoundedBoxGeometry(0.08, 1, 0.08, 2, 0.012), []);

  return (
    <group>
      <Timbers size={[RACK_LEN, RUNNER_H, RUNNER_W]} axis={0} items={parts.runners} />
      <Timbers size={[POST, RACK_TOP, POST]} axis={1} items={parts.posts} />
      <Timbers size={[0.12, 0.12, POST_DZ * 2 + POST]} axis={2} items={parts.bearers} />
      <Timbers size={[RACK_LEN, 0.12, 0.12]} axis={0} items={parts.plates} />
      <Timbers size={[0.07, 0.09, 0.09]} axis={0} items={parts.chocks} />
      <primitive object={boltMesh} />
      {braces.map((b, i) => (
        <mesh
          key={i}
          geometry={braceGeo}
          material={braceMat}
          position={[b.x, TIER2_BOTTOM / 2, RACK_Z]}
          rotation-x={Math.PI / 2 - b.ang}
          scale={[1, b.len, 1]}
          receiveShadow
        />
      ))}
      {[TIER1_Y, TIER2_Y].map((ty, t) =>
        CASK_X.map((x, i) => (
          <group key={`${t}-${i}`} position={[x, ty, RACK_Z]} rotation-x={Math.PI / 2}>
            {/* bung UP: local +Z bung → world −Y after the lay-down, so turn it π,
                with a little hand-placed jitter */}
            <Barrel position={[0, -0.436, 0]} rotation={Math.PI + Math.sin(i * 12.9898 + t * 78.233) * 0.22} castShadow={false} rack />
          </group>
        )),
      )}
    </group>
  );
}


/* ————— CP4_45 COBWEBS ——————————————————————————————————————————————————
 * Small (10–22 cm) cellar cobwebs in the rack's corners: where the top plate
 * meets a post, and where a post meets the stones. Tangle webs, not orb webs —
 * sagging threads between the two surfaces, a denser sheet in the corner and a
 * few broken strands — painted once into a canvas (no asset). Placed in the
 * plane 20 mm behind the post face, where both surfaces exist and no cask
 * reaches (cask bilges keep 89 mm off the posts; floor webs stay below the
 * tier-1 curve). Lit, not glowing: they only read where the rack light hits. */
function webTexture(seed: number) {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  let r = seed * 9301 + 49297;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  g.lineCap = "round";
  // corner sheet: a faint dusty fan
  const sheet = g.createRadialGradient(0, 0, 0, 0, 0, S * 0.55);
  sheet.addColorStop(0, "rgba(220,210,195,0.22)");
  sheet.addColorStop(1, "rgba(220,210,195,0)");
  g.fillStyle = sheet;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(S * (0.5 + rnd() * 0.3), 0);
  g.quadraticCurveTo(S * 0.25, S * 0.25, 0, S * (0.5 + rnd() * 0.3));
  g.fill();
  // sagging threads from the top edge to the left edge
  const n = 14 + Math.floor(rnd() * 8);
  for (let i = 0; i < n; i++) {
    const a = S * (0.08 + rnd() * 0.9);
    const b = S * (0.08 + rnd() * 0.9);
    const sag = 0.25 + rnd() * 0.35;
    g.strokeStyle = `rgba(235,228,215,${0.35 + rnd() * 0.45})`;
    g.lineWidth = 0.6 + rnd() * 0.9;
    g.beginPath();
    g.moveTo(a, 0);
    g.quadraticCurveTo(a * sag + rnd() * 20, b * sag + rnd() * 20, 0, b);
    g.stroke();
  }
  // radial spokes out of the corner, broken off at random lengths
  for (let i = 0; i < 7; i++) {
    const ang = (Math.PI / 2) * (0.08 + rnd() * 0.84);
    const len = S * (0.35 + rnd() * 0.6);
    g.strokeStyle = `rgba(235,228,215,${0.3 + rnd() * 0.3})`;
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
    g.stroke();
  }
  // two torn strands hanging down with a dust clump
  for (let i = 0; i < 2; i++) {
    const x = S * (0.2 + rnd() * 0.6);
    const y = S * (0.3 + rnd() * 0.5);
    g.strokeStyle = "rgba(230,222,208,0.45)";
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(x, x * 0.35);
    g.quadraticCurveTo(x + 6, y * 0.7, x - 4 + rnd() * 8, y);
    g.stroke();
    g.fillStyle = "rgba(200,190,175,0.35)";
    g.beginPath();
    g.arc(x - 2 + rnd() * 4, y, 1.6 + rnd() * 1.5, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function Cobwebs() {
  const { geo, mats, webs } = useMemo(() => {
    // plane with its TOP-LEFT corner at the origin, growing +x / −y
    const geo = new THREE.PlaneGeometry(1, 1).translate(0.5, -0.5, 0);
    const mats = [0, 1, 2].map(
      (k) =>
        new THREE.MeshStandardMaterial({
          map: webTexture(k + 1),
          color: "#cfc4b2",
          emissive: "#1c150e",
          roughness: 0.5,
          transparent: true,
          opacity: LOOK.webOpacity,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
    );
    const zWeb = RACK_Z + POST_DZ + POST / 2 - 0.02;
    const plateUnder = RACK_TOP - 0.12;
    type Web = { p: [number, number, number]; s: [number, number, number]; m: number };
    const webs: Web[] = [];
    let k = 0;
    // top corners: skip a few so it looks found, not placed
    POST_X.forEach((x, i) =>
      [-1, 1].forEach((side) => {
        k++;
        if ((i * 3 + (side > 0 ? 1 : 0)) % 4 === 2) return;
        const size = 0.12 + ((k * 37) % 10) * 0.01;
        webs.push({ p: [x + side * (POST / 2), plateUnder, zWeb], s: [side * size, size * (0.8 + ((k * 13) % 4) * 0.1), 1], m: k % 3 });
      }),
    );
    // floor corners on the two middle posts + one end
    [1, 2, 3].forEach((i, j) => {
      const side = j % 2 ? 1 : -1;
      const size = 0.1 + j * 0.015;
      webs.push({ p: [POST_X[i] + side * (POST / 2), 0.002, zWeb], s: [side * size, -size * 0.85, 1], m: (j + 1) % 3 });
    });
    return { geo, mats, webs };
  }, []);

  return (
    <group>
      {webs.map((w, i) => (
        <mesh key={i} geometry={geo} material={mats[w.m]} position={w.p} scale={w.s} renderOrder={1} />
      ))}
    </group>
  );
}

/* ————— atmosphere (CP4_43) ————————————————————————————————————————— */
function radialTexture(stops: [number, string][], w = 128, h = 128) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) / 2);
  stops.forEach(([o, col]) => grad.addColorStop(o, col));
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Glow in the dusty air around a flame — below the bloom threshold on
 *  purpose, so it reads as air, not as lens glare. */
function LanternHalo() {
  const mat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: radialTexture([
          [0, "rgba(255,170,90,1)"],
          [0.25, "rgba(255,130,50,0.35)"],
          [1, "rgba(255,110,40,0)"],
        ]),
        color: "#ffffff",
        opacity: LOOK.haloOpacity,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  return <sprite material={mat} position={[0, 0.13, 0]} scale={[0.55, 0.55, 0.55]} />;
}

/** The key's beam through dust: an open cone, additive, soft at the edges
 *  (view-facing term) and fading along its length. */
function KeyShaft() {
  const { geo, mat, pos, quat } = useMemo(() => {
    const start = new THREE.Vector3(...KEY_POS);
    const hero = new THREE.Vector3(...HERO);
    const dir = hero.clone().sub(start).normalize();
    const end = start.clone().addScaledVector(dir, start.distanceTo(hero) + 0.7);
    const len = start.distanceTo(end);
    const g = new THREE.CylinderGeometry(0.04, len * Math.tan(0.36), len, 32, 1, true);
    const m = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: LOOK.shaftOpacity }, uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        varying float vAlong; varying vec3 vN; varying vec3 vV; varying vec3 vW;
        void main(){
          vAlong = uv.y;
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
          vW = (modelMatrix * vec4(position,1.0)).xyz;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uOpacity; uniform float uTime;
        varying float vAlong; varying vec3 vN; varying vec3 vV; varying vec3 vW;
        void main(){
          float edge = pow(abs(dot(vN, vV)), 1.6);
          float len = smoothstep(0.0, 0.45, vAlong) * smoothstep(1.0, 0.85, vAlong);
          float motes = 0.75 + 0.25 * sin(vW.y * 7.0 + vW.x * 4.0 + uTime * 0.25);
          gl_FragColor = vec4(vec3(1.0, 0.72, 0.45) * uOpacity * edge * len * motes, 1.0);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    // cylinder +Y (narrow end) points back at the light
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
    return { geo: g, mat: m, pos: start.clone().add(end).multiplyScalar(0.5), quat: q };
  }, []);
  useFrame((st) => {
    mat.uniforms.uTime.value = st.clock.elapsedTime;
  });
  return <mesh geometry={geo} material={mat} position={pos} quaternion={quat} frustumCulled={false} />;
}

/** Slow motes. Lit only inside the key beam or near a lantern, so the air
 *  looks dusty exactly where light passes through it. */
function Dust({ count = 220 }: { count?: number }) {
  const { gl } = useThree();
  const { geo, mat } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      p[i * 3] = -1.8 + Math.random() * 3.4;
      p[i * 3 + 1] = 0.05 + Math.random() * 2.1;
      p[i * 3 + 2] = -2.0 + Math.random() * 3.4;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const key = new THREE.Vector3(...KEY_POS);
    const dir = new THREE.Vector3(...HERO).sub(key).normalize();
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPR: { value: Math.min(gl.getPixelRatio(), 2) },
        uKey: { value: key },
        uDir: { value: dir },
        uOpacity: { value: LOOK.dustOpacity },
      },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime, uPR; uniform vec3 uKey, uDir;
        varying float vA;
        void main(){
          float t = uTime * (0.02 + aSeed * 0.03) + aSeed * 40.0;
          vec3 p = position + vec3(sin(t * 1.3) * 0.12, sin(t * 0.7 + aSeed * 6.0) * 0.08, cos(t) * 0.12);
          vec3 kp = p - uKey; float along = dot(kp, uDir);
          float radial = length(kp - uDir * along);
          float beam = step(0.0, along) * smoothstep(along * tan(0.36) + 0.02, 0.0, radial);
          // CP4_46: beam only (the lantern term lit motes all over the frame and
          // read as screen noise), and nothing within 0.7 m of the lens — the
          // close motes were the specks sitting on top of the copy.
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vA = beam * smoothstep(0.7, 1.3, -mv.z) * (0.5 + 0.5 * aSeed);
          gl_PointSize = clamp((2.6 + aSeed * 3.4) * uPR * (1.4 / -mv.z), 1.5, 10.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uOpacity; varying float vA;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = pow(smoothstep(0.5, 0.0, d), 1.8) * vA * uOpacity; // soft bokeh disc, no hard core
          gl_FragColor = vec4(vec3(1.0, 0.78, 0.52) * a, 1.0);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo: g, mat: m };
  }, [count, gl]);
  useFrame((st) => {
    mat.uniforms.uTime.value = st.clock.elapsedTime;
  });
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

/** Warm light focused through the whiskey onto the seat, on the side AWAY
 *  from the key. three has no caustics; a soft additive decal is the honest
 *  fake — the eye expects it under a filled bottle. */
function Caustic() {
  const { mat, pos, rotY } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const g = c.getContext("2d")!;
    g.translate(128, 64);
    g.scale(1, 0.5);
    const grad = g.createRadialGradient(-20, 0, 0, 0, 0, 120);
    grad.addColorStop(0, "rgba(255,200,120,1)");
    grad.addColorStop(0.18, "rgba(255,150,60,0.7)");
    grad.addColorStop(0.55, "rgba(220,100,30,0.18)");
    grad.addColorStop(1, "rgba(200,80,20,0)");
    g.fillStyle = grad;
    g.fillRect(-128, -128, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshBasicMaterial({
      map: t,
      transparent: true,
      opacity: LOOK.causticOpacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    });
    const away = new THREE.Vector2(HERO[0] - KEY_POS[0], HERO[2] - KEY_POS[2]).normalize();
    return {
      mat: m,
      pos: [HERO[0] + away.x * 0.075, STOOL_TOP + 0.0012, HERO[2] + away.y * 0.075] as [number, number, number],
      rotY: -Math.atan2(away.y, away.x),
    };
  }, []);
  return (
    <mesh material={mat} position={pos} rotation={[-Math.PI / 2, 0, rotY]}>
      <planeGeometry args={[0.13, 0.065]} />
    </mesh>
  );
}

/* ————— CP4_60 SANITIZE ———————————————————————————————————————————————
 * The client's GPU (AMD, Windows/ANGLE) showed large jagged WHITE islands —
 * over the table, walls, floor, even across the label — that SwiftShader never
 * reproduces. Signature of NON-FINITE pixels: a near-mirror specular (glass
 * clearcoat roughness .04 → three clamps to .0525, GGX peak ~4e4) times a hot
 * key overflows the HALF-FLOAT frame buffers (max 65504) to Inf, and Inf/NaN
 * behaviour is driver-specific. It was invisible until CP4_58: the DoF fill pass
 * is a MAX filter, and at the old 2.6 px radius one bad pixel stayed a speck;
 * at ~20 px it becomes a disc, bloom's mip chain turns the disc into an island,
 * and AgX maps it to white. So the input is cleaned BEFORE anything can spread
 * it: Inf → CEIL, NaN → 0, and anything negative → 0.
 * CEIL 32: the brightest legitimate value in the scene is the flame (colour
 * ×14), so bloom keeps everything it keys on.
 * NaN/Inf are detected on the float's BITS (floatBitsToUint, GLSL ES 3.00 —
 * three r174 compiles every ShaderMaterial as 300 es). The first version used
 * the "NaN fails every comparison" trick; SwiftShader let NaN through it. */
class SanitizeEffect extends Effect {
  constructor(ceil = 32) {
    super(
      "SanitizeEffect",
      /* glsl */ `
uniform float uCeil;
// exponent bits all ones = Inf (mantissa 0) or NaN (mantissa != 0). Tested on
// the BITS: comparison tricks (x != x, !(x <= c)) and isnan() are folded away
// or mis-evaluated by some drivers — SwiftShader let a NaN through the
// comparison version, and one NaN is enough to kill the frame via bloom.
float bwClean(float x) {
  uint u = floatBitsToUint(x);
  if ((u & 0x7F800000u) == 0x7F800000u) return ((u & 0x007FFFFFu) == 0u && x > 0.0) ? uCeil : 0.0;
  return clamp(x, 0.0, uCeil);
}
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  outputColor = vec4(bwClean(inputColor.r), bwClean(inputColor.g), bwClean(inputColor.b), inputColor.a);
}`,
      { uniforms: new Map([["uCeil", new THREE.Uniform(ceil)]]) },
    );
  }
}

/** As its OWN pass, never merged: an Effect sharing an EffectPass with DoF runs
 *  AFTER DoF has already read the raw input in update().
 *  `ceil` defaults to 32 (HDR/linear space, above the ×14 flame). Pass 1.0 for a
 *  pass that runs AFTER tone mapping, where the signal is already [0,1] — see
 *  cleanOut below for why the post-AgX ceiling must be 1, not 32. */
function useSanitizePass(camera: THREE.Camera, ceil?: number) {
  const pass = useMemo(
    () => new EffectPass(camera, new SanitizeEffect(ceil ?? (BW_DEBUG ? Number(new URLSearchParams(window.location.search).get("bwceil") || 32) : 32))),
    [camera, ceil],
  );
  useEffect(() => () => pass.dispose(), [pass]);
  return pass;
}

/* ————— post (CP4_43: lens) ————————————————————————————————————————— */
function Post({ progress, tier }: { progress?: MutableRefObject<number>; tier: Tier }) {
  const { camera } = useThree();
  const dof = useRef<DepthOfFieldEffect>(null);
  const chroma = useMemo(() => new THREE.Vector2(LOOK.chroma, LOOK.chroma), []);
  const target = useMemo(() => new THREE.Vector3(...HERO), []);
  // first thing after the render (before AO reads colour), and again after AO
  // (before DoF / bloom can spread anything AO itself produced)
  const cleanIn = useSanitizePass(camera);
  const cleanMid = useSanitizePass(camera);
  /* CP4_66: the missing pass. Sits BETWEEN DoF and Bloom (see the composer note
   * below). DoF's bokeh divide can emit ±Inf/NaN on D3D; without this, Bloom
   * spreads that speck into a white island. HDR/linear space here, so ceil 32. */
  const cleanDof = useSanitizePass(camera);
  /* CP4_61 — THE WHITE ISLANDS FIX. The client bisected it on their GPU:
   * ?bwno=grade removes them. The grade's own maths cannot make white islands
   * (BrightnessContrast is a subtract/divide, HueSaturation ends in min(c,1)),
   * so the grade is not the bug — the MERGE is. Without a Pass between them,
   * the composer fuses CA + DoF + Bloom + ToneMapping + grade + Vignette +
   * Noise into ONE fragment shader; removing the grade shrinks it, and the
   * artefact goes. Windows Chrome translates that shader to D3D (ANGLE), and a
   * driver-side miscompile of one very large merged shader fits every
   * observation: GPU-specific, never in SwiftShader, and "fixed" by removing
   * mathematically harmless code. A Pass here splits it in two: lens + tone
   * map | grade + finish. It is a sanitize pass because after AgX every value
   * is already in [0,1], so the clamp is a no-op — the pass exists only as the
   * split. DO NOT remove it to "save a pass", and do not grow either half back
   * into one giant merged shader. */
  /* CP4_66: ceil 1.0, not 32. cleanOut runs AFTER AgX, where the signal is
   * already [0,1]. The old shared ceil of 32 meant a surviving non-finite pixel
   * was mapped to 32 here — 32 ≫ 1, i.e. a 32× SUPER-WHITE that clips to a white
   * island. So the very backstop meant to erase the artefact could paint one.
   * Post-tone-map the only defensible clamp is [0,1]: Inf → 1 (legit white at
   * worst), NaN → 0. It can no longer manufacture an island. */
  const cleanOut = useSanitizePass(camera, 1);
  const san = bwOn("sanitize");
  const exposeComposer = (c: unknown) => {
    if (BW_DEBUG && c) (window as unknown as { __bwComposer?: unknown }).__bwComposer = c;
  };
  useFrame(({ gl }) => {
    void progress;
    // by DISTANCE to the bottle, not by scroll: blur follows what is on screen
    const d = camera.position.distanceTo(target);
    const close = 1 - THREE.MathUtils.smoothstep(d, 0.7, 2.6);
    // bokehScale is a PIXEL radius, so scale it by the drawing-buffer height:
    // same look at dpr 1 and dpr 2, on a laptop and on a 4K screen
    const frac = THREE.MathUtils.lerp(LOOK.dofBlurWide, LOOK.dofBlurClose, close);
    // CP4_65: capped. postprocessing also uses bokehScale as a CoC GAIN in its
    // composite + mask (CP4_60 suspect #1); on a dpr-2 screen the uncapped value
    // reached ~20. 12 px keeps dpr-1 screens unchanged.
    if (dof.current) dof.current.bokehScale = Math.min(12, frac * gl.domElement.height);
  });
  return (
    // AO grounds everything, DoF gives the long-lens look (focus locked on the
    // bottle), bloom glows the flames, AgX keeps the amber from clipping.
    tier === "mobile" ? (
      // CP4_46 mobile: same grade (AgX + bloom + vignette) so the look matches
      // desktop, but no AO, no DoF, no chroma, no MSAA (dpr 1 carries it).
      <EffectComposer multisampling={0} ref={exposeComposer}>
        {san ? <primitive object={cleanIn} /> : <></>}
        {bwOn("bloom") ? (
          <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.9} radius={0.75} />
        ) : (
          <></>
        )}
        <ToneMapping mode={ToneMappingMode.AGX} />
        {bwOn("split") ? <primitive object={cleanOut} /> : <></>}
        {bwOn("grade") ? <BrightnessContrast contrast={LOOK.contrast} /> : <></>}
        {bwOn("grade") ? <HueSaturation saturation={LOOK.saturation} /> : <></>}
        <Vignette offset={0.25} darkness={0.72} />
      </EffectComposer>
    ) : (
      /* CP4_66 — WHITE ISLANDS, THE ACTUAL GAP (client, AMD/Windows, section 05).
       * CP4_66a tried a FloatType (RGBA32F) buffer on the overflow theory; the
       * client confirmed the islands SURVIVED it, which rules overflow out — a
       * 3.4e38 ceiling cannot overflow at these magnitudes. So the bad pixels are
       * non-finite from a DIVISION, not a magnitude, and buffer precision is
       * irrelevant. (FloatType reverted: it did nothing here and MSAA + RGBA32F
       * is not reliably multisample-renderable on ANGLE/D3D, i.e. a new risk for
       * no gain.)
       *
       * The real gap: sanitize ran after the render (cleanIn) and after N8AO
       * (cleanMid), but NOT between DoF and Bloom. DepthOfField's bokeh
       * accumulation divides by a per-pixel weight; where that weight rounds to
       * exactly 0 on D3D (not on SwiftShader — the whole reason headless never
       * saw it) the pixel is ±Inf/NaN. Bloom is the very next pass: its mip chain
       * smears that one speck into a frame-spanning blob and AgX maps it to white.
       * cleanDof below cleans DoF's output BEFORE Bloom can spread it, so the
       * spread — the island — can never form. DO NOT remove cleanDof, and do not
       * reorder Bloom before it. */
      <EffectComposer multisampling={4} ref={exposeComposer} mergeMode={BW_MERGE ? "auto" : "none"}>
        {san ? <primitive object={cleanIn} /> : <></>}
        {bwOn("ao") ? <N8AO aoRadius={0.35} distanceFalloff={0.6} intensity={2.2} halfRes /> : <></>}
        {san ? <primitive object={cleanMid} /> : <></>}
        {/* no bokehScale prop: it is set every frame above, and a prop would be
            re-applied over it on any re-render */}
        {bwOn("dof") ? <DepthOfField ref={dof} target={target} worldFocusRange={0.45} /> : <></>}
        {/* CP4_66: clean DoF's output before Bloom can spread a non-finite speck */}
        {san ? <primitive object={cleanDof} /> : <></>}
        {bwOn("bloom") ? (
          <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.9} radius={0.75} />
        ) : (
          <></>
        )}
        <ChromaticAberration
          offset={chroma}
          radialModulation
          modulationOffset={0.35}
          blendFunction={BlendFunction.NORMAL}
        />
        <ToneMapping mode={ToneMappingMode.AGX} />
        {/* CP4_61: splits the merged shader — see cleanOut above */}
        {bwOn("split") ? <primitive object={cleanOut} /> : <></>}
        {/* CP4_59: AgX is flat by design; a touch of contrast and a little
            less saturation after it is the grade, not a second tone map */}
        {bwOn("grade") ? <BrightnessContrast contrast={LOOK.contrast} /> : <></>}
        {bwOn("grade") ? <HueSaturation saturation={LOOK.saturation} /> : <></>}
        <Vignette offset={0.25} darkness={0.72} />
        <Noise opacity={0.035} />
      </EffectComposer>
    )
  );
}

/* CP4_46 SHADOW CACHE. Nothing that casts a shadow moves on its own: the stool,
 * barrel B and both lanterns are static and the flicker changes intensity, not
 * geometry. Only the bottle moves, and only while a visitor drags it. So shadow
 * maps (6 cube faces for the lantern + the key spot) render for the first frames
 * while assets/materials settle, then only when the bottle's world matrix
 * changes. Camera motion never invalidates a shadow map. */
function ShadowGate({ watch }: { watch: MutableRefObject<THREE.Object3D | null> }) {
  const { gl } = useThree();
  const last = useMemo(() => new THREE.Matrix4(), []);
  const warm = useRef(45);
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl]);
  useFrame(() => {
    const o = watch.current;
    let dirty = warm.current > 0;
    if (warm.current > 0) warm.current--;
    if (o) {
      o.updateWorldMatrix(true, false);
      // tolerance, not equals(): after a throw DragSpin's inertia decays
      // exponentially and would keep "changing" the matrix by 1e-12 for ~20 s
      const a = last.elements, b = o.matrixWorld.elements;
      let moved = false;
      for (let i = 0; i < 16 && !moved; i++) moved = Math.abs(a[i] - b[i]) > 1e-5;
      if (moved) {
        last.copy(o.matrixWorld);
        dirty = true;
      }
    }
    if (dirty) gl.shadowMap.needsUpdate = true;
  }, -1);
  return null;
}

function Cellar({ tier, progress }: { tier: Tier; progress?: MutableRefObject<number> }) {
  const full = tier === "full";
  const lit = tier !== "preview"; // the room, key rig and post: desktop + mobile
  const bottleRef = useRef<THREE.Group>(null);
  return (
    <>
      {/* lighter than CP4_41 (.16): the room behind has to survive the fog */}
      <fogExp2 attach="fog" args={[LOOK.fog, LOOK.fogDensity]} />
      <hemisphereLight args={[LOOK.hemiSky, "#0d0a08", LOOK.hemiIntensity]} />
      <ambientLight color="#24262b" intensity={0.06} />

      <Floor full={lit} />

      {/* the plinth: client stool (CP4_42) */}
      <Table position={[0, 0, 0]} rotation={0.4} />
      <group position={[0.02, BOTTLE_Y, 0.015]}>
        {/* idleSpeed 0 and float 0: the CAMERA provides the motion; DragSpin is
            here only so the visitor can still grab it. */}
        <DragSpin idleSpeed={0} float={0}>
          <group ref={bottleRef}>
            <Bottle />
          </group>
        </DragSpin>
      </group>
      {/* CP4_63: supporting prop, left of and behind the bottle */}
      <Tumbler />
      {lit && <Caustic />}

      <Barrel position={[1.38, 0, -1.55]} rotation={-0.6} />

      {lit && (
        <>
          <BrickWall position={[0, 2.25, -3.35]} w={12} h={4.5} behindRack />
          <BrickWall position={[-4.4, 2.25, 0]} rotationY={Math.PI / 2} w={12} h={4.5} />
          <Rack />
          {full && <Cobwebs />}
          {/* grazing along the rack from above-left: hoops and heads catch an
              edge, the bellies stay dark */}
          <pointLight position={[-3.1, 2.3, -1.9]} color={LOOK.rackColorA} intensity={LOOK.rackLight} distance={5.5} decay={2} />
          <pointLight position={[2.9, 1.8, -2.0]} color={LOOK.rackColorB} intensity={LOOK.rackLight * 0.55} distance={4.5} decay={2} />
        </>
      )}

      {/* point-light cube shadows are desktop only; mobile keeps the key spot's */}
      <Lantern position={[-0.66, 0, 0.5]} intensity={4.5} castShadow={full} />
      <Lantern position={[1.38, BARREL_TOP, -1.55]} intensity={3.5} />

      {lit ? (
        <>
          <KeyLight />
          <KeyShaft />
          <Dust count={full ? 220 : 90} />
        </>
      ) : (
        <pointLight position={[-0.62, 0.93 + BEAT_DY, 0.72]} color="#FFA455" intensity={5.5} distance={6} decay={2} />
      )}
      {/* low warm fill from behind-right on the stool body */}
      <pointLight position={[0.85, 0.72, -0.9]} color="#FF7A28" intensity={2.5} distance={4} decay={2} />

      {/* CP4_43 reflections: a warm DARK interior instead of a studio.
          CP4_46: the three RectAreaLights are gone — LTC area lights were
          evaluated on EVERY lit pixel in the room (rack, walls, floor) to put
          two highlights on one bottle. Their jobs moved in here, where they
          cost nothing per frame (frames={1}): the soft card that lit the label
          and shoulder, and the two thin rim strips behind the bottle. */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#060504"]} />
        <Lightformer form="rect" intensity={4} color="#FFC48A" position={[-0.9, 0.9, 0.6]} scale={[0.18, 1.8, 1]} />
        <Lightformer form="rect" intensity={3} color="#FFD9B0" position={[0.9, 0.9, -0.5]} scale={[0.12, 1.6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#FFB066" position={[-1.2, 0.7, 0.9]} scale={[1.4, 1.4, 1]} />
        {/* ex-ProductRects: soft key card (label + shoulder) and the two rims */}
        <Lightformer form="rect" intensity={2.2} color="#FFC48A" position={[-0.75, 0.95 + BEAT_DY, 0.75]} scale={[0.7, 0.9, 1]} target={HERO} />
        <Lightformer form="rect" intensity={3.2} color={LOOK.rimCool} position={[0.42, 0.78 + BEAT_DY, -0.55]} scale={[0.08, 0.8, 1]} target={HERO} />
        <Lightformer form="rect" intensity={2} color="#FFD3A0" position={[-0.45, 0.78 + BEAT_DY, -0.5]} scale={[0.06, 0.7, 1]} target={HERO} />
        <Lightformer form="rect" intensity={0.35} color="#3a3c42" position={[0, 1.2, -3]} scale={[6, 2.5, 1]} />
        <Lightformer form="ring" intensity={0.6} color="#FF8A3D" position={[0, -0.6, 0]} rotation-x={Math.PI / 2} scale={3} />
      </Environment>

      {/* CP4_60 ?bwdebug&bwinf — plants a speck whose colour overflows the
          half-float buffer to Inf, to prove the sanitize pass in headless runs */}
      {BW_DEBUG && window.location.search.includes("bwinf") && (
        <mesh position={[HERO[0] + 0.07, HERO[1] + 0.05, HERO[2] + 0.02]}>
          <sphereGeometry args={[0.003, 8, 8]} />
          <meshBasicMaterial color={new THREE.Color(1, 1, 1).multiplyScalar(Number(new URLSearchParams(window.location.search).get("bwinf") || 1e6))} toneMapped={false} />
        </mesh>
      )}
      <CameraRig progress={progress} />
      {lit && <ShadowGate watch={bottleRef} />}

      {lit && !BW_NOPOST && <Post progress={progress} tier={tier} />}
    </>
  );
}

export default function BlackwoodScene({
  quality = "full",
  progress,
  scrollRot,
  className,
}: {
  quality?: Quality;
  /** page scroll as 0–1 — drives the camera path */
  progress?: MutableRefObject<number>;
  /** legacy: page scroll in radians. Unused — the camera owns the motion now. */
  scrollRot?: MutableRefObject<number>;
  className?: string;
}) {
  const isMobile = useIsMobile();
  const tier: Tier = quality === "preview" ? "preview" : isMobile ? "mobile" : "full";
  const lit = tier !== "preview";
  void scrollRot;
  // CP4_46 adaptive resolution (desktop): start at 1.5, drop to 1 when drei's
  // PerformanceMonitor sees sustained low fps, climb back when it recovers,
  // and settle at 1 if it keeps flip-flopping. Mobile is pinned at 1.
  const [dpr, setDpr] = useState(tier === "full" ? 1.5 : 1);

  return (
    <Canvas
      className={className}
      shadows={lit ? "soft" : false}
      dpr={dpr}
      gl={{ antialias: !lit, // MSAA lives in the composer when lit
         alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0.52, 0.55 + BEAT_DY, 0.7], fov: 32, near: 0.05, far: 40 }}
      onCreated={({ gl, scene, camera }) => {
        // lit: tone mapping is done ONCE, in the composer (AgX). Leaving it on
        // the renderer too would tone-map twice.
        gl.toneMapping = lit ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
        scene.background = new THREE.Color(LOOK.fog); // CP4_59: matches the fog, or the horizon shows a seam
        if (BW_DEBUG) Object.assign(window, { __bw: { gl, scene, camera, tier } });
      }}
    >
      {tier === "full" && (
        <PerformanceMonitor
          bounds={() => [45, 58]}
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(1.5)}
          flipflops={3}
          onFallback={() => setDpr(1)}
        />
      )}
      <TierCtx.Provider value={tier}>
        <Suspense fallback={null}>
          <Cellar tier={tier} progress={progress} />
        </Suspense>
      </TierCtx.Provider>
    </Canvas>
  );
}

useGLTF.preload("/models/blackwood_bottle.glb", "/draco/");
useGLTF.preload("/models/blackwood_barrel.glb", "/draco/");
useGLTF.preload("/models/blackwood_table.glb", "/draco/");
useGLTF.preload("/models/blackwood_glass.glb", "/draco/");
useGLTF.preload("/models/blackwood_lantern.glb", "/draco/");
