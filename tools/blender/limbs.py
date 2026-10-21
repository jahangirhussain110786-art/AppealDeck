"""Gloves, boots and arms for Dex, built from soft blended shapes (metaballs) so every join is smooth."""

import math
import bpy
import bmesh
from mathutils import Vector, Quaternion, Matrix

import dexlib as L
from dexlib import P

# glove geometry, in the glove's own space (the website's numbers: fingers up +Y, palm facing +Z, thumb on -X)
FINGER_X = (-0.2, 0.0, 0.2)  # index, middle, ring finger
KNUCKLE_YS = (0.13, 0.15, 0.125)  # the knuckles form an arch
FINGER_LEN = ((0.21, 0.13, 0.1), (0.23, 0.145, 0.105), (0.21, 0.135, 0.1))
FINGER_R = (0.09, 0.094, 0.088)
THUMB_BASE = (-0.27, -0.13, 0.06)
_t = (-0.78, 0.6, 0.3)
_tl = math.sqrt(sum(c * c for c in _t))
THUMB_DIR = tuple(c / _tl for c in _t)
THUMB_LEN = (0.22, 0.18)

STIFF = 2.0
FSTIFF = 4.0  # fingers blend less, so the gaps between them stay open
THRESH = 0.6
# the visible surface sits at about this fraction of an element's influence radius (found by measuring)
SURF = 0.575


def _meta(name, res):
    mb = bpy.data.metaballs.new(name)
    mb.resolution = res
    mb.render_resolution = res
    mb.threshold = THRESH
    o = bpy.data.objects.new(name, mb)
    L.collection().objects.link(o)
    return o, mb


def _surf(stiff):
    """Where the visible surface sits, as a fraction of an element's influence radius, for a given stiffness."""
    return math.sqrt(1.0 - (THRESH / stiff) ** (1.0 / 3.0))


def _ball(mb, p, r, stiff=STIFF):
    e = mb.elements.new(type="BALL")
    e.co = p
    e.radius = r / _surf(stiff)
    e.stiffness = stiff
    return e


def _capsule(mb, a, b, r, stiff=STIFF):
    a, b = Vector(a), Vector(b)
    d = b - a
    e = mb.elements.new(type="CAPSULE")
    e.co = (a + b) / 2
    e.radius = r / _surf(stiff)
    e.stiffness = stiff
    e.size_x = d.length / 2
    e.rotation = Vector((1, 0, 0)).rotation_difference(d.normalized())
    return e


def _ellipsoid(mb, p, rx, ry, rz):
    e = mb.elements.new(type="ELLIPSOID")
    e.co = p
    e.radius = 1.0 / SURF
    e.stiffness = STIFF
    e.size_x, e.size_y, e.size_z = rx, ry, rz
    return e


def _mesh_from(o):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    bpy.data.objects.remove(o)
    L.smooth(me)
    return me


def glove_mesh(name="Glove", res=0.012, mirror=False, s=1.1):
    """A cartoon hand in a soft glove, built like a real hand so that its front and back differ in SHAPE.

    Local space is the website's, converted to Blender's by P(): fingers along three.js +Y (Blender +Z), the
    palm facing three.js +Z (Blender -Y), the thumb on -X.

    The palm side: a flat, slightly cupped palm with a plump pad at the base of the thumb (thenar) and a
    smaller one along the outer edge (hypothenar). The back: an arched, domed hand with a row of knuckles
    and two or three soft tendon ridges running toward the wrist. The fingers have joint bulges, the
    middle one is longest and the little finger shortest, and the wrist is narrower than the palm.
    """
    o, mb = _meta(name, res)

    def q(x, y, z):
        return tuple(P(x * s, y * s, z * s))

    def E(p, wx, depth, length):
        # element axes: x = width, y = depth (three.js z), z = length (three.js y)
        _ellipsoid(mb, q(*p), wx * s, depth * s, length * s)

    # the palm: a broad block under the knuckles tapering to the wrist, sitting toward the back
    E((0, 0.035, -0.02), 0.31, 0.15, 0.17)
    E((0, -0.12, -0.015), 0.25, 0.135, 0.15)
    # the arch of the back of the hand
    E((0, 0.0, -0.085), 0.25, 0.075, 0.2)
    # the palm's pads, on the front
    E((-0.19, -0.1, 0.07), 0.15, 0.1, 0.17)  # the thumb's pad
    E((0.21, -0.06, 0.045), 0.09, 0.085, 0.17)  # the outer edge of the palm
    # the knuckles
    for x, ky in zip(FINGER_X, KNUCKLE_YS):
        _ball(mb, q(x, ky - 0.02, -0.105), 0.07 * s)
    # tendon ridges on the back, from each of the three middle knuckles toward the wrist
    for x, ky in zip(FINGER_X[:3], KNUCKLE_YS[:3]):
        _capsule(mb, q(x, ky - 0.05, -0.125), q(x * 0.6, -0.2, -0.09), 0.026 * s)
    # the wrist: narrower than the palm and oval
    E((0, -0.27, -0.01), 0.19, 0.12, 0.1)
    _capsule(mb, q(0, -0.3, -0.01), q(0, -0.4, -0.01), 0.17 * s)
    # the fingers: one smooth, steadily tapering finger each (a chain of overlapping soft segments), fatter
    # at the knuckle and rounded at the tip, with no bulges at the joints
    for x, ky, ln, r in zip(FINGER_X, KNUCKLE_YS, FINGER_LEN, FINGER_R):
        y0, y3 = ky - 0.02, ky + sum(ln)
        n = 7
        for k in range(n):
            t0, t1 = k / n, (k + 1) / n
            ra = r * (1.0 - 0.16 * ((t0 + t1) / 2) ** 1.3)
            _capsule(mb, q(x, y0 + (y3 - r * 0.85 - y0) * t0, 0), q(x, y0 + (y3 - r * 0.85 - y0) * t1, 0), ra * s, FSTIFF)
    # the thumb: a strong base, a joint, a softer end
    ta = THUMB_BASE
    m = tuple(ta[i] + THUMB_DIR[i] * THUMB_LEN[0] for i in range(3))
    e = tuple(m[i] + THUMB_DIR[i] * THUMB_LEN[1] for i in range(3))
    for k in range(6):
        t0, t1 = k / 6, (k + 1) / 6
        a = tuple(ta[c] + (e[c] - ta[c]) * t0 for c in range(3))
        b = tuple(ta[c] + (e[c] - ta[c]) * t1 for c in range(3))
        _capsule(mb, q(*a), q(*b), (0.094 - 0.026 * (t0 + t1) / 2) * s, FSTIFF)
    bpy.context.view_layer.update()
    me = _mesh_from(o)
    # a gentle smoothing pass that keeps the volume: the silhouette flows like a drawn glove, with no lumps
    tmp = bpy.data.objects.new(name + "Smooth", me)
    L.collection().objects.link(tmp)
    L.add_mod(tmp, "LAPLACIANSMOOTH", lambda_factor=0.55, iterations=14, use_volume_preserve=True)
    L.bake_modifiers(tmp)
    me = tmp.data
    bpy.data.objects.remove(tmp)
    if mirror:
        for v in me.vertices:
            v.co.x = -v.co.x
        me.flip_normals()
    return me


