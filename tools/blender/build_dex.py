"""Builds Dex (the navy and orange paper hero) in Blender, rigs him, animates him and exports a .glb.

Run headless:
  blender --background --factory-startup --python tools/blender/build_dex.py -- <out_dir> <faces_dir> [stage]

stage: "body" (just the paper, for a quick look), "static" (all parts), "full" (rig, animation, export).
"""

import math
import os
import sys

import bpy
import bmesh
from mathutils import Vector, Matrix, Quaternion

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dexlib as L  # noqa: E402
from dexlib import P  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else os.getcwd()
FACES = argv[1] if len(argv) > 1 else os.path.join(os.path.dirname(__file__), "out", "faces")
STAGE = argv[2] if len(argv) > 2 else "static"
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ------------------------------------------------------------------------------------------ materials
M = {
    "paper": L.material("Paper", L.PAPER, rough=0.46, coat=0.4, coat_rough=0.45),
    "page1": L.material("Page1", L.PAGE1, rough=0.55, coat=0.2),
    "page2": L.material("Page2", L.PAGE2, rough=0.55, coat=0.2),
    "navy": L.material("Navy", L.NAVY, rough=0.36, coat=0.7, coat_rough=0.25),
    "orange": L.material("Orange", L.ORANGE, rough=0.34, coat=0.7, coat_rough=0.2),
    "cape": L.material("Cape", L.NAVY_DEEP, rough=0.5, sheen=0.6),
    "glove": L.material("Glove", L.GLOVE, rough=0.38, coat=0.6, coat_rough=0.4, sheen=0.6),
    "boot": L.material("Boot", L.BOOT, rough=0.28, coat=1.0, coat_rough=0.2),
    "sole": L.material("Sole", L.SOLE, rough=0.5, coat=0.3),
    "brass": L.material("Brass", L.BRASS, rough=0.28, metal=0.65),
    "metal": L.material("Metal", L.METAL, rough=0.22, metal=0.6),
}

# ------------------------------------------------------------------------------------------ the paper
# The website's body is a 2.2 x 2.6 outline with a 0.17 bevel pushed outward: 2.54 x 2.94 and 0.84 thick.
BODY_Y = 2.7
HALF_W, HALF_H = 1.27, 1.47
DEPTH = 0.84

objs = {}


def build_body():
    pts = L.rounded_outline(HALF_W, HALF_H, 0.54, cut=0.72, n=9)
    paper = L.slab("Paper", pts, DEPTH, 0.3, M["paper"], puff=0.07, w=HALF_W, h=HALF_H)
    paper.location = P(0, BODY_Y, 0)
    objs["paper"] = paper

    # two pages peeking out behind
    pts2 = L.rounded_outline(HALF_W - 0.02, HALF_H - 0.02, 0.54, cut=0.72, n=9)
    p2 = L.slab("Page2", pts2, DEPTH * 0.8, 0.22, M["page2"], w=HALF_W, h=HALF_H)
    p2.location = P(0.13, BODY_Y - 0.1, -0.4)
    p1 = L.slab("Page1", pts2, DEPTH * 0.8, 0.22, M["page1"], w=HALF_W, h=HALF_H)
    p1.location = P(0.065, BODY_Y - 0.05, -0.2)
    objs["page1"], objs["page2"] = p1, p2


def shrink_to(obj, target, offset, subdiv=0):
    if subdiv:
        L.add_mod(obj, "SUBSURF", subdivision_type="SIMPLE", levels=subdiv, render_levels=subdiv)
    L.add_mod(
        obj,
        "SHRINKWRAP",
        target=target,
        wrap_method="PROJECT",
        use_project_y=True,
        use_negative_direction=True,
        use_positive_direction=True,
        offset=offset,
        cull_face="OFF",
    )


