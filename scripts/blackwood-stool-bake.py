import bpy, sys, time, bmesh, mathutils
RES=int(sys.argv[-1])
bpy.ops.wm.open_mainfile(filepath="/mnt/user-data/uploads/stool.blend")
for o in list(bpy.data.objects):
    if o.type!='MESH' or o.name=="Floor": bpy.data.objects.remove(o)
meshes=[o for o in bpy.data.objects]
bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
act=bpy.data.objects["Seat_Leather"]; bpy.context.view_layer.objects.active=act
bpy.ops.object.convert(target='MESH')
bpy.ops.object.join()
st=bpy.context.view_layer.objects.active; st.name="Stool"; st.data.name="Stool"
print("tris", sum(len(p.vertices)-2 for p in st.data.polygons), "mats",[m.name for m in st.data.materials])
# UVs
while st.data.uv_layers: st.data.uv_layers.remove(st.data.uv_layers[0])
st.data.uv_layers.new(name="UVMap")
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.004, scale_to_bounds=False)
bpy.ops.uv.pack_islands(margin=0.004, rotate=True)
bpy.ops.object.mode_set(mode='OBJECT')
s=bpy.context.scene; s.render.engine='CYCLES'; s.cycles.device='CPU'; 
s.render.bake.margin=8
s.cycles.samples=4   # 1 CPU core here; texture AA only
# AO nodes baked into ALBEDO = fake lighting frozen into the colour, and the scene already
# runs N8AO. Neutralise them (AO=1) - also what made the bake noisy/slow.
for m in st.data.materials:
    nt=m.node_tree
    for n in list(nt.nodes):
        if n.type=='AMBIENT_OCCLUSION':
            for l in list(n.outputs['AO'].links):
                sock=l.to_socket; nt.links.remove(l); sock.default_value=1.0

def img(name, noncolor):
    i=bpy.data.images.new(name,RES,RES,alpha=False,float_buffer=False)
    if noncolor: i.colorspace_settings.name='Non-Color'
    return i
def set_target(i):
    for m in st.data.materials:
        nt=m.node_tree; n=nt.nodes.get("BAKE_T") or nt.nodes.new("ShaderNodeTexImage"); n.name="BAKE_T"; n.image=i
        nt.nodes.active=n; n.select=True
def save(i,f): i.filepath_raw=f"/home/claude/stool/k2/{f}.png"; i.file_format='PNG'; i.save()
t=time.time()
b=img("base",False); set_target(b); bpy.ops.object.bake(type='DIFFUSE',pass_filter={'COLOR'}); save(b,"stool_basecolor"); print("base",time.time()-t)
r=img("rough",True); set_target(r); bpy.ops.object.bake(type='ROUGHNESS'); save(r,"stool_rough"); print("rough",time.time()-t)
n=img("nor",True); set_target(n); s.render.bake.normal_space='TANGENT'; bpy.ops.object.bake(type='NORMAL'); save(n,"stool_normal"); print("nor",time.time()-t)
# metallic via emission
for m in st.data.materials:
    nt=m.node_tree; p=nt.nodes["Principled BSDF"]; out=nt.nodes["Material Output"]
    em=nt.nodes.new("ShaderNodeEmission")
    mi=p.inputs["Metallic"]
    if mi.is_linked: nt.links.new(mi.links[0].from_socket, em.inputs["Strength"])
    else: em.inputs["Strength"].default_value=mi.default_value
    em.inputs["Color"].default_value=(1,1,1,1)
    nt.links.new(em.outputs[0], out.inputs["Surface"])
mt=img("metal",True); set_target(mt); bpy.ops.object.bake(type='EMIT'); save(mt,"stool_metal"); print("metal",time.time()-t)
bpy.ops.wm.save_as_mainfile(filepath="/home/claude/stool/k2/stool_baked.blend")
