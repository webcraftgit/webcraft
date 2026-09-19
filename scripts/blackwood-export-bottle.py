import bpy
bpy.ops.wm.open_mainfile(filepath="/mnt/user-data/uploads/blackwood_whisky_bottle.blend")
for img in bpy.data.images:
    # glass normal: sub-degree dither noise flattened (features >2deg untouched) so it
    # compresses losslessly to 25 KB instead of 453 KB
    img.filepath="/home/claude/bb/"+("glass_normal_clean.png" if img.name=="glass_normal.png" else img.name); img.reload()
    print(img.name, tuple(img.size))
# label normal: max tilt 1.6deg — invisible, 172 KB. Dropped.
lm=bpy.data.materials["LabelPaper"].node_tree
for l in list(lm.links):
    if l.to_socket.name=="Normal": lm.links.remove(l)
for o in bpy.data.objects:
    if o.type=='MESH': o.data.name=o.name
bpy.ops.export_scene.gltf(filepath="/home/claude/tex/bottle_raw.glb", export_format='GLB', export_apply=True, export_yup=True,
    export_image_format='AUTO', export_materials='EXPORT', export_cameras=False, export_lights=False)