def build_fold_and_clip():
    paper = objs["paper"]
    # the orange fold lies over the cut corner: two points on the cut and one inside the page
    cut = 0.72
    w, h = HALF_W, HALF_H
    a = (w - cut, h)
    b = (w, h - cut)
    # inset from the rim, onto the front face, so the fold lies flat instead of overhanging the edge
    pts = [
        (x - 0.12, z - 0.14)
        for x, z in (
            a,
            b,
            (w - cut + 0.34, h - cut - 0.05),
            (w - cut + 0.12, h - cut - 0.02),
            (w - cut - 0.04, h - cut + 0.05),
        )
    ]
    # a little smaller, drawn in toward its own centre, so it sits inside the corner
    cx = sum(x for x, _ in pts) / len(pts)
    cz = sum(z for _, z in pts) / len(pts)
    pts = [(cx + (x - cx) * 0.78 - 0.03, cz + (z - cz) * 0.78 - 0.04) for x, z in pts]
    me = bpy.data.meshes.new("Fold")
    me.from_pydata([(x, -0.7, z) for x, z in pts], [], [list(range(len(pts)))])
    fold = L.new_object("Fold", me)
    fold.location = paper.location
    L.add_mod(fold, "SUBSURF", subdivision_type="SIMPLE", levels=4, render_levels=4)
    L.add_mod(
        fold,
        "SHRINKWRAP",
        target=paper,
        wrap_method="PROJECT",
        use_project_y=True,
        use_negative_direction=True,
        use_positive_direction=True,
        offset=0.03,
        cull_face="OFF",
    )
    L.add_mod(fold, "SOLIDIFY", thickness=0.07, offset=1.0)
    L.add_mod(fold, "BEVEL", width=0.025, segments=3)
    L.add_mod(fold, "SUBSURF", levels=1, render_levels=1)
    L.bake_modifiers(fold)
    fold.data.materials.append(M["orange"])
    objs["fold"] = fold

    # the navy binder clip
    top = BODY_Y + HALF_H
    me = bpy.data.meshes.new("Clip")
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bm.to_mesh(me)
    bm.free()
    clip = L.new_object("Clip", me)
    clip.scale = (1.2, 0.62, 0.5)
    clip.location = P(0, top + 0.1, 0.2)
    bpy.context.view_layer.update()
    for v in me.vertices:
        v.co.x *= clip.scale.x
        v.co.y *= clip.scale.y
        v.co.z *= clip.scale.z
    clip.scale = (1, 1, 1)
    L.add_mod(clip, "BEVEL", width=0.17, segments=6)
    L.add_mod(clip, "SUBSURF", levels=2, render_levels=2)
    L.bake_modifiers(clip)
    clip.data.materials.append(M["navy"])
    objs["clip"] = clip

    # hinge bar
    me = bpy.data.meshes.new("Hinge")
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.06, radius2=0.06, depth=0.9)
    bm.to_mesh(me)
    bm.free()
    hinge = L.new_object("Hinge", me)
    hinge.rotation_euler = (0, math.radians(90), 0)
    hinge.location = P(0, top + 0.4, 0.2)
    L.smooth(me)
    hinge.data.materials.append(M["metal"])
    objs["hinge"] = hinge


def build_face():
    paper = objs["paper"]
    w, h = 1.1, 1.3  # the face plate covers the 2.2 x 2.6 page area the texture was drawn for
    me = bpy.data.meshes.new("Face")
    me.from_pydata([(-w, -0.7, -h), (w, -0.7, -h), (w, -0.7, h), (-w, -0.7, h)], [], [[0, 1, 2, 3]])
    uv = me.uv_layers.new(name="UVMap")
    for loop in me.loops:
        v = me.vertices[loop.vertex_index].co
        uv.data[loop.index].uv = ((v.x / w + 1) / 2, (v.z / h + 1) / 2)
    face = L.new_object("Face", me)
    face.location = paper.location
    # subdivide (keeping the UVs) and let the plate lie on the dome of the paper
    L.add_mod(face, "SUBSURF", subdivision_type="SIMPLE", levels=5, render_levels=5)
    L.add_mod(
        face,
        "SHRINKWRAP",
        target=paper,
        wrap_method="PROJECT",
        use_project_y=True,
        use_negative_direction=True,
        use_positive_direction=True,
        offset=0.006,
        cull_face="OFF",
    )
    L.bake_modifiers(face)
    # the plate sits at the front only: push any point that found the back surface to the front
    m = bpy.data.materials.new("FaceMat")
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    img = bpy.data.images.load(os.path.join(FACES, "face_hello.png"))
    img.alpha_mode = "STRAIGHT"
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Cubic"
    L._set(bsdf, "Base Color", (0, 0, 0, 1))
    L._set(bsdf, "Roughness", 0.9)
    L._set(bsdf, "Specular IOR Level", 0.0)
    L._set(bsdf, "Emission Strength", 1.0)
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
    try:
        m.surface_render_method = "BLENDED"
    except Exception:
        pass
    face.data.materials.append(m)
    objs["face"] = face



