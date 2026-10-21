"""Small helpers shared by the Dex build scripts (Blender 5.x, run headless).

Coordinates: the website's three.js scene is Y-up with the front toward +Z. Blender is Z-up with the front
toward -Y. `P(x, y, z)` converts a three.js point to Blender, so numbers can be copied across unchanged.
"""

import math
import bpy
import bmesh
from mathutils import Vector, Matrix

# the navy and orange of the website (AM-30), as sRGB hex
NAVY = 0x182F78
NAVY_DEEP = 0x14296B
ORANGE = 0xE95D0E
PAPER = 0xEEF3FD
PAGE1 = 0xD2DAF0
PAGE2 = 0xB6C3E4
GLOVE = 0xFBFCFF
BOOT = 0x1F419A
SOLE = 0xF0E7D4
BRASS = 0xE8A04A
METAL = 0xA9C0EE


def P(x, y, z):
    return Vector((x, -z, y))


def srgb(h):
    out = []
    for shift in (16, 8, 0):
        c = ((h >> shift) & 255) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


def _set(node, name, value):
    sock = node.inputs.get(name)
    if sock is not None:
        sock.default_value = value


def material(name, hex_, rough=0.4, metal=0.0, coat=0.0, coat_rough=0.2, sheen=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    _set(b, "Base Color", srgb(hex_))
    _set(b, "Roughness", rough)
    _set(b, "Metallic", metal)
    _set(b, "Coat Weight", coat)
    _set(b, "Coat Roughness", coat_rough)
    _set(b, "Sheen Weight", sheen)
    return m


def collection():
    return bpy.context.scene.collection


def new_object(name, mesh):
    o = bpy.data.objects.new(name, mesh)
    collection().objects.link(o)
    return o


def smooth(mesh):
    for p in mesh.polygons:
        p.use_smooth = True


def bake_modifiers(obj):
    """Apply every modifier by evaluating the object into a fresh mesh."""
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev)
    old = obj.data
    obj.modifiers.clear()
    obj.data = me
    if old.users == 0:
        bpy.data.meshes.remove(old)
    smooth(me)
    return obj


def add_mod(obj, kind, **props):
    m = obj.modifiers.new(kind.title(), kind)
    for k, v in props.items():
        setattr(m, k, v)
    return m


def rounded_outline(w, h, r, cut=0.0, n=8, cut_corner="TR"):
    """A rounded rectangle (optionally with one chamfered corner) as XZ points, counter-clockwise from the front."""
    pts = []

    def arc(cx, cz, a0, a1):
        for i in range(n + 1):
            a = math.radians(a0 + (a1 - a0) * i / n)
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))

    arc(w - r, -h + r, -90, 0)
    if cut > 0:
        pts.append((w, h - cut))
        pts.append((w - cut, h))
    else:
        arc(w - r, h - r, 0, 90)
    arc(-w + r, h - r, 90, 180)
    arc(-w + r, -h + r, 180, 270)
    return pts


def slab(name, pts, depth, bevel, mat, puff=0.0, bevel_segments=5, subd=2, w=1.1, h=1.3):
    """A pillowy slab: an outline thickened along Y, bevelled, subdivided, then domed on both faces."""
    me = bpy.data.meshes.new(name)
    verts = [(x, 0.0, z) for x, z in pts]
    me.from_pydata(verts, [], [list(range(len(verts)))])
    o = new_object(name, me)
    add_mod(o, "SOLIDIFY", thickness=depth, offset=0.0, use_even_offset=True)
    add_mod(o, "BEVEL", width=bevel, segments=bevel_segments, limit_method="ANGLE", angle_limit=math.radians(35))
    add_mod(o, "SUBSURF", levels=subd, render_levels=subd)
    bake_modifiers(o)
    if puff:
        for v in o.data.vertices:
            k = (v.co.x / w) ** 2 + (v.co.z / h) ** 2
            dome = max(0.0, 1.0 - k) ** 0.6
            side = 1.0 if v.co.y > 0 else -1.0
            # only push the broad faces; the rim is left alone
            face = min(1.0, max(0.0, (abs(v.co.y) - depth * 0.5 * 0.55) / (depth * 0.5 * 0.45 + bevel * 0.5)))
            v.co.y += side * puff * dome * face
    o.data.materials.append(mat)
    return o


def link_parent(obj, parent):
    obj.parent = parent
