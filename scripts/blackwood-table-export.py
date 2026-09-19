import bpy, sys, math
src, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.open_mainfile(filepath=src)
ob = [o for o in bpy.data.objects if o.type=='MESH'][0]
bpy.context.view_layer.objects.active = ob
ob.select_set(True)
# apply every modifier (geometry nodes + weighted normal) on the real mesh
for m in list(ob.modifiers):
    try: bpy.ops.object.modifier_apply(modifier=m.name)
    except Exception as e: print("modifier failed", m.name, e)
me = ob.data
me.calc_loop_triangles()
print("tris", len(me.loop_triangles), "verts", len(me.vertices), "uv", [u.name for u in me.uv_layers])
# origin -> base centre, sitting on y=0 (glTF +Y up = blender +Z)
bb = [ob.matrix_world @ v.co for v in me.vertices]
minz = min(v.z for v in bb); maxz = max(v.z for v in bb)
cx = (min(v.x for v in bb)+max(v.x for v in bb))/2; cy=(min(v.y for v in bb)+max(v.y for v in bb))/2
for v in me.vertices:
    v.co.x -= cx; v.co.y -= cy; v.co.z -= minz
me.update()
print("dims", [round(d,4) for d in ob.dimensions], "height", round(maxz-minz,4))
# inverted-face check (CP4_44 lesson): signed volume of the whole mesh
vol = 0.0
for t in me.loop_triangles:
    a,b,c = (me.vertices[i].co for i in t.vertices)
    vol += a.dot(b.cross(c))/6.0
print("signed volume", round(vol,6))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True,
    export_apply=True, export_materials='NONE', export_yup=True,
    export_normals=True, export_texcoords=True, export_draco_mesh_compression_enable=False)
print("written", out)