# ------------------------------------------------------------------------------------------ limbs
import limbs  # noqa: E402

C = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))  # three.js axes to Blender axes
SHOULDER = {"L": (-1.2, 2.85, 0.0), "R": (1.2, 2.85, 0.0)}
# the resting (idle) pose of the website's arms: where the hand is and which way the elbow bends
HAND_REST = {"L": (-1.62, 1.95, 0.32), "R": (1.62, 1.95, 0.32)}
BEND_REST = {"L": (-0.5, 0.0, 0.2), "R": (0.5, 0.0, 0.2)}
rig_info = {}


def rot_b(q3):
    """A three.js rotation (quaternion) as a Blender rotation matrix."""
    return C @ q3.to_matrix() @ C.inverted()


def add_obj(name, me, mat, loc=(0, 0, 0), rot=None):
    o = L.new_object(name, me)
    o.location = loc
    if rot is not None:
        o.rotation_euler = rot
    me.materials.append(mat)
    return o


def torus(name, major, minor, loc, rot, mat, maj_seg=48, min_seg=24):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major, minor_radius=minor, major_segments=maj_seg, minor_segments=min_seg, location=loc
    )
    o = bpy.context.active_object
    o.name = name
    o.rotation_euler = rot
    L.smooth(o.data)
    o.data.materials.append(mat)
    return o


def sphere(name, r, loc, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=32, ring_count=18, location=loc)
    o = bpy.context.active_object
    o.name = name
    L.smooth(o.data)
    o.data.materials.append(mat)
    return o


def capsule_obj(name, r, length, loc, mat, bevel=0.0):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=r, radius2=r, depth=length)
    bm.to_mesh(me)
    bm.free()
    o = L.new_object(name, me)
    o.location = loc
    L.add_mod(o, "BEVEL", width=r * 0.35, segments=4)
    L.add_mod(o, "SUBSURF", levels=2, render_levels=2)
    L.bake_modifiers(o)
    o.data.materials.append(mat)
    return o


def build_arms():
    for side in ("L", "R"):
        s3 = Vector(SHOULDER[side])
        h3 = Vector(HAND_REST[side])
        b3 = Vector(BEND_REST[side])
        dist = (h3 - s3).length
        elbow3 = (s3 + h3) / 2 + b3 * min(0.75, 0.34 * dist)
        dir3 = (h3 - elbow3).normalized()
        # the arm: a smooth tube from the shoulder through the elbow to the wrist
        ctrl = elbow3 * 2 - (s3 + h3) * 0.5
        pts = [Vector(P(*p)) for p in limbs.bezier_points(s3, ctrl, h3, 30)]
        me = limbs.tube_mesh("Arm" + side, pts, lambda u: 0.205 - 0.04 * math.sin(math.pi * u) - 0.006 * u)
        arm = L.new_object("Arm" + side, me)
        L.add_mod(arm, "SUBSURF", levels=1, render_levels=1)
        L.bake_modifiers(arm)
        arm.data.materials.append(M["navy"])
        objs["arm" + side] = arm
        # the shoulder ball
        objs["cap" + side] = sphere("Shoulder" + side, 0.2, P(*s3), M["navy"])
        # the glove grows out of the wrist, on the arm's own axis
        gl = limbs.glove_mesh("Glove" + side, mirror=(side == "L"))
        q3 = Vector((0, 1, 0)).rotation_difference(dir3)
        glove = L.new_object("Glove" + side, gl)
        glove.matrix_world = Matrix.Translation(P(*(h3 + dir3 * 0.2))) @ rot_b(q3).to_4x4()
        gl.materials.append(M["glove"])
        objs["glove" + side] = glove

        # the cuff: a thick ring that hides the join
        cuff_pos = h3 + dir3 * (0.2 - 0.33)
        cuff = torus("Cuff" + side, 0.236, 0.105, (0, 0, 0), (0, 0, 0), M["orange"])
        cuff.matrix_world = Matrix.Translation(P(*cuff_pos)) @ (rot_b(q3) @ Matrix.Rotation(0, 3, "X")).to_4x4()
        # a torus lies flat (axis Z); the arm axis in Blender is the rotated Z, which is what we want
        objs["cuff" + side] = cuff
        rig_info[side] = dict(shoulder=s3, elbow=elbow3, wrist=h3, dir=dir3)


