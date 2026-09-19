# Blackwood — converted assets (CP3.9; barrel + floor CP4_38; bottle CP4_39; stool CP4_42)

Source `.blend` files were **Blender 5.2** (new-style header `BLENDER17-01v0502`).
Converted headlessly with `bpy==5.2.0` + `@gltf-transform/cli` 4.4.2.
Everything below is real-world scale in metres, +Y up, origin at the **base centre**
of each object — drop them on `y = 0` and they sit on the floor.

## Models — `/public/models/`

| File | Tris | Size (gz-ish, Draco) | Dimensions (m) |
|---|---|---|---|
| `blackwood_stool.glb` | 13,364 | 676 KB (incl. 3 WebP maps) | 0.35 × 0.35 × 0.552 (seat 0.5515) |
| `blackwood_bottle.glb` | 76,000 | 974 KB (incl. 13 WebP maps) | 0.080 × 0.081 × 0.2925 |
| `blackwood_lantern.glb` | 47,116 | 188 KB | 0.185 × 0.152 × 0.469 |
| `blackwood_barrel.glb` | 10,820 | 851 KB (incl. 3 WebP maps) | 0.742 × 0.742 × 0.872 (lid top 0.837) |

**Total: ~2.0 MB** (barrel and bottle textures are embedded in their GLBs). Draco-compressed (`KHR_draco_mesh_compression`).
Lantern uses position q14 / normal q10, the barrel q14 / q12 / UV q12 — invisible at these
dimensions. **The bottle uses q16/q12 (UV q14)**: its liquid mesh sits inside the glass
shell with millimetres of clearance, and coarser quantisation pushes the two
through each other at the surface line.

### Bottle — client model `blackwood_whisky_bottle.blend` — CP4_39
Replaces the CP3.10 bottle (untextured, canvas-painted label). Textures came separately as
`blackwood_textures_png.zip` — the `.blend` only LINKS them (nothing packed); re-send both
together if it ever changes.

- **6 meshes / 6 materials / 6 draw calls:** `Glass`, `Whiskey`, `LabelPaper`, `Gold`,
  `Brass`, `CharredOak`. 0.080 × 0.081 × 0.2925 m, +Y up, origin at base centre.
  Whiskey fill line at 0.133 m.
- **Textures** (packed ORM = R AO / G roughness / B metallic, normals OpenGL +Y = glTF):
  label base 2K (q92 — small text), gold / brass 1K, cork (`oak_*`) **resized to 512**
  (≈30 px on screen), glass ORM 512×1024. Whiskey has no maps by design. AO (R) is not used.
- **Glass normal cleaned, lossless.** Its signal is tiny (median tilt 0.3°) with sparse real
  features (embossed B, seams, up to 18°). Lossy WebP erased the features along with the
  dither noise; lossless kept the noise too (453 KB). Tilts <0.8° are flattened (nothing >2°
  changes by more than 2 levels) → lossless at 27 KB. Script in the CP4_39 notes.
- **Label normal dropped** — max tilt 1.6°, invisible, was 172 KB.
- `doubleSided` kept only on `Glass` and `LabelPaper`. Draco edgebreaker q16 / q12 / UV q14
  (liquid sits millimetres inside the glass — CP3.10 rule).
- **In three.js only Glass and Whiskey are rebuilt** (`BlackwoodScene.tsx`, CP4_41): three's
  transmission pass sees opaque objects only, so only ONE of them can refract. The **whiskey**
  is transmissive (IOR 1.36, thickness 70 mm, ginger attenuation `#e59a4a` @ 0.09 m); the
  **glass** is a reflective shell — black base, additive blending, `depthWrite:false`, keeping
  the model's normal + roughness maps. Label: FrontSide, no castShadow (its 0.4 mm thickness
  self-shadowed into a "dent"). Everything else used as loaded. **Never `smoothNormals()` it.**
- Verified: final GLB decoded and rendered in Cycles against the client's reference render —
  label orientation, maps, fill level and proportions match.

### Stool — client model `stool.blend` — CP4_42
Replaces barrel A as the bottle's plinth (barrel B stays, carrying lantern 2).

- 0.35 × 0.35 × 0.552 m, +Y up, origin at floor centre. **Seat surface y = 0.5515** under the
  bottle footprint (raycast in the .blend: 0.5512–0.5518 within ±35 mm) → `STOOL_TOP`.
