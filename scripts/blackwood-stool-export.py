import bpy, sys, mathutils
blend, texdir, out = sys.argv[-3:]
bpy.ops.wm.open_mainfile(filepath=blend)
st=bpy.data.objects["Stool"]
def build(name):
    m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; p=nt.nodes["Principled BSDF"]
    def tex(f,cs):
        n=nt.nodes.new("ShaderNodeTexImage"); n.image=bpy.data.images.get(f+".png") or bpy.data.images.load(f"{texdir}/{f}.png"); n.image.colorspace_settings.name=cs; return n
    nt.links.new(tex("stool_basecolor","sRGB").outputs[0],p.inputs["Base Color"])
    nt.links.new(tex("stool_rough","Non-Color").outputs[0],p.inputs["Roughness"])
    nt.links.new(tex("stool_metal","Non-Color").outputs[0],p.inputs["Metallic"])
    nm=nt.nodes.new("ShaderNodeNormalMap"); nt.links.new(tex("stool_normal","Non-Color").outputs[0],nm.inputs["Color"]); nt.links.new(nm.outputs[0],p.inputs["Normal"])
    return m
# CP4_43: two material slots sharing ONE atlas, so three.js can give the leather
# sheen/wear and the wood its lacquer (the bake could not carry either).
leather_idx=[i for i,mm in enumerate(st.data.materials) if mm and mm.name=="Leather"][0]
is_leather=[p.material_index==leather_idx for p in st.data.polygons]
st.data.materials.clear()
st.data.materials.append(build("StoolLeather")); st.data.materials.append(build("StoolWood"))
for p,l in zip(st.data.polygons,is_leather): p.material_index=0 if l else 1
print("leather faces", sum(is_leather))
# CP4_44 WINDING FIX: 16 of 44 parts (leather, legs, aprons, stretchers, seat
# planks) came out of the source with INWARD-facing faces. Blender/Cycles draw
# both sides so it never showed; three.js culls back faces, so those parts
# rendered as hollow shells and "didn't load". Flip every closed island whose
# signed volume is negative.
import bmesh
had_custom = st.data.has_custom_normals
bm=bmesh.new(); bm.from_mesh(st.data); bm.faces.ensure_lookup_table()
def islands(bm):
    seen=set()
    for f in bm.faces:
        if f.index in seen: continue
        stack=[f]; isl=[]; seen.add(f.index)
        while stack:
            g=stack.pop(); isl.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h.index not in seen: seen.add(h.index); stack.append(h)
        yield isl
def vol(isl):
    v=0
    for g in isl:
        vs=[l.vert.co for l in g.loops]
        for i in range(1,len(vs)-1): v+=vs[0].dot(vs[i].cross(vs[i+1]))/6
    return v
flip=[g for isl in islands(bm) if vol(isl)<0 for g in isl]
bmesh.ops.reverse_faces(bm, faces=flip)
bm.to_mesh(st.data); bm.free()
bm=bmesh.new(); bm.from_mesh(st.data); bm.faces.ensure_lookup_table()
print("flipped faces", len(flip), "inverted islands after", sum(1 for isl in islands(bm) if vol(isl)<0), "custom normals", had_custom)
bm.free()
if had_custom:
    bpy.context.view_layer.objects.active=st
    bpy.ops.mesh.customdata_custom_splitnormals_clear()
st.data.update()
# seat height under the bottle footprint (domed cushion): ray down at centre and +-35mm
dg=bpy.context.evaluated_depsgraph_get()
hs=[]
for x,y in [(0,0),(0.035,0),(-0.035,0),(0,0.035),(0,-0.035)]:
    ok,loc,*_=bpy.context.scene.ray_cast(dg,mathutils.Vector((x,y,2)),mathutils.Vector((0,0,-1)))
    hs.append(round(loc.z,4))
print("SEAT heights centre/+-35mm", hs)
bpy.ops.object.select_all(action='DESELECT'); st.select_set(True); bpy.context.view_layer.objects.active=st
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
  export_image_format='AUTO', export_materials='EXPORT', export_cameras=False, export_lights=False)