def build_legs():
    for sx, side in ((-1, "L"), (1, "R")):
        x = sx * 0.7
        leg = capsule_obj("Leg" + side, 0.235, 0.78, P(x, 1.02, -0.02), M["navy"])
        objs["leg" + side] = leg
        band = torus("Band" + side, 0.27, 0.1, P(x, 1.0, -0.02), (0, 0, 0), M["orange"])
        objs["band" + side] = band
        up, sole = limbs.boot_mesh("Boot" + side)
        boot = add_obj("Boot" + side, up, M["boot"], P(sx * 0.74, 0, 0.12), (0, 0, sx * 0.5))
        boot.scale = (1.08, 1.08, 1.08)
        so = add_obj("Sole" + side, sole, M["sole"], P(sx * 0.74, 0, 0.12), (0, 0, sx * 0.5))
        so.scale = (1.08, 1.08, 1.08)
        objs["boot" + side], objs["sole" + side] = boot, so


def cape_point(u, vv):
    a = (u - 0.5) * 3.2
    e = vv ** 1.12
    R = 1.25 + (2.35 - 1.25) * e
    wave = 0.3 * vv ** 1.3 * math.sin(a * 5 + vv * 2.2) + 0.08 * vv * vv * math.sin(a * 9)
    r = R + wave
    x = r * math.sin(a)
    y = 3.55 - 2.7 * vv - 0.42 * vv * vv * (1 - min(1.0, abs(a) / 1.6)) + 0.06 * wave
    z = -0.3 - 0.58 * r * math.cos(a) * vv ** 0.7 - 0.1 * wave
    return x, y, z


