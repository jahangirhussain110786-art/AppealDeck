"""Smoke test: build a soft, pillowy page in Blender, render it and export a .glb.

Run:  blender --background --factory-startup --python tools/blender/smoke_test.py -- <out_dir>
"""

import sys
import os
import bpy

out = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else os.getcwd()
os.makedirs(out, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# a rounded, puffy slab: a cube with bevel + subdivision
bpy.ops.mesh.primitive_cube_add(size=1)
page = bpy.context.active_object
page.name = "Page"
page.scale = (2.2, 2.6, 0.7)
bpy.ops.object.transform_apply(scale=True)
bev = page.modifiers.new("Bevel", "BEVEL")
bev.width = 0.25
bev.segments = 4
sub = page.modifiers.new("Subsurf", "SUBSURF")
sub.levels = 2
sub.render_levels = 2
bpy.ops.object.shade_smooth()

mat = bpy.data.materials.new("Paper")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.96, 0.97, 1.0, 1)
bsdf.inputs["Roughness"].default_value = 0.5
page.data.materials.append(mat)

# light and camera
bpy.ops.object.light_add(type="AREA", location=(3, -4, 5))
scene.collection.objects.link(bpy.context.active_object) if bpy.context.active_object.name not in scene.collection.objects else None
bpy.context.active_object.data.energy = 600
bpy.ops.object.camera_add(location=(0, -9, 1), rotation=(1.5708, 0, 0))
scene.camera = bpy.context.active_object

scene.render.engine = "CYCLES"
scene.cycles.samples = 24
scene.cycles.device = "CPU"
scene.render.resolution_x = 480
scene.render.resolution_y = 480
scene.render.filepath = os.path.join(out, "smoke.png")
bpy.ops.render.render(write_still=True)

bpy.ops.export_scene.gltf(filepath=os.path.join(out, "smoke.glb"), export_format="GLB")
print("SMOKE_DONE", out)
