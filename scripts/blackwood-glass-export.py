"""CP4_63 — Dublin-cut tumbler: client .blend -> web GLB.

bpy 5.2 (Python 3.13). NOTE: bpy 5.2 aborts at import ("InitGoogleLogging()
twice") with numpy >= 2.5 — pin numpy 2.3.x in the venv.

  python blackwood-glass-export.py <in.blend> <out_raw.glb>
  npx gltf-transform weld out_raw.glb w.glb
  npx gltf-transform draco w.glb blackwood_glass.glb --quantize-position 14 --quantize-normal 12

Source: 548k tris, one object, origin already at base centre, metres.
Collapse decimate to 10% (~51k tris after weld) — checked side by side in
Cycles: the cut pattern survives; at scene distance the glass is ~200 px tall.
Normals split at 30° so the facets stay faceted. No UVs, no textures; the
material is rebuilt in three.js anyway.
"""
import bpy, sys

src, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.open_mainfile(filepath=src)
for o in list(bpy.data.objects):
    if o.name != "Dublin_Cut_Whiskey_Glass_Square":
        bpy.data.objects.remove(o)
ob = bpy.data.objects["Dublin_Cut_Whiskey_Glass_Square"]
bpy.context.view_layer.objects.active = ob
ob.select_set(True)
m = ob.modifiers.new("d", "DECIMATE"); m.ratio = 0.1; m.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier="d")
bpy.ops.object.shade_smooth_by_angle(angle=0.5236)
for mod in list(ob.modifiers):
    bpy.ops.object.modifier_apply(modifier=mod.name)
me = ob.data
me.calc_loop_triangles()
vol = 0.0
for t in me.loop_triangles:
    a, b, c = (me.vertices[i].co for i in t.vertices)
    vol += a.dot(b.cross(c)) / 6.0
print("tris", len(me.loop_triangles), "signed volume", vol, "dims", tuple(ob.dimensions))  # must be > 0
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_apply=True,
    export_yup=True, export_normals=True, export_texcoords=False, export_materials="EXPORT")
