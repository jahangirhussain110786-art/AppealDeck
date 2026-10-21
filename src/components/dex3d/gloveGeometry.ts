import { BufferAttribute, BufferGeometry } from "three";
import { edgeTable as edgeT, triTable as triT } from "three/examples/jsm/objects/MarchingCubes.js";

const edgeTable = edgeT as unknown as ArrayLike<number>;
const triTable = triT as unknown as ArrayLike<number>;

/**
 * The cartoon glove as ONE smooth surface, not parts stuck together.
 *
 * A glove is described as a field of distances (a puffy palm, three tapered fingers, a thick thumb and
 * a short wrist), blended with soft joins so the palm flows into the fingers and into the webbing
 * between them. That field is turned into a mesh once, then each vertex is tied to the finger bones it
 * is nearest to, so the same smooth hand can curl, point and wave.
 *
 * Everything is in the glove's own space: the wrist at the bottom, the fingers up the +Y axis, the
 * palm facing +Z, and the thumb on the -X side.
 */

type P = { x: number; y: number; z: number };
const p3 = (x: number, y: number, z: number): P => ({ x, y, z });

/** The joints of every finger and of the thumb, in the glove's open, straight pose. */
export const FINGER_X = [-0.2, 0, 0.2] as const; // index, middle, ring finger
/** The knuckles form an arch: the middle finger's are highest. */
export const KNUCKLE_YS = [0.13, 0.15, 0.125] as const;
/** Proximal, middle and distal bones: the middle finger is the longest. */
export const FINGER_LEN = [
  { a: 0.21, b: 0.13, c: 0.1 },
  { a: 0.23, b: 0.145, c: 0.105 },
  { a: 0.21, b: 0.135, c: 0.1 },
] as const;
export const THUMB_BASE = p3(-0.27, -0.13, 0.06);
const tdx = -0.78;
const tdy = 0.6;
const tdz = 0.3;
const tl = Math.hypot(tdx, tdy, tdz);
export const THUMB_DIR = p3(tdx / tl, tdy / tl, tdz / tl);
export const THUMB_LEN = { a: 0.22, b: 0.18 } as const;

// ------------------------------------------------------------------ distance shapes
const len = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z);

/** A capsule that thins from r1 at a to r2 at b. */
function taper(p: P, a: P, b: P, r1: number, r2: number): number {
  const bx = b.x - a.x;
  const by = b.y - a.y;
  const bz = b.z - a.z;
  const px = p.x - a.x;
  const py = p.y - a.y;
  const pz = p.z - a.z;
  const t = Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz)));
  return len(px - bx * t, py - by * t, pz - bz * t) - (r1 + (r2 - r1) * t);
}

function ellipsoid(p: P, c: P, rx: number, ry: number, rz: number): number {
  const x = (p.x - c.x) / rx;
  const y = (p.y - c.y) / ry;
  const z = (p.z - c.z) / rz;
  const k0 = len(x, y, z);
  const k1 = len(x / rx, y / ry, z / rz);
  return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}

/** A soft minimum: the join between two shapes is rounded over a distance k. */
function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

const FINGER_R = [
  { r0: 0.09, r1: 0.082 },
  { r0: 0.094, r1: 0.086 },
  { r0: 0.088, r1: 0.08 },
];

function glove(p: P): number {
  const palm = ellipsoid(p, p3(0, 0.0, 0), 0.32, 0.28, 0.2);
  const wrist = taper(p, p3(0, -0.12, 0), p3(0, -0.3, 0), 0.2, 0.19);
  let fingers = 1e9;
  FINGER_X.forEach((x, i) => {
    const L = FINGER_LEN[i] ?? FINGER_LEN[0];
    const R = FINGER_R[i] ?? { r0: 0.1, r1: 0.082 };
    const ky = KNUCKLE_YS[i] ?? KNUCKLE_YS[0];
    const top = ky + L.a + L.b + L.c;
    // a finger rounded at its tip, a touch fatter at the knuckle
    fingers = Math.min(fingers, taper(p, p3(x, ky - 0.02, 0.01), p3(x, top, 0.0), R.r0, R.r1));
  });
  const ta = THUMB_BASE;
  const tb = p3(
    ta.x + THUMB_DIR.x * (THUMB_LEN.a + THUMB_LEN.b),
    ta.y + THUMB_DIR.y * (THUMB_LEN.a + THUMB_LEN.b),
    ta.z + THUMB_DIR.z * (THUMB_LEN.a + THUMB_LEN.b),
  );
  const thumb = taper(p, ta, tb, 0.15, 0.115);
  let d = smin(palm, wrist, 0.12);
  d = smin(d, fingers, 0.07);
  d = smin(d, thumb, 0.11);
  return d;
}

// ------------------------------------------------------------------ the bones, as straight segments
type Seg = { a: P; b: P };

