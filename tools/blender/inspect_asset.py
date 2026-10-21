"""Open a downloaded 3D model (OBJ) in Blender, report its size and render a few views, to judge whether it is usable.

  blender --background --factory-startup --python tools/blender/inspect_asset.py -- <model.obj> <out_prefix>
"""

import math
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
path, prefix = argv[0], argv[1]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=path)
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
tris = 0
lo = Vector((1e9, 1e9, 1e9))
hi = Vector((-1e9, -1e9, -1e9))
for o in meshes:
    me = o.data
    me.calc_loop_triangles()
    tris += len(me.loop_triangles)
    for v in me.vertices:
        w = o.matrix_world @ v.co
        for i in range(3):
            lo[i] = min(lo[i], w[i])
            hi[i] = max(hi[i], w[i])
size = hi - lo
print("ASSET", path)
print("ASSET objects", len(meshes), [o.name for o in meshes][:8], "tris", tris)
print("ASSET size", tuple(round(x, 3) for x in size), "min", tuple(round(x, 3) for x in lo))
for o in meshes:
    print("ASSET obj", o.name, "verts", len(o.data.vertices), "materials", [m.name for m in o.data.materials])

center = (lo + hi) / 2
scale = 2.0 / max(size)
for o in meshes:
    o.location = (o.location - center) * scale
    o.scale = o.scale * scale
bpy.context.view_layer.update()

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 24
scene.cycles.device = "CPU"
scene.cycles.use_denoising = True
scene.render.resolution_x = 560
scene.render.resolution_y = 560
world = bpy.data.worlds.new("W")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.8, 0.82, 0.88, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.1
scene.world = world
data = bpy.data.lights.new("K", "SUN")
data.energy = 3.5
sun = bpy.data.objects.new("K", data)
scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(50), 0, math.radians(30))
cam_data = bpy.data.cameras.new("C")
cam_data.lens = 60
cam = bpy.data.objects.new("C", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
for name, loc in (("a", (0, -5.5, 0.3)), ("b", (5.0, -2.5, 1.5)), ("c", (-3.5, 4.5, 1.5)), ("d", (0, 0.2, 5.8))):
    cam.location = loc
    cam.rotation_euler = (-Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = f"{prefix}_{name}.png"
    bpy.ops.render.render(write_still=True)
print("ASSET done")