- Source: 48 objects (legs, aprons, stretchers, 3 seat planks, leather cushion with
  Bevel/Subsurf/Displace, 24 nails, 4 tacks), 5 **fully procedural** materials — no images, and
  no UVs on wood or leather. glTF can carry none of that, so:
  1. modifiers applied, all parts joined → **1 mesh / 1 material / 1 draw call**, 13,364 tris;
  2. Smart UV Project + pack (margin .004);
  3. Cycles-baked to one atlas: base colour (DIFFUSE, colour only), roughness, tangent normal
     (OpenGL, includes the procedural bump), metallic (via an emission rewire — Cycles has no
     metallic pass). Wood clearcoat weight is NOT baked (glTF core has no slot) — lost.
  4. **AO nodes neutralised before baking.** The materials multiplied Blender AO into the
     colour: frozen fake shading, and N8AO already does it live. They also made the bake
     noisy and ~10× slower on the 1-core sandbox.
- Atlas base colour **2K** (q88, WebP), normal + packed metal/rough **1K** (q92) — 676 KB total. All-2K was 1.39 MB; the normal/MR difference is invisible at the closest beat. Baked at 2K from 4 samples/px (texture AA only). Draco edgebreaker q14 / q12 / UV q14.
- Scripts: `scripts/blackwood-stool-bake.py` (bake) and `scripts/blackwood-stool-export.py`
  (material rebuild + raycast + glTF export). Paths inside are sandbox paths — edit before reuse.
- CP4_43: re-exported with **two material slots** (`StoolLeather`, `StoolWood`) sharing the one atlas, so three.js
  can give the leather sheen/wear and the wood its lacquer back.

### Lantern
The source file contained **four overlapping copies** at the same origin. Two were
50-part / 47k-tri and two were 37-part / 98k-tri. The 50-part variant is a strict
superset — it has 13 extra detail parts (bail eyes and washers, guard clips, cap
emblem, badge panel, drum top rim, ring tab) *and* less than half the triangles
(the 37-part version has 35k-tri air tubes vs 8k). **The 50-part variant is the one
exported;** the other three copies were discarded.

50 parts were joined by material family into **3 meshes / 3 draw calls**:

| Material | Blender values | Notes for R3F |
|---|---|---|
| `M_AntiqueBrass` | metal 1.0, rough 0.34 | See caveat below |
| `M_GlobeGlass` | rough 0.045, IOR 1.52, transmission 1.0, alpha 0.16 | Override with `MeshPhysicalMaterial` |
| `M_Flame` | emissive `#FF4D0B`, strength 22 | Override; drive bloom from this |

The source also carried a point light per lantern: colour `(1, 0.305, 0.061)`,
energy 12 W, radius 0.028, positioned at `y = 0.10` (local). Lights are **not**
exported — recreate them in R3F so we control shadow casting.

> **Caveat — the brass is flat.** `M_AntiqueBrass` gets its aged mottling from
> procedural Noise → ColorRamp nodes, which have no glTF equivalent, and the
> lantern has **no UV layers**, so baking them to a texture would mean
> auto-unwrapping 50 parts first. The GLB therefore carries flat
> metal 1.0 / rough 0.34 brass. At mid-ground distance under lantern light this
> reads acceptably; if it looks too clean once the scene is lit, the fix is a
> cheap procedural roughness break-up in `onBeforeCompile`, not a bake.

### Barrel — Poly Haven `wine_barrel_01` (CC0) — CP4_38
Replaces the author LOD0/LOD1 vertex-colour barrels (deleted). Source: client-supplied
`wine_barrel_01_4k_blend.zip` (Blender 2.93 file, 4K diffuse/rough JPG + metal/normal EXR).

- **4 objects (body, lid, base, bung) → 1 mesh / 1 material `Barrel_Oak` / 1 draw call.**
  Modifiers applied at export (Triangulate, Geometry Nodes on lid/base, **Weighted Normal**).
  The weighted normals are baked into the exported normals — **never run `toCreasedNormals`
  on this mesh**, it destroys them.
- Real-world metres, +Y up, origin at base centre (min y 0.0007). Height 0.872 to the chime,
  but the **head is recessed: lid surface is y = 0.837** — that is where the bottle and lantern
  stand (`BARREL_TOP` in the scene).
- Textures embedded as `EXT_texture_webp`: diffuse **2K** sRGB (q85, 508 KB), normal **1K**
  (OpenGL/+Y = glTF convention, renormalised after downsampling, q92, 141 KB), metal+rough
  packed into glTF `metallicRoughnessTexture` **1K** (160 KB). Normal at 2K was tried and cost
  +400 KB for a difference invisible at the closest camera beat.