/** Every bone's segment in the open pose, in the same order as the skeleton: root, then each finger's a b c, then the thumb's a b. */
export function boneSegments(): Seg[] {
  const segs: Seg[] = [{ a: p3(0, -0.34, 0), b: p3(0, 0.08, 0) }];
  FINGER_X.forEach((x, i) => {
    const L = FINGER_LEN[i] ?? FINGER_LEN[0];
    const y0 = KNUCKLE_YS[i] ?? KNUCKLE_YS[0];
    const y1 = y0 + L.a;
    const y2 = y1 + L.b;
    const y3 = y2 + L.c;
    segs.push(
      { a: p3(x, y0, 0), b: p3(x, y1, 0) },
      { a: p3(x, y1, 0), b: p3(x, y2, 0) },
      { a: p3(x, y2, 0), b: p3(x, y3, 0) },
    );
  });
  const a = THUMB_BASE;
  const m = p3(
    a.x + THUMB_DIR.x * THUMB_LEN.a,
    a.y + THUMB_DIR.y * THUMB_LEN.a,
    a.z + THUMB_DIR.z * THUMB_LEN.a,
  );
  const e = p3(
    m.x + THUMB_DIR.x * THUMB_LEN.b,
    m.y + THUMB_DIR.y * THUMB_LEN.b,
    m.z + THUMB_DIR.z * THUMB_LEN.b,
  );
  segs.push({ a, b: m }, { a: m, b: e });
  return segs;
}

function distToSeg(p: P, s: Seg): number {
  const bx = s.b.x - s.a.x;
  const by = s.b.y - s.a.y;
  const bz = s.b.z - s.a.z;
  const px = p.x - s.a.x;
  const py = p.y - s.a.y;
  const pz = p.z - s.a.z;
  const t = Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz)));
  return len(px - bx * t, py - by * t, pz - bz * t);
}

// ------------------------------------------------------------------ polygonise
const STEP = 0.016;
const MIN = { x: -0.7, y: -0.52, z: -0.3 };
const MAX = { x: 0.42, y: 0.88, z: 0.3 };
// the corners and edges of a cell, as in the classic marching cubes tables
const CORNER = [
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 1],
] as const;
const EDGE = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
] as const;

let cached: BufferGeometry | null = null;