def build_cape():
    nu, nv = 40, 24
    verts = []
    faces = []
    for j in range(nv + 1):
        for i in range(nu + 1):
            verts.append(tuple(P(*cape_point(i / nu, j / nv))))
    for j in range(nv):
        for i in range(nu):
            a = j * (nu + 1) + i
            faces.append([a, a + 1, a + nu + 2, a + nu + 1])
    me = bpy.data.meshes.new("Cape")
    me.from_pydata(verts, [], faces)
    me.update()
    cape = L.new_object("Cape", me)
    L.add_mod(cape, "SOLIDIFY", thickness=0.035, offset=0.0)
    L.add_mod(cape, "SUBSURF", levels=1, render_levels=1)
    L.bake_modifiers(cape)
    cape.data.materials.append(M["cape"])
    objs["cape"] = cape
    # the orange hem: a tube following the bottom edge
    cu = bpy.data.curves.new("Hem", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.1
    cu.bevel_resolution = 5
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(nu)
    for i in range(nu + 1):
        x, y, z = P(*cape_point(i / nu, 1.0))
        sp.points[i].co = (x, y, z, 1)
    ho = bpy.data.objects.new("Hem", cu)
    L.collection().objects.link(ho)
    dg = bpy.context.evaluated_depsgraph_get()
    hm = bpy.data.meshes.new_from_object(ho.evaluated_get(dg))
    bpy.data.objects.remove(ho)
    L.smooth(hm)
    hem = add_obj("Hem", hm, M["orange"])
    objs["hem"] = hem
    for sx in (-1, 1):
        objs["clasp" + ("L" if sx < 0 else "R")] = sphere("Clasp", 0.15, P(sx * 1.24, 3.5, 0.06), M["brass"])


def build_static():
    build_body()
    build_fold_and_clip()
    build_face()
    build_arms()
    build_legs()
    build_cape()


# ------------------------------------------------------------------------------------------ export
from mathutils.bvhtree import BVHTree  # noqa: E402


def _tris(obj_or_mesh, matrix=None):
    me = obj_or_mesh
    me.calc_loop_triangles()
    verts = [(matrix @ v.co) if matrix else v.co.copy() for v in me.vertices]
    tris = [tuple(t.vertices) for t in me.loop_triangles]
    return verts, tris


def hemisphere(n):
    """Evenly spread unit vectors over the +Z hemisphere."""
    out = []
    golden = math.pi * (3 - math.sqrt(5))
    for i in range(n):
        z = (i + 0.5) / n
        r = math.sqrt(max(0.0, 1 - z * z))
        a = golden * i
        out.append(Vector((r * math.cos(a), r * math.sin(a), z)))
    return out


def bake_ao(me, occluder_meshes, samples=40, dist=0.9, strength=0.5, matrices=None):
    """Per-vertex ambient occlusion into a colour attribute: how much each point is hidden by its surroundings."""
    verts, tris = [], []
    for k, om in enumerate(occluder_meshes):
        mx = matrices[k] if matrices else None
        vv, tt = _tris(om, mx)
        base = len(verts)
        verts += vv
        tris += [(a + base, b + base, c + base) for a, b, c in tt]
    bvh = BVHTree.FromPolygons(verts, tris, epsilon=0.0)
    hemi = hemisphere(samples)
    me.calculate_normals() if hasattr(me, "calculate_normals") else None
    ca = me.color_attributes.new("AO", "FLOAT_COLOR", "POINT")
    for v in me.vertices:
        n = v.normal.normalized()
        up = Vector((0, 0, 1)) if abs(n.z) < 0.9 else Vector((1, 0, 0))
        tx = up.cross(n).normalized()
        ty = n.cross(tx)
        hit = 0.0
        origin = v.co + n * 0.012
        for h in hemi:
            d = tx * h.x + ty * h.y + n * h.z
            loc, nor, idx, dd = bvh.ray_cast(origin, d, dist)
            if loc is not None:
                hit += 1.0 - dd / dist
        ao = 1.0 - strength * (hit / samples) * 1.6
        ao = max(0.35, min(1.0, ao))
        ca.data[v.index].color = (ao, ao, ao, 1.0)


def decimated(me, ratio):
    """A lighter copy of a mesh (keeping its smooth look and its baked colours)."""
    tmp = bpy.data.objects.new("tmp", me)
    L.collection().objects.link(tmp)
    L.add_mod(tmp, "DECIMATE", ratio=ratio, use_collapse_triangulate=True)
    L.bake_modifiers(tmp)
    out = tmp.data
    bpy.data.objects.remove(tmp)
    return out


def export_parts():
    """Write the parts the website uses (body, glove, boot) as one .glb, each in its own local space."""
    origin = P(0, BODY_Y, 0)
    shift = Matrix.Translation(-origin)

    def copy_mesh(obj, matrix):
        me = obj.data.copy()
        me.transform(matrix)
        return me

    exports = []

    def add(name, me, material_name=None):
        o = bpy.data.objects.new(name, me)
        L.collection().objects.link(o)
        exports.append(o)
        return o

    # the body parts, in the body's own space (centre of the paper at the origin)
    body_keys = ["paper", "page1", "page2", "fold", "clip", "hinge", "face"]
    ratios = {"paper": 0.55, "page1": 0.3, "page2": 0.3, "fold": 0.2, "clip": 0.45, "hinge": 1.0}
    meshes = {}
    for k in body_keys:
        me = copy_mesh(objs[k], shift @ objs[k].matrix_world)
        if k in ratios and ratios[k] < 1.0:
            me = decimated(me, ratios[k])
        meshes[k] = me
    occ = [meshes[k] for k in ("paper", "page1", "page2", "fold", "clip", "hinge")]
    for k in body_keys:
        if k != "face":
            bake_ao(meshes[k], occ, samples=36, dist=0.8, strength=0.55)
        add(k, meshes[k])

    # the glove (website orientation: fingers along +Y, palm toward +Z), at the website's own scale
    gl = decimated(limbs.glove_mesh("GloveExport", res=0.012, mirror=False, s=1.0), 0.3)
    bake_ao(gl, [gl], samples=40, dist=0.35, strength=0.7)
    add("glove", gl)

    # the boot: upper and sole, scaled as in the render
    up, sole = limbs.boot_mesh("BootExport", res=0.018)
    for me in (up, sole):
        me.transform(Matrix.Scale(1.08, 4))
    up = decimated(up, 0.28)
    sole = decimated(sole, 0.12)
    bake_ao(up, [up, sole], samples=36, dist=0.5, strength=0.5)
    bake_ao(sole, [up, sole], samples=36, dist=0.5, strength=0.5)
    add("bootUpper", up)
    add("bootSole", sole)

    for o in exports:
        if not o.data.materials:
            o.data.materials.append(M["paper"])
    bpy.ops.object.select_all(action="DESELECT")
    for o in exports:
        o.select_set(True)
    bpy.context.view_layer.objects.active = exports[0]
    path = os.path.join(OUT, "dex_parts.glb")
    kwargs = dict(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_materials="NONE",
        export_cameras=False,
        export_lights=False,
    )
    try:
        bpy.ops.export_scene.gltf(export_vertex_color="ACTIVE", **kwargs)
    except TypeError:
        bpy.ops.export_scene.gltf(**kwargs)
    for o in exports:
        bpy.data.objects.remove(o)
    print("EXPORTED", path, os.path.getsize(path))

# ------------------------------------------------------------------------------------------ rendering
def look(obj_or_loc, loc):
    d = Vector(obj_or_loc) - Vector(loc)
    return d.to_track_quat("-Z", "Y").to_euler()


def setup_render(res=(640, 720), samples=40):
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.device = "CPU"
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.film_transparent = False
    world = bpy.data.worlds.new("W")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.78, 0.8, 0.86, 1)
    bg.inputs["Strength"].default_value = 0.9
    scene.world = world
    # key, fill, rim
    for name, loc, energy, size, color in [
        ("Key", (3.5, -6.5, 7.5), 900, 5, (1.0, 0.95, 0.9)),
        ("Fill", (-5, -6, 4), 330, 6, (0.88, 0.92, 1.0)),
        ("Rim", (-4, 5, 5), 500, 4, (0.7, 0.8, 1.0)),
    ]:
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.size = size
        data.color = color
        o = bpy.data.objects.new(name, data)
        L.collection().objects.link(o)
        o.location = loc
        o.rotation_euler = look((0, 0, 2.6), loc)
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 70
    cam = bpy.data.objects.new("Cam", cam_data)
    L.collection().objects.link(cam)
    scene.camera = cam
    return cam


