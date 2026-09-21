// CP4_59 — re-cut the Poly Haven gothic coffee table for Blackwood.
//   1. delete the 28 carved foliage PENDANTS hanging under the arches
//   2. lengthen the legs through their plain tapered shaft ONLY
//
// Input MUST be the CP4_47 export (pre-recut), e.g.
//   git show <CP4_58 commit>:public/models/blackwood_table.glb > /tmp/table_src.glb
// Run from a scratch dir (keeps the tooling out of package.json):
//   npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions draco3dgltf
//   node blackwood-table-recut.mjs /tmp/table_src.glb public/models/blackwood_table.glb 1.247
//
// Why these rules hold on this mesh (checked, CP4_59):
//  - every pendant is its own island (welded by position), THIN in x or z
//    (< 3 cm, they are relief carving on the apron faces) and lives entirely
//    in y 0.17–0.46. Arches reach 0.503, collars are 13 cm square, legs start
//    at 0 — none of them match. Expect exactly 28 islands / 11,984 tris.
//  - the leg feet have NO vertices between y 0.02 and 0.16 native: those faces
//    are single long quads down a plain taper. Moving every vertex above CUT
//    lengthens only them; nothing carved is stretched.
// After the edit: uniform scale in BlackwoodScene (TABLE_SCALE), and set
// TABLE_NATIVE_H there to the "height" this prints.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, draco, compactPrimitive } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";

const [, , IN, OUT, EXTRA = "1.247"] = process.argv;
const LEG_EXTRA = Number(EXTRA);
const CUT = 0.09;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await draco3d.createDecoderModule(),
  "draco3d.encoder": await draco3d.createEncoderModule(),
});
const doc = await io.read(IN);
const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const P = prim.getAttribute("POSITION").getArray();
const idxAcc = prim.getIndices();
const idx = idxAcc.getArray();

// weld by position, union-find over triangles
const key = new Map(); const wid = new Int32Array(P.length / 3);
for (let i = 0; i < wid.length; i++) {
  const k = `${Math.round(P[3*i]*1e4)},${Math.round(P[3*i+1]*1e4)},${Math.round(P[3*i+2]*1e4)}`;
  if (!key.has(k)) key.set(k, key.size);
  wid[i] = key.get(k);
}
const par = Int32Array.from({ length: key.size }, (_, i) => i);
const find = (x) => { while (par[x] !== x) x = par[x] = par[par[x]]; return x; };
for (let t = 0; t < idx.length; t += 3) {
  const a = find(wid[idx[t]]); par[find(wid[idx[t+1]])] = a; par[find(wid[idx[t+2]])] = a;
}
const box = new Map();
for (let t = 0; t < idx.length; t += 3) {
  const r = find(wid[idx[t]]);
  const b = box.get(r) ?? { mn: [1e9,1e9,1e9], mx: [-1e9,-1e9,-1e9], n: 0 };
  for (let k = 0; k < 3; k++) { const v = idx[t+k];
    for (let c = 0; c < 3; c++) { b.mn[c] = Math.min(b.mn[c], P[3*v+c]); b.mx[c] = Math.max(b.mx[c], P[3*v+c]); } }
  b.n++; box.set(r, b);
}
const pendant = new Set();
for (const [r, b] of box) {
  const thin = Math.min(b.mx[0] - b.mn[0], b.mx[2] - b.mn[2]) < 0.03;
  if (thin && b.mn[1] > 0.17 && b.mx[1] < 0.46) pendant.add(r);
}
const out = [];
for (let t = 0; t < idx.length; t += 3) if (!pendant.has(find(wid[idx[t]]))) out.push(idx[t], idx[t+1], idx[t+2]);
console.log("pendant islands", pendant.size, "tris removed", (idx.length - out.length) / 3);
idxAcc.setArray(new Uint32Array(out));

const pos = prim.getAttribute("POSITION"); const p = pos.getArray().slice();
for (let i = 1; i < p.length; i += 3) if (p[i] > CUT) p[i] += LEG_EXTRA;
pos.setArray(p);
compactPrimitive(prim);
await doc.transform(prune(), draco({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }));
await io.write(OUT, doc);
let h = 0; const a = prim.getAttribute("POSITION").getArray(); for (let i = 1; i < a.length; i += 3) h = Math.max(h, a[i]);
console.log("tris", prim.getIndices().getCount() / 3, "height", h.toFixed(4));