/** The glove mesh, built once and shared by both hands. */
export function gloveGeometry(): BufferGeometry {
  if (cached) return cached;
  const nx = Math.round((MAX.x - MIN.x) / STEP);
  const ny = Math.round((MAX.y - MIN.y) / STEP);
  const nz = Math.round((MAX.z - MIN.z) / STEP);
  const sx = nx + 1;
  const sy = ny + 1;
  const field = new Float32Array(sx * sy * (nz + 1));
  const at = (i: number, j: number, k: number) => (k * sy + j) * sx + i;
  for (let k = 0; k <= nz; k++)
    for (let j = 0; j <= ny; j++)
      for (let i = 0; i <= nx; i++)
        field[at(i, j, k)] = glove(p3(MIN.x + i * STEP, MIN.y + j * STEP, MIN.z + k * STEP));

  const pos: number[] = [];
  const vals = new Float32Array(8);
  const ex = new Float32Array(12 * 3);
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        let cube = 0;
        for (let c = 0; c < 8; c++) {
          const o = CORNER[c] ?? CORNER[0];
          const v = field[at(i + o[0], j + o[1], k + o[2])] ?? 1;
          vals[c] = v;
          if (v < 0) cube |= 1 << c;
        }
        const edges = edgeTable[cube] ?? 0;
        if (edges === 0) continue;
        for (let e = 0; e < 12; e++) {
          if (!(edges & (1 << e))) continue;
          const [c0, c1] = EDGE[e] ?? EDGE[0];
          const a = CORNER[c0] ?? CORNER[0];
          const b = CORNER[c1] ?? CORNER[0];
          const va = vals[c0] ?? 0;
          const vb = vals[c1] ?? 0;
          const t = va / (va - vb);
          ex[e * 3] = MIN.x + (i + a[0] + (b[0] - a[0]) * t) * STEP;
          ex[e * 3 + 1] = MIN.y + (j + a[1] + (b[1] - a[1]) * t) * STEP;
          ex[e * 3 + 2] = MIN.z + (k + a[2] + (b[2] - a[2]) * t) * STEP;
        }
        for (let t = 0; t < 16; t += 3) {
          const e0 = triTable[cube * 16 + t] ?? -1;
          if (e0 < 0) break;
          const e1 = triTable[cube * 16 + t + 1] ?? 0;
          const e2 = triTable[cube * 16 + t + 2] ?? 0;
          pos.push(
            ex[e0 * 3] ?? 0,
            ex[e0 * 3 + 1] ?? 0,
            ex[e0 * 3 + 2] ?? 0,
            ex[e1 * 3] ?? 0,
            ex[e1 * 3 + 1] ?? 0,
            ex[e1 * 3 + 2] ?? 0,
            ex[e2 * 3] ?? 0,
            ex[e2 * 3 + 1] ?? 0,
            ex[e2 * 3 + 2] ?? 0,
          );
        }
      }

  const count = pos.length / 3;
  const positions = new Float32Array(pos);
  const normals = new Float32Array(count * 3);
  const skinIndex = new Uint16Array(count * 4);
  const skinWeight = new Float32Array(count * 4);
  const segs = boneSegments();
  const h = 0.004;
  for (let v = 0; v < count; v++) {
    const p = p3(positions[v * 3] ?? 0, positions[v * 3 + 1] ?? 0, positions[v * 3 + 2] ?? 0);
    // the surface normal is the direction the distance grows fastest: smooth, with no faceting
    const gx = glove(p3(p.x + h, p.y, p.z)) - glove(p3(p.x - h, p.y, p.z));
    const gy = glove(p3(p.x, p.y + h, p.z)) - glove(p3(p.x, p.y - h, p.z));
    const gz = glove(p3(p.x, p.y, p.z + h)) - glove(p3(p.x, p.y, p.z - h));
    const gl = len(gx, gy, gz) || 1;
    normals[v * 3] = gx / gl;
    normals[v * 3 + 1] = gy / gl;
    normals[v * 3 + 2] = gz / gl;
    // each vertex follows the bones nearest to it, the nearest most of all
    const ranked = segs
      .map((s, bi) => ({ bi, w: 1 / Math.pow(distToSeg(p, s) + 0.012, 4) }))
      .sort((a, b) => b.w - a.w)
      .slice(0, 4);
    const sum = ranked.reduce((acc, r) => acc + r.w, 0) || 1;
    ranked.forEach((r, n) => {
      skinIndex[v * 4 + n] = r.bi;
      skinWeight[v * 4 + n] = r.w / sum;
    });
  }
  // make every triangle face outward, by the surface normal
  for (let v = 0; v < count; v += 3) {
    const ax = (positions[(v + 1) * 3] ?? 0) - (positions[v * 3] ?? 0);
    const ay = (positions[(v + 1) * 3 + 1] ?? 0) - (positions[v * 3 + 1] ?? 0);
    const az = (positions[(v + 1) * 3 + 2] ?? 0) - (positions[v * 3 + 2] ?? 0);
    const bx = (positions[(v + 2) * 3] ?? 0) - (positions[v * 3] ?? 0);
    const by = (positions[(v + 2) * 3 + 1] ?? 0) - (positions[v * 3 + 1] ?? 0);
    const bz = (positions[(v + 2) * 3 + 2] ?? 0) - (positions[v * 3 + 2] ?? 0);
    const nxf = ay * bz - az * by;
    const nyf = az * bx - ax * bz;
    const nzf = ax * by - ay * bx;
    const dot =
      nxf * (normals[v * 3] ?? 0) +
      nyf * (normals[v * 3 + 1] ?? 0) +
      nzf * (normals[v * 3 + 2] ?? 0);
    if (dot < 0) {
      for (const arr of [positions, normals])
        for (let c = 0; c < 3; c++) {
          const t = arr[(v + 1) * 3 + c] ?? 0;
          arr[(v + 1) * 3 + c] = arr[(v + 2) * 3 + c] ?? 0;
          arr[(v + 2) * 3 + c] = t;
        }
      for (let n = 0; n < 4; n++) {
        const si = skinIndex[(v + 1) * 4 + n] ?? 0;
        skinIndex[(v + 1) * 4 + n] = skinIndex[(v + 2) * 4 + n] ?? 0;
        skinIndex[(v + 2) * 4 + n] = si;
        const sw = skinWeight[(v + 1) * 4 + n] ?? 0;
        skinWeight[(v + 1) * 4 + n] = skinWeight[(v + 2) * 4 + n] ?? 0;
        skinWeight[(v + 2) * 4 + n] = sw;
      }
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(positions, 3));
  geo.setAttribute("normal", new BufferAttribute(normals, 3));
  geo.setAttribute("skinIndex", new BufferAttribute(skinIndex, 4));
  geo.setAttribute("skinWeight", new BufferAttribute(skinWeight, 4));
  cached = geo;
  return geo;
}

/**
 * Tie a glove mesh made elsewhere (in Blender) to the same finger bones, the way the built glove is:
 * each vertex follows the bones nearest to it, the nearest most of all. The mesh must be in the glove's
 * own space (fingers along +Y, palm toward +Z), like the built one.
 */
export function skinGlove(source: BufferGeometry): BufferGeometry {
  const geo = source.clone();
  const posAttr = geo.getAttribute("position");
  const count = posAttr.count;
  const skinIndex = new Uint16Array(count * 4);
  const skinWeight = new Float32Array(count * 4);
  const segs = boneSegments();
  for (let v = 0; v < count; v++) {
    const p = p3(posAttr.getX(v), posAttr.getY(v), posAttr.getZ(v));
    const ranked = segs
      .map((s, bi) => ({ bi, w: 1 / Math.pow(distToSeg(p, s) + 0.012, 4) }))
      .sort((a, b) => b.w - a.w)
      .slice(0, 4);
    const sum = ranked.reduce((acc, r) => acc + r.w, 0) || 1;
    ranked.forEach((r, n) => {
      skinIndex[v * 4 + n] = r.bi;
      skinWeight[v * 4 + n] = r.w / sum;
    });
  }
  geo.setAttribute("skinIndex", new BufferAttribute(skinIndex, 4));
  geo.setAttribute("skinWeight", new BufferAttribute(skinWeight, 4));
  return geo;
}