def shot(cam, name, loc, target=(0, 0, 2.6)):
    cam.location = loc
    cam.rotation_euler = look(target, loc)
    scene.render.filepath = os.path.join(OUT, name + ".png")
    bpy.ops.render.render(write_still=True)


def glove_test():
    import limbs

    me = limbs.glove_mesh(s=1.0)
    print("GLOVE_BBOX", limbs.bbox(me), "verts", len(me.vertices))
    me.materials.append(M["glove"])
    L.new_object("GloveTest", me)
    cam = setup_render(res=(640, 640), samples=40)
    shot(cam, "glove_front", (0, -4.2, 0.1), (0, 0, 0.1))
    shot(cam, "glove_back", (0, 4.2, 0.1), (0, 0, 0.1))
    shot(cam, "glove_side", (4.4, -0.6, 0.15), (0, 0, 0.1))
    shot(cam, "glove_34", (-3.2, 3.2, 1.6), (0, 0, 0.1))


def main():
    if STAGE == "glove":
        glove_test()
        return
    build_static()
    export_parts()
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "dex.blend"))
    if STAGE == "export":
        return
    cam = setup_render(res=(720, 800), samples=48)
    shot(cam, "dex_front", (0, -16.5, 3.0), (0, 0, 2.45))
    shot(cam, "dex_34", (7, -14.5, 4.0), (0, 0, 2.45))
    shot(cam, "dex_back", (-5, 13.5, 4.0), (0, 0, 2.45))
    print("BUILD_DONE", STAGE)


main()