def bbox(me):
    xs = [v.co.x for v in me.vertices]
    ys = [v.co.y for v in me.vertices]
    zs = [v.co.z for v in me.vertices]
    return (min(xs), max(xs)), (min(ys), max(ys)), (min(zs), max(zs))


def boot_mesh(name="Boot", res=0.02):
    """A chunky cartoon boot (forward is -Y, up is +Z), one soft piece plus a cream sole."""
    o, mb = _meta(name + "Upper", res)
    _ellipsoid(mb, (0, -0.16, 0.34), 0.34, 0.62, 0.3)  # the foot
    _ball(mb, (0, -0.56, 0.3), 0.3)  # a round toe
    _ball(mb, (0, 0.3, 0.3), 0.3)  # the heel
    _capsule(mb, (0, 0.08, 0.45), (0, 0.1, 0.92), 0.3)  # the shaft the leg goes into
    bpy.context.view_layer.update()
    upper = _mesh_from(o)
    o2, mb2 = _meta(name + "Sole", res)
    _ellipsoid(mb2, (0, -0.14, 0.1), 0.4, 0.74, 0.1)
    bpy.context.view_layer.update()
    sole = _mesh_from(o2)
    return upper, sole


def tube_mesh(name, pts, radius_fn, sides=18):
    """A smooth tube through a list of points (parallel-transported so it never twists), with rounded ends."""
    n = len(pts)
    verts = []
    faces = []
    prev_n = None
    for i, p in enumerate(pts):
        a = pts[max(0, i - 1)]
        b = pts[min(n - 1, i + 1)]
        t = (b - a).normalized()
        if prev_n is None:
            ref = Vector((0, 1, 0)) if abs(t.y) < 0.9 else Vector((1, 0, 0))
            nn = (ref - t * ref.dot(t)).normalized()
        else:
            nn = (prev_n - t * prev_n.dot(t)).normalized()
        bb = t.cross(nn)
        prev_n = nn
        r = radius_fn(i / (n - 1))
        for k in range(sides):
            ang = 2 * math.pi * k / sides
            verts.append(p + (nn * math.cos(ang) + bb * math.sin(ang)) * r)
    for i in range(n - 1):
        for k in range(sides):
            a = i * sides + k
            b = i * sides + (k + 1) % sides
            faces.append([a, b, b + sides, a + sides])
    # caps
    c0 = len(verts)
    verts.append(pts[0])
    c1 = len(verts)
    verts.append(pts[-1])
    for k in range(sides):
        faces.append([c0, (k + 1) % sides, k])
        faces.append([c1, (n - 1) * sides + k, (n - 1) * sides + (k + 1) % sides])
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.update()
    return me


def bezier_points(s, c, h, n):
    out = []
    for i in range(n):
        t = i / (n - 1)
        out.append(s * (1 - t) ** 2 + c * 2 * t * (1 - t) + h * t * t)
    return out
