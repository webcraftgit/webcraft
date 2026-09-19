/* CP4_46 — bake creased normals into the lantern GLB (replaces the runtime
 * smoothNormals() pass in BlackwoodScene).
 * Deps are NOT in the repo's package.json; run from a scratch dir:
 *   npm i @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 draco3dgltf three@0.174.0
 *   node blackwood-lantern-normals.mjs <in.glb> <out.glb>
 * toCreasedNormals at 50° (the old runtime CREASE) → prune → weld (re-index)
 * → Draco q14 position / q10 normal (the CP3.9 lantern settings). */
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression, ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, draco, prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import * as THREE from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const src = process.argv[2], out = process.argv[3];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
const doc = await io.read(src);
const CREASE = THREE.MathUtils.degToRad(50);
let before = 0, after = 0;
for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
  const pos = prim.getAttribute('POSITION'); const idx = prim.getIndices();
  before += pos.getCount();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos.getArray()), 3));
  if (idx) g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx.getArray()), 1));
  const c = toCreasedNormals(g, CREASE); // non-indexed
  const buf = doc.getRoot().listBuffers()[0];
  for (const s of prim.listSemantics()) if (s !== 'POSITION') prim.setAttribute(s, null);
  prim.setIndices(null);
  prim.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(c.attributes.position.array)).setBuffer(buf));
  prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(c.attributes.normal.array)).setBuffer(buf));
}
await doc.transform(prune(), weld({ overwrite: true }));
for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) after += prim.getAttribute('POSITION').getCount();
await doc.transform(draco({ quantizePosition: 14, quantizeNormal: 10 }));
await io.write(out, doc);
console.log({ before, after });