- `doubleSided` forced off. Draco edgebreaker, position q14 / normal q12 / UV q12.
- Pipeline: bpy 5.2.2 (Python 3.13) → `.glb` → `@gltf-transform` 4.5 node script (webp + draco).
- Verified by decoding the final GLB and rendering it in Cycles on the new floor next to the
  bottle and lanterns: textures, orientation, scale and lid height all correct.

## Floor — `/public/textures/stone_pathway/` — Poly Haven `stone_pathway` (CC0) — CP4_38
Replaces `stone_path/` (deleted). Source: client-supplied `stone_pathway_4k_blend.zip`.

| File | Size | Colour space |
|---|---|---|
| `diff_2k.webp` | 481 KB | sRGB |
| `nor_gl_1k.webp` | 277 KB | Linear (OpenGL-convention normal, `+Y` up) |
| `rough_1k.webp` | 79 KB | Linear, greyscale |

**Total 837 KB**, down from 83 MB of source.

- **Tile scale is 2 × 2 m** — the source `.blend` maps the texture 1:1 onto a 2 m plane. On the
  26 m floor plane that is `repeat = 13`. Wrong repeat is the first thing that makes the scene
  look like a toy (CP4_37 had 3.25 m tiles → ~1 m flagstones).
- Displacement dropped again (24 MB PNG, plane floor, camera never grazes it).
- EXR → WebP; normal renormalised after the 4K → 1K downsample. Normal at 2K = 1.3 MB, rejected.
- `roughness={1}` on the material so the roughness MAP is authoritative (three multiplies them).

Set `colorSpace = SRGBColorSpace` on the diffuse map only. The other two must stay linear or
the stones go flat.

## Brick wall — `/public/textures/brick_wall/` — generated, CP4_43
`diff_1k.webp` (48 KB, sRGB) · `nor_gl_1k.webp` (187 KB, linear, OpenGL +Y) · `rough_1k.webp`
(45 KB, linear). Made by `scripts/blackwood-brick-gen.py` (numpy, seamless): 1 tile = 0.9 m =
4 bricks × 12 courses of 215 × 65 mm with 10 mm joints; per-brick tone, burnt headers, chipped
arrises, spalling, soot/damp blotches, efflorescence. No licence question — it is ours. Tiling
is done in the wall GEOMETRY's UVs so both walls share one texture set. Seen only dim, fogged
and edge-lit; a scanned brick set would be the upgrade if the room ever comes into focus.

## Draco decoder — `/public/draco/`

Self-hosted (760 KB, from `three@0.174.0`) — required, not optional. `connect-src
'self'` blocks the usual Google/jsDelivr decoder CDN, which is exactly how the CP6
HDRI bug happened. Wire it as `useGLTF(url, '/draco/')`.

`draco_decoder.js` is the 512 KB JS fallback; only fetched when WASM is
unavailable. The 192 KB `.wasm` is what actually loads.

**`next.config.mjs` CSP was amended in this checkpoint**: `script-src` gained
`'wasm-unsafe-eval'`. Without it `WebAssembly.instantiate` is blocked and every
model fails **in production only** — dev already has `'unsafe-eval'`.

## Still open

- **Licence unverified.** No licence text is embedded in either `.blend`. The stone
  path is a Poly Haven-style CC0 set, fine. Confirm the lantern and barrel permit
  redistribution before these GLBs go live — anything in `/public` is a public
  download.
- **Budget guard.** ~3.4 MB of assets total (CP4_42) (902 KB at CP3.9). Per CP3.6 the gallery cards render live
  previews on `/`, so this must **not** load on the home page: Blackwood's preview
  card should be a static poster with WebGL deferred to fullscreen open.


_CP4_43 total: 3.7 MB._


## CP4_47 — table + plank floor (both Poly Haven, CC0)

| File | Source | Size | Notes |
|---|---|---|---|
| `models/blackwood_table.glb` | `gothic_coffee_table` | 848 KB | 23,836 tris, 1 mesh / 1 material, Draco q14/q10/UV q12, diff 2K + nor 1K + ORM 1K WebP embedded |
| `textures/dark_planks/*` | `dark_wooden_planks` | 875 KB | diff 2K (sRGB) + nor_gl 1K + rough 1K, LINEAR; 2 × 2 m tile → `repeat` 13 on the 26 m plane |

Table: geometry-nodes and weighted-normal modifiers applied at export, origin at base
centre, **rendered at `TABLE_SCALE` 0.75** (1.08 m across, top **0.4191**) because true
scale (1.443 m) filled half the frame. ORM's AO channel is white — N8AO does it live.
Never `smoothNormals()` it. Export: `scripts/blackwood-table-export.py` + gltf-transform.

Deleted here: `models/blackwood_stool.glb`, `textures/stone_pathway/`.
