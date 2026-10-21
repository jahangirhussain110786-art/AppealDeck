import {
  ACESFilmicToneMapping,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Bone,
  Quaternion,
  Scene,
  Shape,
  Skeleton,
  SkinnedMesh,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
  Euler,
  Matrix4,
  RepeatWrapping,
  Vector2,
  Vector4,
  type Material,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { FACE_SIZE, NEUTRAL_FACE, drawFace, type Face } from "./faceTexture";
import type { DexParts } from "./dexAssets";
import {
  FINGER_LEN,
  FINGER_X,
  KNUCKLE_YS,
  THUMB_BASE,
  THUMB_DIR,
  THUMB_LEN,
  gloveGeometry,
  skinGlove,
} from "./gloveGeometry";

/**
 * Dex in real 3D, built from parts: a pillowy paper body with page edges, a binder clip, a cape that
 * moves like cloth, arms that bend, gloves with real fingers, legs and boots, and a face drawn on the
 * paper that can blink, wink and change. Everything is posed from numbers, so any pose can ease into
 * any other, and the whole character turns to look at the pointer.
 */

export type DexMood =
  "hello" | "explain" | "think" | "calm" | "cheer" | "steady" | "idle" | "thumbs" | "peace";

/** `brand` is the navy and orange Dex; `storybook` is the same page in lined paper with a red cape. */
export type DexSkin = "brand" | "storybook";

type V3 = { x: number; y: number; z: number };
type Curl = { thumb: number; index: number; middle: number; ring: number; pinky: number };
type ArmPose = { hand: V3; bend: V3; wrist: V3; curl: Curl; thumbOut: number; wave: number };
type Pose = { L: ArmPose; R: ArmPose; face: Face; roll: number; pitch: number };

const v = (x: number, y: number, z: number): V3 => ({ x, y, z });
const curl = (thumb: number, index: number, middle = index, ring = index, pinky = index): Curl => ({
  thumb,
  index,
  middle,
  ring,
  pinky,
});
const arm = (
  hand: V3,
  bend: V3,
  c: Curl,
  wrist: V3 = v(0, 0, 0),
  thumbOut = 0.5,
  wave = 0,
): ArmPose => ({ hand, bend, wrist, curl: c, thumbOut, wave });
const face = (o: Partial<Face>): Face => ({ ...NEUTRAL_FACE, ...o });

const OPEN = curl(0.1, 0.12);
const FIST = curl(0.9, 1);

const POSES: Record<DexMood, Pose> = {
  idle: {
    L: arm(v(-1.62, 1.95, 0.32), v(-0.5, 0, 0.2), OPEN, v(0, 1.35, 0)),
    R: arm(v(1.62, 1.95, 0.32), v(0.5, 0, 0.2), OPEN, v(0, -1.35, 0)),
    face: face({}),
    roll: 0,
    pitch: 0,
  },
  hello: {
    L: arm(v(-1.5, 2.15, 0.18), v(-1, 0, -0.1), FIST, v(0.3, 0.9, 0.4), 0.9),
    R: arm(v(1.95, 4.05, 0.6), v(0.9, -0.1, 0.3), curl(0.2, 0.05), v(0, 0, -0.15), 0.8, 1),
    face: face({
      eyeR: 1,
      happyR: 1,
      mouthOpen: 0.85,
      mouthSmile: 1,
      browTiltR: 0.8,
      browLiftR: 0.6,
    }),
    roll: -0.05,
    pitch: 0,
  },
  explain: {
    L: arm(v(-2.05, 2.6, 0.7), v(-0.7, -0.2, 0.4), curl(0.15, 0.1), v(-0.9, 0.5, 0.5), 0.9),
    R: arm(v(1.8, 3.8, 0.5), v(0.7, 0, 0.3), curl(0.8, 0, 1, 1, 1), v(0, -1.1, -0.1), 0.2),
    face: face({ lookX: 0.25, mouthOpen: 0.6, mouthSmile: 0.9, browTiltL: 0.4, browTiltR: 0.4 }),
    roll: 0.03,
    pitch: 0,
  },
  think: {
    L: arm(v(-0.05, 2.0, 0.86), v(-0.7, -1.0, 0.2), FIST, v(0.5, 1.3, 0)),
    R: arm(
      v(0.42, 2.35, 0.92),
      v(1.0, -1.0, 0.1),
      curl(0.7, 0.35, 1, 1, 1),
      v(0.3, -1.2, 0.3),
      0.3,
    ),
    face: face({
      browTiltL: -0.7,
      browLiftL: 0.5,
      browTiltR: 0.6,
      browLiftR: 1,
      lookX: 0.55,
      lookY: -0.7,
      mouthOpen: 0.06,
      mouthSmile: 0.3,
      mouthWidth: 0.6,
    }),
    roll: 0.07,
    pitch: -0.02,
  },
  calm: {
    L: arm(v(-0.28, 1.95, 0.88), v(-0.8, -0.2, 0.3), curl(0.3, 0.25), v(0.4, 1.4, 0), 0.4),
    R: arm(v(0.28, 1.95, 0.88), v(0.8, -0.2, 0.3), curl(0.3, 0.25), v(0.4, -1.4, 0), 0.4),
    face: face({
      eyeL: 0,
      eyeR: 0,
      browTiltL: 0.3,
      browTiltR: 0.3,
      mouthOpen: 0,
      mouthSmile: 0.7,
      mouthWidth: 0.8,
    }),
    roll: 0,
    pitch: 0.02,
  },
  cheer: {
    L: arm(v(-2.15, 4.3, 0.35), v(-0.8, 0, 0.1), curl(0.1, 0.08), v(0, 0, 0.2), 0.9),
    R: arm(v(2.15, 4.3, 0.35), v(0.8, 0, 0.1), curl(0.1, 0.08), v(0, 0, -0.2), 0.9),
    face: face({
      happyL: 1,
      happyR: 1,
      browTiltL: 0.8,
      browTiltR: 0.8,
      browLiftL: 0.6,
      browLiftR: 0.6,
      mouthOpen: 1,
      mouthSmile: 1,
      mouthWidth: 1.2,
    }),
    roll: 0.05,
    pitch: -0.03,
  },
  // both thumbs up, forearms forward: fingers curled into fists, thumbs standing up
  thumbs: {
    L: arm(v(-1.85, 3.1, 0.85), v(-0.8, -0.2, 0.2), curl(0, 1, 1, 1), v(0.55, 1.35, 0), 1),
    R: arm(v(1.85, 3.1, 0.85), v(0.8, -0.2, 0.2), curl(0, 1, 1, 1), v(0.55, -1.35, 0), 1),
    face: face({
      happyL: 0.35,
      happyR: 0.35,
      browTiltL: 0.8,
      browTiltR: 0.8,
      browLiftL: 0.5,
      browLiftR: 0.5,
      mouthOpen: 0.95,
      mouthSmile: 1,
      mouthWidth: 1.15,
    }),
    roll: 0.03,
    pitch: -0.02,
  },
  // a peace sign: index and middle finger up, ring finger and thumb folded down, the palm shown forward
  peace: {
    L: arm(v(-1.62, 1.95, 0.32), v(-0.5, 0, 0.2), OPEN, v(0, 1.35, 0)),
    R: arm(v(1.85, 3.85, 0.6), v(0.9, -0.1, 0.3), curl(0.85, 0, 0, 1), v(0, 0, -0.1), 0.2),
    face: face({
      eyeR: 1,
      happyR: 1,
      mouthOpen: 0.8,
      mouthSmile: 1,
      browTiltR: 0.8,
      browLiftR: 0.6,
    }),
    roll: -0.04,
    pitch: 0,
  },
  steady: {
    L: arm(v(-1.6, 1.95, 0.3), v(-0.5, 0, 0.2), curl(0.4, 0.4), v(0, 1.2, 0)),
    R: arm(v(1.62, 2.2, 0.55), v(0.6, 0, 0.3), curl(0.4, 0.4), v(0, -1.2, 0)),
    face: face({
      eyeL: 0.55,
      eyeR: 0.55,
      browTiltL: -0.3,
      browTiltR: -0.3,
      mouthOpen: 0,
      mouthSmile: 0,
      mouthWidth: 0.7,
      cheeks: 0.6,
    }),
    roll: 0,
    pitch: 0.02,
  },
};

const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T;

type Tree = Record<string, unknown>;

/**
 * Anticipation: before a gesture, the arms swing a little the opposite way, the way a cartoon character
 * winds up before a throw. This is that wound-up pose: the old pose pushed away from the new one.
 */
function windUp(from: Pose, to: Pose): Pose {
  const out = clone(to);
  for (const side of ["L", "R"] as const) {
    for (const part of ["hand", "bend"] as const) {
      const a = from[side][part];
      const b = to[side][part];
      const o = out[side][part];
      o.x = a.x + (a.x - b.x) * 0.22;
      o.y = a.y + (a.y - b.y) * 0.22;
      o.z = a.z + (a.z - b.z) * 0.22;
    }
  }
  return out;
}

/** The same tree with every number set to zero (the velocities that go with a pose). */
function zeroed<T>(o: T): T {
  if (typeof o === "number") return 0 as unknown as T;
  if (o && typeof o === "object") {
    const out: Tree = {};
    for (const [k, x] of Object.entries(o as Tree)) out[k] = zeroed(x);
    return out as T;
  }
  return o;
}

/**
 * Move every number in `cur` toward `tgt` like a spring: it speeds up, overshoots a little and settles.
 * That overshoot is most of what makes a cartoon arm feel soft instead of mechanical.
 */
function follow(cur: Tree, tgt: Tree, vel: Tree, k: number, c: number, h: number) {
  for (const key of Object.keys(cur)) {
    const x = cur[key];
    const t = tgt[key];
    const v0 = vel[key];
    if (typeof x === "number" && typeof t === "number" && typeof v0 === "number") {
      const v1 = v0 + (k * (t - x) - c * v0) * h;
      vel[key] = v1;
      cur[key] = x + v1 * h;
    } else if (x && t && v0 && typeof x === "object" && typeof t === "object") {
      follow(x as Tree, t as Tree, v0 as Tree, k, c, h);
    }
  }
}

/** One number on a spring. Poke `v` for a kick; it rings and settles on its own. */
class Spring {
  x = 0;
  v = 0;
  step(target: number, k: number, c: number, dt: number) {
    const n = Math.max(1, Math.ceil(dt / 0.006));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      this.v += (k * (target - this.x) - c * this.v) * h;
      this.x += this.v * h;
    }
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * Makes the paper bend and bulge like soft stuff: its top leans (and trails a turn), it stretches and
 * squashes, and it puffs out for a moment when he lands or is poked. The values are shared by every
 * part of the body so the paper, the pages, the corner, the clip and the face move as one.
 */
type Jelly = { uJ: { value: Vector4 }; uJB: { value: Vector2 } };
function makeJelly(): Jelly {
  return { uJ: { value: new Vector4() }, uJB: { value: new Vector2(-1.3, 2.6) } };
}
function applyJelly<M extends Material>(mat: M, j: Jelly): M {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uJ = j.uJ;
    shader.uniforms.uJB = j.uJB;
    shader.vertexShader =
      "uniform vec4 uJ;\nuniform vec2 uJB;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float jh = clamp((position.y - uJB.x) / uJB.y, 0.0, 1.2);
        float jq = jh * jh;
        transformed.x += uJ.x * jq;
        transformed.y += uJ.w * jq;
        float jb = clamp(4.0 * jh * (1.0 - jh), 0.0, 1.0);
        transformed.xz *= 1.0 + uJ.z * jb;`,
      );
  };
  mat.customProgramCacheKey = () => "dex-jelly";
  return mat;
}

const ARM_SEG = 26;
const ARM_RAD = 14;

/** An arm that is updated in place every frame (no new geometry), a little thinner at the wrist. */
function makeArmGeometry() {
  const geo = new BufferGeometry();
  geo.setAttribute(
    "position",
    new BufferAttribute(new Float32Array((ARM_SEG + 1) * ARM_RAD * 3), 3),
  );
  const idx: number[] = [];
  for (let j = 0; j < ARM_SEG; j++)
    for (let i = 0; i < ARM_RAD; i++) {
      const a = j * ARM_RAD + i;
      const b = j * ARM_RAD + ((i + 1) % ARM_RAD);
      idx.push(a, b, a + ARM_RAD, b, b + ARM_RAD, a + ARM_RAD);
    }
  geo.setIndex(idx);
  return geo;
}

const armPoint = new Vector3();
const armT = new Vector3();
const armN = new Vector3();
const armB = new Vector3();

/**
 * Fill the arm along the first `tEnd` of the curve. The surface keeps one steady twist (no pinching at
 * bends) and is a little slimmer at the elbow, then widens again so it flows into the glove's cuff.
 */
function fillArm(geo: BufferGeometry, curve: CatmullRomCurve3, tEnd: number) {
  const pos = geo.attributes.position!.array as Float32Array;
  for (let j = 0; j <= ARM_SEG; j++) {
    const u = j / ARM_SEG;
    const t = tEnd * u;
    curve.getPoint(t, armPoint);
    curve.getTangent(t, armT);
    if (j === 0) {
      armN.set(0, 0, 1);
      armN.addScaledVector(armT, -armN.dot(armT));
      if (armN.lengthSq() < 1e-4) armN.set(1, 0, 0).addScaledVector(armT, -armT.x);
      armN.normalize();
    } else {
      armN.addScaledVector(armT, -armN.dot(armT)).normalize();
    }
    armB.crossVectors(armT, armN);
    const r = 0.205 - 0.04 * Math.sin(Math.PI * u) - 0.006 * u;
    for (let i = 0; i < ARM_RAD; i++) {
      const ang = (i / ARM_RAD) * Math.PI * 2;
      const cs = Math.cos(ang) * r;
      const sn = Math.sin(ang) * r;
      const o = (j * ARM_RAD + i) * 3;
      pos[o] = armPoint.x + armN.x * cs + armB.x * sn;
      pos[o + 1] = armPoint.y + armN.y * cs + armB.y * sn;
      pos[o + 2] = armPoint.z + armN.z * cs + armB.z * sn;
    }
  }
  geo.attributes.position!.needsUpdate = true;
  geo.computeVertexNormals();
}

/** Bake a part's own position into its geometry, so the jelly sees it in body space. */
function bake(mesh: Mesh, parent: Matrix4 | null = null) {
  mesh.updateMatrix();
  const m = parent ? new Matrix4().multiplyMatrices(parent, mesh.matrix) : mesh.matrix;
  mesh.geometry.applyMatrix4(m);
  mesh.position.set(0, 0, 0);
  mesh.rotation.set(0, 0, 0);
  mesh.scale.set(1, 1, 1);
}

// ---------------------------------------------------------------------------------------------- materials
const NAVY = 0x182f78;

/** Notebook paper: one blue rule every quarter unit and a red margin, repeated over the paper's front. */
function linedTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 64;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = "#fffefa";
    g.fillRect(0, 0, 1024, 64);
    g.fillStyle = "rgba(78,126,218,0.78)";
    g.fillRect(0, 57, 1024, 4);
    g.fillStyle = "rgba(228,84,84,0.55)";
    g.fillRect(407, 0, 3, 64);
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(1 / 6, 4);
  t.offset.set(0.5, 0);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function materials(skin: DexSkin) {
  const m = baseMaterials();
  if (skin !== "brand") {
    m.paper.color.set(0xffffff);
    m.paper.map = linedTexture();
    m.paper.roughness = 0.62;
    m.paper.clearcoat = 0.12;
    m.page1.color.set(0xf3efe4);
    m.page2.color.set(0xe4dfd0);
    m.fold.color.set(0xefeadc);
    m.fold.roughness = 0.6;
    m.navy.color.set(0xf8f5ee); // limbs
    m.navy.roughness = 0.5;
    m.navy.clearcoat = 0.25;
    m.trim.color.set(0xf8f5ee);
    m.cape.color.set(0xd3211f);
    m.cape.sheenColor.set(0xff8a78);
    m.orange.color.set(0xa91a1e); // the cape's hem
    m.bootBlue.color.set(0xd8232a);
    m.brass.color.set(0xf0b83a);
  }
  return m;
}

function baseMaterials() {
  return {
    fold: new MeshPhysicalMaterial({
      color: 0xe95d0e,
      roughness: 0.34,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
    }),
    trim: new MeshPhysicalMaterial({
      color: 0xe95d0e,
      roughness: 0.34,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
    }),
    paper: new MeshPhysicalMaterial({
      color: 0xeef3fd,
      roughness: 0.46,
      clearcoat: 0.4,
      clearcoatRoughness: 0.45,
    }),
    page1: new MeshPhysicalMaterial({ color: 0xd2daf0, roughness: 0.55, clearcoat: 0.2 }),
    page2: new MeshPhysicalMaterial({ color: 0xb6c3e4, roughness: 0.55, clearcoat: 0.2 }),
    navy: new MeshPhysicalMaterial({
      color: NAVY,
      roughness: 0.36,
      clearcoat: 0.7,
      clearcoatRoughness: 0.25,
    }),
    cape: new MeshPhysicalMaterial({
      color: 0x14296b,
      roughness: 0.5,
      sheen: 0.45,
      sheenColor: new Color(0x5473c9),
      sheenRoughness: 0.5,
      side: DoubleSide,
    }),
    orange: new MeshPhysicalMaterial({
      color: 0xe95d0e,
      roughness: 0.34,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
    }),
    glove: new MeshPhysicalMaterial({
      color: 0xfbfcff,
      roughness: 0.38,
      clearcoat: 0.6,
      clearcoatRoughness: 0.4,
      sheen: 0.6,
      sheenColor: new Color(0xdfe7f7),
    }),
    bootBlue: new MeshPhysicalMaterial({
      color: 0x1f419a,
      roughness: 0.28,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
    }),
    sole: new MeshPhysicalMaterial({ color: 0xf0e7d4, roughness: 0.5, clearcoat: 0.3 }),
    brass: new MeshPhysicalMaterial({ color: 0xe8a04a, roughness: 0.28, metalness: 0.65 }),
    clipMetal: new MeshPhysicalMaterial({ color: 0xa9c0ee, roughness: 0.22, metalness: 0.6 }),
  };
}

type Mats = ReturnType<typeof baseMaterials>;

// ---------------------------------------------------------------------------------------------- body shape
type Dims = { w: number; h: number; corner: number; cut: number };
const PAGE: Dims = { w: 2.2, h: 2.6, corner: 0.36, cut: 0.62 };
const BODY_W = PAGE.w;
const BODY_H = PAGE.h;
const DEPTH = 0.5;
const BEVEL = 0.17;

function paperShape(inset = 0, d: Dims = PAGE): Shape {
  const w = d.w / 2 - inset;
  const h = d.h / 2 - inset;
  const r = d.corner;
  const CUT = d.cut;
  const s = new Shape();
  s.moveTo(-w + r, -h);
  s.lineTo(w - r, -h);
  s.quadraticCurveTo(w, -h, w, -h + r);
  if (CUT === 0) {
    s.lineTo(w, h - r);
    s.quadraticCurveTo(w, h, w - r, h);
  } else {
    s.lineTo(w, h - CUT);
    s.lineTo(w - CUT, h);
  }
  s.lineTo(-w + r, h);
  s.quadraticCurveTo(-w, h, -w, h - r);
  s.lineTo(-w, -h + r);
  s.quadraticCurveTo(-w, -h, -w + r, -h);
  return s;
}

function slab(depth: number, bevel: number, inset = 0, d: Dims = PAGE) {
  const g = new ExtrudeGeometry(paperShape(inset, d), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 7,
    curveSegments: 18,
  });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

function foldShape(): Shape {
  const w = BODY_W / 2;
  const h = BODY_H / 2;
  const CUT = PAGE.cut;
  const s = new Shape();
  const a = { x: w - CUT, y: h };
  const b = { x: w, y: h - CUT };
  const c = { x: w - CUT, y: h - CUT };
  s.moveTo(a.x, a.y);
  s.lineTo(b.x, b.y);
  s.quadraticCurveTo(c.x + 0.22, c.y - 0.02, c.x + 0.06, c.y);
  s.quadraticCurveTo(c.x - 0.02, c.y + 0.02, a.x, a.y);
  return s;
}

function radialTexture(inner: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  if (g) {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, inner);
    gr.addColorStop(1, outer);
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

// ---------------------------------------------------------------------------------------------- the glove
type Glove = {
  root: Group;
  fingers: Bone[];
  mids: Bone[];
  tips: Bone[];
  thumb: Bone;
  thumbTip: Bone;
};

/**
 * A cartoon glove: one smooth, soft surface (see gloveGeometry.ts) with a finger skeleton inside, and a
 * thick orange cuff at the wrist. `mirror` makes the other hand, so both thumbs point toward the body.
 */
function makeGlove(mats: Mats, mirror: boolean, parts?: DexParts): Glove {
  const root = new Group();
  const size = 1.1;
  root.scale.set(mirror ? -size : size, size, size);
  const rootBone = new Bone();
  const bones: Bone[] = [rootBone];
  const fingers: Bone[] = [];
  const mids: Bone[] = [];
  const tips: Bone[] = [];
  FINGER_X.forEach((x, i) => {
    const L = FINGER_LEN[i] ?? FINGER_LEN[0];
    const a = new Bone();
    a.position.set(x, KNUCKLE_YS[i] ?? KNUCKLE_YS[0], 0);
    const b = new Bone();
    b.position.set(0, L.a, 0);
    const c = new Bone();
    c.position.set(0, L.b, 0);
    a.add(b);
    b.add(c);
    rootBone.add(a);
    bones.push(a, b, c);
    fingers.push(a);
    mids.push(b);
    tips.push(c);
  });
  const ta = new Bone();
  ta.position.set(THUMB_BASE.x, THUMB_BASE.y, THUMB_BASE.z);
  const tb = new Bone();
  tb.position.set(THUMB_DIR.x * THUMB_LEN.a, THUMB_DIR.y * THUMB_LEN.a, THUMB_DIR.z * THUMB_LEN.a);
  ta.add(tb);
  rootBone.add(ta);
  bones.push(ta, tb);
  const mesh = new SkinnedMesh(parts ? skinGlove(parts.glove) : gloveGeometry(), mats.glove);
  mesh.frustumCulled = false;
  mesh.add(rootBone);
  root.add(mesh);
  const cuff = new Mesh(new TorusGeometry(0.215, 0.095, 20, 40), mats.trim);
  cuff.rotation.x = Math.PI / 2;
  cuff.position.y = -0.3;
  root.add(cuff);
  root.updateMatrixWorld(true);
  mesh.bind(new Skeleton(bones));
  return { root, fingers, mids, tips, thumb: ta, thumbTip: tb };
}

// ---------------------------------------------------------------------------------------------- the boot
function makeBoot(mats: Mats, parts?: DexParts) {
  if (parts) {
    // the Blender boot: a soft upper and a cream sole, already at the right size
    const bg = new Group();
    bg.add(
      new Mesh(parts.bootUpper.clone(), mats.bootBlue),
      new Mesh(parts.bootSole.clone(), mats.sole),
    );
    return bg;
  }
  const g = new Group();
  // the side view of the shoe: heel on the left, toe on the right, the ankle opening at the top
  const sh = new Shape();
  sh.moveTo(-0.55, 0.12);
  sh.lineTo(0.6, 0.12);
  sh.bezierCurveTo(0.98, 0.12, 1.1, 0.36, 0.98, 0.52);
  sh.bezierCurveTo(0.88, 0.62, 0.58, 0.62, 0.34, 0.7);
  sh.lineTo(0.14, 0.84);
  sh.lineTo(-0.4, 0.84);
  sh.bezierCurveTo(-0.6, 0.78, -0.66, 0.46, -0.62, 0.3);
  sh.bezierCurveTo(-0.6, 0.2, -0.57, 0.15, -0.55, 0.12);
  const width = 0.46;
  const bevel = 0.2;
  const geo = new ExtrudeGeometry(sh, {
    depth: width,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.9,
    bevelSegments: 10,
    curveSegments: 28,
  });
  geo.translate(0, 0, -width / 2);
  geo.rotateY(-Math.PI / 2); // the shoe's length now runs forward, toward the viewer
  geo.computeVertexNormals();
  const upper = new Mesh(geo, mats.bootBlue);
  upper.position.set(0, 0.1, -0.12);
  g.add(upper);
  // the cream sole, the same shape from above, so it reads as the shoe's own rim
  const sole = new Mesh(new CapsuleGeometry(0.5, 0.74, 14, 28), mats.sole);
  sole.rotation.x = Math.PI / 2;
  sole.scale.set(1, 1, 0.3);
  sole.position.set(0, 0.1, 0.25);
  g.add(sole);
  // the dark ankle opening, where the leg goes in
  const opening = new Mesh(new SphereGeometry(1, 24, 16), mats.navy);
  opening.scale.set(0.33, 0.07, 0.3);
  opening.position.set(0, 0.93, -0.38);
  g.add(opening);
  // laces across the tongue
  for (let i = 0; i < 3; i++) {
    const lace = new Mesh(new CapsuleGeometry(0.035, 0.34, 6, 10), mats.glove);
    lace.rotation.z = Math.PI / 2;
    lace.rotation.x = 0.7;
    lace.position.set(0, 0.8 - i * 0.1, 0.2 + i * 0.12);
    g.add(lace);
  }
  // a soft, glossy highlight on the toe
  const shine = new MeshBasicMaterial({ color: 0xbcd8ff, transparent: true, opacity: 0.8 });
  const hi = new Mesh(new SphereGeometry(0.1, 18, 12), shine);
  hi.scale.set(1.5, 0.5, 1.2);
  hi.position.set(-0.18, 0.7, 0.78);
  hi.rotation.set(-0.4, -0.25, 0);
  g.add(hi);
  g.scale.setScalar(0.8);
  return g;
}

// ---------------------------------------------------------------------------------------------- the cape
const CAPE_NU = 40;
const CAPE_NV = 20;
const HEM_SIDES = 8;

/** How hard the body's motion is pulling the cape: sideways, up and back. Set every frame. */
const capeDrive = { sx: 0, sy: 0, sz: 0 };
type CapeCfg = { top: number; drop: number; r0: number; r1: number };
const BRAND_CAPE: CapeCfg = { top: 3.55, drop: 2.7, r0: 1.25, r1: 2.35 };
let capeCfg: CapeCfg = BRAND_CAPE;

function capePoint(u: number, vv: number, t: number, out: Vector3) {
  const a = (u - 0.5) * 3.2;
  const e = Math.pow(vv, 1.12);
  const R = capeCfg.r0 + (capeCfg.r1 - capeCfg.r0) * e;
  const wave =
    0.3 * Math.pow(vv, 1.3) * Math.sin(a * 5 + t * 1.6 + vv * 2.2) +
    0.08 * vv * vv * Math.sin(a * 9 - t * 2.1);
  const r = R + wave;
  out.x = r * Math.sin(a);
  // a curved hem: longest down the back, shorter at the sides
  out.y =
    capeCfg.top -
    capeCfg.drop * vv -
    0.42 * vv * vv * (1 - Math.min(1, Math.abs(a) / 1.6)) +
    0.06 * wave;
  out.z = -0.3 - 0.58 * r * Math.cos(a) * Math.pow(vv, 0.7) - 0.1 * wave;
  // the body's motion drags the hem: it trails a turn, lifts when he drops and swings out behind
  out.x += capeDrive.sx * Math.pow(vv, 1.5) * 1.25;
  out.y += capeDrive.sy * Math.pow(vv, 1.3) * 0.9;
  out.z -= capeDrive.sz * Math.pow(vv, 1.4) * 0.8;
  return out;
}

function makeCape(mats: Mats, cfg: CapeCfg) {
  const cols = CAPE_NU + 1;
  const rows = CAPE_NV + 1;
  const pos = new Float32Array(cols * rows * 3);
  const idx: number[] = [];
  for (let j = 0; j < CAPE_NV; j++)
    for (let i = 0; i < CAPE_NU; i++) {
      const a = j * cols + i;
      idx.push(a, a + cols, a + 1, a + 1, a + cols, a + cols + 1);
    }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  geo.setIndex(idx);
  const mesh = new Mesh(geo, mats.cape);

  const ringN = CAPE_NU + 1;
  const hemPos = new Float32Array(ringN * HEM_SIDES * 3);
  const hemIdx: number[] = [];
  for (let i = 0; i < ringN - 1; i++)
    for (let k = 0; k < HEM_SIDES; k++) {
      const a = i * HEM_SIDES + k;
      const b = i * HEM_SIDES + ((k + 1) % HEM_SIDES);
      hemIdx.push(a, a + HEM_SIDES, b, b, a + HEM_SIDES, b + HEM_SIDES);
    }
  const hemGeo = new BufferGeometry();
  hemGeo.setAttribute("position", new BufferAttribute(hemPos, 3));
  hemGeo.setIndex(hemIdx);
  const hem = new Mesh(hemGeo, mats.orange);

  const p = new Vector3();
  const q = new Vector3();
  const n = new Vector3();
  const tan = new Vector3();
  const bi = new Vector3();
  const up = new Vector3(0, 1, 0);
  function update(t: number) {
    capeCfg = cfg;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        capePoint(i / CAPE_NU, j / CAPE_NV, t, p);
        const o = (j * cols + i) * 3;
        pos[o] = p.x;
        pos[o + 1] = p.y;
        pos[o + 2] = p.z;
      }
    geo.attributes.position!.needsUpdate = true;
    geo.computeVertexNormals();
    for (let i = 0; i < ringN; i++) {
      capePoint(i / CAPE_NU, 1, t, p);
      capePoint(Math.min(1, (i + 1) / CAPE_NU), 1, t, q);
      capePoint(Math.max(0, (i - 1) / CAPE_NU), 1, t, tan);
      tan.subVectors(q, tan).normalize();
      n.crossVectors(tan, up).normalize();
      bi.crossVectors(tan, n).normalize();
      for (let k = 0; k < HEM_SIDES; k++) {
        const ang = (k / HEM_SIDES) * Math.PI * 2;
        const c = Math.cos(ang) * 0.1;
        const s = Math.sin(ang) * 0.1;
        const o = (i * HEM_SIDES + k) * 3;
        hemPos[o] = p.x + n.x * c + bi.x * s;
        hemPos[o + 1] = p.y + n.y * c + bi.y * s;
        hemPos[o + 2] = p.z + n.z * c + bi.z * s;
      }
    }
    hemGeo.attributes.position!.needsUpdate = true;
    hemGeo.computeVertexNormals();
  }
  update(0);
  const group = new Group();
  group.add(mesh, hem);
  return { group, update };
}

// ---------------------------------------------------------------------------------------------- the controller
export type DexController = {
  setMood(m: DexMood): void;
  /** The pointer, relative to Dex: -1 to 1 on each axis. */
  setLook(x: number, y: number): void;
  /** Turn him by hand, in radians; null returns control to the pointer. */
  setYaw(angle: number | null): void;
  hop(): void;
  /** A jelly poke: he puffs out and wobbles. */
  boing(): void;
  /** A full turn on the spot, with a bit of overshoot at the end. */
  spin(): void;
  resize(width: number, height: number): void;
  start(): void;
  stop(): void;
  /** Draw one frame now (used when motion is reduced). */
  renderOnce(): void;
  /** The face values now, for the developer page. */
  debug(): Face;
  /** The face texture as a PNG data URL (used to build the Blender model). */
  faceImage(): string;
  /** Developer camera: look at a point from closer in. Null puts it back. */
  setView(v: { x: number; y: number; fov: number } | null): void;
  dispose(): void;
};

export function createDex(
  canvas: HTMLCanvasElement,
  opts: {
    still?: boolean;
    skin?: DexSkin;
    /** Parts modelled in Blender (see dexAssets.ts). Without them the parts are built in code. */
    parts?: DexParts;
    /** Called if the animation cannot keep up even at the lowest quality. */
    onSlow?: () => void;
  } = {},
): DexController {
  const skin: DexSkin = opts.skin ?? "brand";
  const story = skin !== "brand";
  const parts = opts.parts;
  const dims = PAGE;
  const depth = story ? 0.62 : DEPTH;
  const bevel = story ? 0.27 : BEVEL;
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.7;
  scene.add(new HemisphereLight(0xffffff, 0xb7c8f0, 0.38));
  scene.add(new AmbientLight(0xffffff, 0.15));
  const key = new DirectionalLight(0xfff4e6, 2.1);
  key.position.set(3.5, 7, 6);
  scene.add(key);
  const fill = new DirectionalLight(0xdfe8ff, 0.9);
  fill.position.set(-4, 3, 7);
  scene.add(fill);
  const rim = new DirectionalLight(0xa8c4ff, 0.9);
  rim.position.set(-5, 4, -4);
  scene.add(rim);

  const camera = new PerspectiveCamera(27, 1, 0.1, 60);
  camera.position.set(0, 2.85, 12.8);
  camera.lookAt(0, 2.65, 0);

  const mats = materials(skin);
  const jelly = makeJelly();
  jelly.uJB.value.set(-dims.h / 2, dims.h);
  const extras: Array<{ dispose(): void }> = [];
  const root = new Group();
  scene.add(root);

  // soft contact shadow, which stays on the floor while he turns
  const shadowTex = radialTexture("rgba(11,20,41,0.5)", "rgba(11,20,41,0)");
  const shadow = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  shadow.scale.set(4.4, 2.3, 1);
  scene.add(shadow);

  // legs and boots
  const boots: Group[] = [];
  for (const sx of [-1, 1]) {
    const leg = new Mesh(new CylinderGeometry(0.21, 0.21, 0.7, 24), mats.navy);
    const lx = 0.7;
    leg.position.set(sx * lx, 1.02, -0.02);
    root.add(leg);
    const band = new Mesh(new TorusGeometry(0.25, 0.1, 16, 32), mats.trim);
    band.rotation.x = Math.PI / 2;
    band.position.set(sx * lx, 1.0, -0.02);
    root.add(band);
    const boot = makeBoot(mats, parts);
    boot.position.set(sx * (lx + 0.04), 0, 0.12);
    boot.rotation.y = sx * 0.5;
    root.add(boot);
    boots.push(boot);
  }

  // cape
  const cape = makeCape(mats, BRAND_CAPE);
  root.add(cape.group);
  for (const sx of [-1, 1]) {
    const clasp = new Mesh(new SphereGeometry(0.15, 20, 14), mats.brass);
    clasp.position.set(sx * 1.24, 3.5, 0.06);
    root.add(clasp);
  }

  // the paper body: pages behind, the pillowy front, the fold, the clip, the face
  const BODY_Y = 1.4 + BODY_H / 2;
  const body = new Group();
  body.position.set(0, BODY_Y, 0);
  root.add(body);
  // every part of the body is built in body space and bent by the same jelly, so nothing tears apart
  const page2 = new Mesh(slab(depth, bevel * 0.8, 0.02, dims), applyJelly(mats.page2, jelly));
  page2.position.set(0.13, -0.1, -0.4);
  bake(page2);
  const page1 = new Mesh(slab(depth, bevel * 0.8, 0.01, dims), applyJelly(mats.page1, jelly));
  page1.position.set(0.065, -0.05, -0.2);
  bake(page1);
  const paper = new Mesh(slab(depth, bevel, 0, dims), applyJelly(mats.paper, jelly));
  body.add(page2, page1, paper);

  const fold = new Mesh(
    new ExtrudeGeometry(foldShape(), {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.035,
      bevelSegments: 4,
    }),
    applyJelly(mats.fold, jelly),
  );
  fold.position.set(0, 0, depth / 2 + bevel - 0.01);
  bake(fold);
  body.add(fold);

  const clipNavy = applyJelly(mats.navy.clone(), jelly);
  extras.push(clipNavy);
  const clip = new Group();
  clip.position.set(0, BODY_H / 2 + 0.02, depth / 2 + bevel - 0.18);
  clip.updateMatrix();
  const clipBody = new Mesh(new RoundedBoxGeometry(1.2, 0.46, 0.6, 8, 0.17), clipNavy);
  clipBody.position.y = 0.1;
  const hinge = new Mesh(
    new CylinderGeometry(0.06, 0.06, 0.9, 16),
    applyJelly(mats.clipMetal, jelly),
  );
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, 0.4, 0.0);
  for (const part of [clipBody, hinge]) {
    bake(part, clip.matrix);
    part.visible = !story; // the storybook hero has a curled corner and no clip
    body.add(part);
  }

  const faceCanvas = document.createElement("canvas");
  faceCanvas.width = FACE_SIZE.width;
  faceCanvas.height = FACE_SIZE.height;
  const faceCtx = faceCanvas.getContext("2d");
  const faceTex = new CanvasTexture(faceCanvas);
  faceTex.colorSpace = SRGBColorSpace;
  faceTex.anisotropy = 4;
  // glTF stores the face plate's texture coordinates the other way up from the built plate
  if (parts) faceTex.flipY = false;
  // modelled parts replace the built ones, in the same body space; their baked soft shadows ride in the vertex colours
  if (parts) {
    const swap = (m: Mesh, g: BufferGeometry) => {
      m.geometry.dispose();
      m.geometry = g.clone();
    };
    swap(paper, parts.paper);
    swap(page1, parts.page1);
    swap(page2, parts.page2);
    swap(fold, parts.fold);
    swap(clipBody, parts.clip);
    swap(hinge, parts.hinge);
    for (const m of [
      mats.paper,
      mats.page1,
      mats.page2,
      mats.fold,
      clipNavy,
      mats.clipMetal,
      mats.glove,
      mats.bootBlue,
      mats.sole,
    ]) {
      m.vertexColors = true;
      m.needsUpdate = true;
    }
  }
  const faceMat = applyJelly(
    new MeshBasicMaterial({
      map: faceTex,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
    jelly,
  );
  extras.push(faceMat);
  const facePlane = new Mesh(
    parts ? parts.face.clone() : new PlaneGeometry(dims.w, dims.h),
    faceMat,
  );
  if (!parts) {
    facePlane.position.set(0, 0, depth / 2 + bevel + 0.003);
    bake(facePlane);
  }
  body.add(facePlane);

  // arms and gloves
  const armMeshes = {
    L: new Mesh(makeArmGeometry(), mats.navy),
    R: new Mesh(makeArmGeometry(), mats.navy),
  };
  armMeshes.L.frustumCulled = armMeshes.R.frustumCulled = false;
  root.add(armMeshes.L, armMeshes.R);
  const gloves = { L: makeGlove(mats, true, parts), R: makeGlove(mats, false, parts) };
  root.add(gloves.L.root, gloves.R.root);
  const shoulder = { L: new Vector3(-1.2, 2.85, 0), R: new Vector3(1.2, 2.85, 0) };
  for (const sx of [-1, 1]) {
    const cap = new Mesh(new SphereGeometry(0.2, 24, 18), mats.navy);
    cap.position.set(sx * 1.2, 2.85, 0);
    root.add(cap);
  }

  // state
  let mood: DexMood = "hello";
  const cur: Pose = clone(POSES.hello);
  let tgt: Pose = clone(POSES.hello);
  const vel: Pose = zeroed(clone(POSES.hello));
  // the springs that give him weight: the lean of the paper, how far the top stretches, the puff,
  // how the whole head lags a hop, how the cape is dragged, and the turn itself
  const lean = new Spring();
  const stretch = new Spring();
  const puff = new Spring();
  const headY = new Spring();
  const capeX = new Spring();
  const capeY = new Spring();
  const capeZ = new Spring();
  const yawS = new Spring();
  const pitchS = new Spring();
  let prevYaw = 0;
  let prevLift = 0;
  let vy = 0;
  let spinT = -1;
  let viewOverride: { x: number; y: number; fov: number } | null = null;
  let lookX = 0;
  let lookY = 0;
  let lastLookAt = -99;
  let lastCheerHop = 0;
  let yaw = 0;
  let pitch = 0;
  let yawOverride: number | null = null;
  let hopT = -1;
  let nextHop = 9;
  let nextBlink = 2.5;
  let blinkT = -1;
  let blinkDouble = false;
  const eyeX = new Spring();
  const eyeY = new Spring();
  const bootS = new Spring();
  // overlapping action: the wrist flops behind the forearm and every finger curls on its own spring
  const wristX = { L: new Spring(), R: new Spring() };
  const wristZ = { L: new Spring(), R: new Spring() };
  const prevHand = { L: new Vector3(), R: new Vector3() };
  let handsReady = false;
  const fingerS = {
    L: Array.from({ length: 4 }, () => new Spring()),
    R: Array.from({ length: 4 }, () => new Spring()),
  };
  let stepDt = 0.016;
  const tEndV = new Vector3();
  let pendingTgt: Pose | null = null;
  let windT = 0;
  let sacT = 1;
  let sacX = 0;
  let sacY = 0;
  let running = false;
  let raf = 0;
  let last = 0;
  let clock = 0;
  let faceKey = "";
  let width = 1;
  let height = 1;

  const yAxis = new Vector3(0, 1, 0);
  const forward = new Vector3();
  const qa = new Quaternion();
  const qb = new Quaternion();
  const eul = new Euler();

  function drawIfChanged(f: Face, force = false) {
    const key = Object.values(f)
      .map((n) => (n as number).toFixed(2))
      .join(",");
    if (!force && key === faceKey) return;
    faceKey = key;
    // the springs can overshoot a little, which is lovely on a mouth and not on an eyelid
    const g: Face = {
      ...f,
      eyeL: clamp(f.eyeL, 0, 1.12),
      eyeR: clamp(f.eyeR, 0, 1.12),
      happyL: clamp(f.happyL, 0, 1),
      happyR: clamp(f.happyR, 0, 1),
      cheeks: clamp(f.cheeks, 0, 1),
      mouthOpen: clamp(f.mouthOpen, 0, 1.15),
    };
    if (faceCtx) drawFace(faceCtx, g, story);
    faceTex.needsUpdate = true;
  }

  /** The little movements that keep each mood alive: a bob, a tap, a pump, a sway. */
  function armMotion(side: "L" | "R", t: number): V3 {
    const k = side === "R" ? 1 : -1;
    switch (mood) {
      case "explain":
        return side === "R"
          ? v(Math.sin(t * 2.4) * 0.05, Math.sin(t * 3) * 0.09, 0)
          : v(0, Math.sin(t * 1.7 + 1) * 0.06, Math.sin(t * 1.7) * 0.04);
      case "think":
        return side === "R"
          ? v(Math.sin(t * 5) * 0.015, Math.max(0, Math.sin(t * 5)) * 0.045, 0)
          : v(0, Math.sin(t * 1.4) * 0.02, 0);
      case "calm":
        return v(0, Math.sin(t * 1.3) * 0.045, Math.sin(t * 1.3) * 0.02);
      case "cheer":
        return v(
          k * Math.sin(t * 5) * 0.08,
          Math.sin(t * 5 + (side === "R" ? 0 : Math.PI)) * 0.34,
          0,
        );
      case "hello":
        return side === "L" ? v(0, Math.sin(t * 1.8) * 0.03, 0) : v(0, 0, 0);
      default:
        return v(
          k * Math.sin(t * 1.2) * 0.03,
          Math.sin(t * 1.5 + (side === "R" ? 0 : 1)) * 0.04,
          0,
        );
    }
  }

  // ------------------------------------------------------------------------------------ solid parts
  // Nothing may pass through anything else. The paper is a solid box; each hand is a solid ball that
  // cannot overlap the other hand, the paper, or the other arm. Where two parts meet they now touch,
  // or one rests in front of the other, the way real things do.
  type Side = "L" | "R";
  type Plan = {
    hand: Vector3;
    elbow: Vector3;
    q: Quaternion;
    axis: Vector3;
    pts: Vector3[];
    ext: Vector3;
  };
  const BX = BODY_W / 2 + bevel;
  const BZ = parts ? 0.5 : depth / 2 + bevel;
  const BY0 = 1.4 - bevel;
  const BY1 = 1.4 + BODY_H + bevel;
  const push = new Vector3();

  /** If a ball of radius `r` at `p` is inside the paper, move it out the shortest way. */
  function outOfBody(p: Vector3, r: number, out: Vector3): boolean {
    const ex = BX + r;
    const ez = BZ + r;
    const y0 = BY0 - r;
    const y1 = BY1 + r;
    out.set(0, 0, 0);
    if (Math.abs(p.x) >= ex || p.y <= y0 || p.y >= y1 || p.z >= ez || p.z <= -ez) return false;
    const dx = ex - Math.abs(p.x);
    const dyU = y1 - p.y;
    const dyD = p.y - y0;
    const dzF = ez - p.z;
    const dzB = (p.z + ez) * 1.6; // out through the back is the last choice
    const m = Math.min(dx, dyU, dyD, dzF, dzB);
    if (m === dx) out.x = (p.x < 0 ? -1 : 1) * dx;
    else if (m === dzF) out.z = dzF;
    else if (m === dyU) out.y = dyU;
    else if (m === dyD) out.y = -dyD;
    else out.z = -m / 1.6;
    p.add(out);
    return true;
  }

  const HAND_R = 0.3;
  const ARM_R = 0.2;

  /** Keep the hands out of the paper and out of each other. */
  function resolveHands(hl: Vector3, hr: Vector3) {
    const d = new Vector3();
    for (let it = 0; it < 4; it++) {
      d.subVectors(hr, hl);
      const len = d.length();
      if (len < HAND_R * 2) {
        if (len < 1e-4) d.set(1, 0, 0);
        else d.divideScalar(len);
        const half = (HAND_R * 2 - Math.max(len, 0)) / 2;
        hl.addScaledVector(d, -half);
        hr.addScaledVector(d, half);
      }
      outOfBody(hl, HAND_R, push);
      outOfBody(hr, HAND_R, push);
    }
  }

  // the corners of an open glove, in its own space (scaled by the glove's size)
  const GLOVE_PTS = [
    new Vector3(0, -0.15, 0),
    new Vector3(0, 0.55, 0),
    new Vector3(0, 0.72, 0),
    new Vector3(-0.38, 0.1, 0),
    new Vector3(0.38, 0.1, 0),
    new Vector3(-0.5, 0.4, 0.1),
  ].map((v3) => v3.multiplyScalar(1.1));
  const gp = new Vector3();

  function planArm(side: Side, a: ArmPose, hand: Vector3): Plan {
    const s = shoulder[side];
    const q = new Quaternion();
    const axis = new Vector3();
    const elbow = new Vector3();
    const frameGlove = () => {
      const dist = hand.distanceTo(s);
      elbow
        .addVectors(s, hand)
        .multiplyScalar(0.5)
        .add(new Vector3(a.bend.x, a.bend.y, a.bend.z).multiplyScalar(Math.min(0.75, 0.34 * dist)));
      outOfBody(elbow, ARM_R + 0.04, push);
      forward.subVectors(hand, elbow).normalize();
      qa.setFromUnitVectors(yAxis, forward);
      eul.set(
        clamp(a.wrist.x + wristX[side].x, -1.0, 1.1),
        clamp(a.wrist.y, -1.65, 1.65),
        clamp(a.wrist.z + a.wave * Math.sin(clock * 7) * 0.35 + wristZ[side].x, -0.75, 0.75),
      );
      qb.setFromEuler(eul);
      q.copy(qa).multiply(qb);
      axis.copy(yAxis).applyQuaternion(q);
    };
    // keep the whole glove, fingers and thumb included, out of the paper
    for (let it = 0; it < 3; it++) {
      frameGlove();
      let moved = false;
      const base = hand.clone().addScaledVector(axis, 0.2);
      for (const pt of GLOVE_PTS) {
        gp.copy(pt).applyQuaternion(q).add(base);
        if (outOfBody(gp, 0.12, push)) {
          hand.add(push);
          base.add(push);
          moved = true;
        }
      }
      if (!moved) break;
    }
    frameGlove();
    // the arm continues past the hand along the glove's axis (never drawn), so it arrives pointing the
    // way the glove does; sample it, and keep every sample out of the paper
    const ext = hand.clone().addScaledVector(axis, 0.45);
    const curve = new CatmullRomCurve3(
      [s.clone(), elbow.clone(), hand.clone(), ext],
      false,
      "centripetal",
    );
    const pts: Vector3[] = [];
    for (let k = 0; k <= 8; k++) pts.push(curve.getPoint((k / 8) * (2 / 3)));
    const weight = [0, 0, 0.5, 1, 1, 1, 1, 1];
    for (let k = 2; k <= 7; k++) {
      const p = pts[k]!;
      const tmp = p.clone();
      if (outOfBody(tmp, ARM_R, push)) p.addScaledVector(push, weight[k]!);
    }
    pts[8]!.copy(hand);
    return { hand, elbow: elbow.clone(), q, axis, pts, ext };
  }

  /** Two arms cannot occupy the same space: where they would cross, they are pushed apart. */
  function separateArms(l: Plan, r: Plan) {
    const d = new Vector3();
    const min = ARM_R * 2;
    for (let it = 0; it < 3; it++) {
      for (let k = 3; k <= 7; k++)
        for (let m = 3; m <= 7; m++) {
          const pl = l.pts[k]!;
          const pr = r.pts[m]!;
          d.subVectors(pr, pl);
          const len = d.length();
          if (len >= min) continue;
          if (len < 1e-4) d.set(0, 0, 1);
          else d.divideScalar(len);
          const half = (min - len) / 2;
          pl.addScaledVector(d, -half);
          pr.addScaledVector(d, half);
        }
      for (const pl of [l, r]) for (let k = 2; k <= 7; k++) outOfBody(pl.pts[k]!, ARM_R, push);
    }
  }

  function placeArm(side: Side, a: ArmPose, plan: Plan, t: number) {
    const hand = plan.hand;
    const wave = a.wave * Math.sin(t * 7);
    // the wrist trails the hand's own movement: it flops back as the hand speeds up, then settles
    const ph = prevHand[side];
    if (handsReady && !opts.still) {
      const k = 1 / Math.max(stepDt, 0.001);
      wristX[side].step(clamp((hand.y - ph.y) * k * 0.09, -0.7, 0.7), 110, 7.5, stepDt);
      wristZ[side].step(clamp(-(hand.x - ph.x) * k * 0.09, -0.7, 0.7), 110, 7.5, stepDt);
    }
    ph.copy(hand);
    const curve = new CatmullRomCurve3(
      [...plan.pts.map((p) => p.clone()), plan.ext.clone()],
      false,
      "centripetal",
    );
    const tEnd = 8 / 9;
    fillArm(armMeshes[side].geometry, curve, tEnd);
    // the glove grows out of the arm's real end: same axis, only its twist is the wrist's own
    curve.getTangent(tEnd, tEndV);
    qa.setFromUnitVectors(yAxis, tEndV);
    eul.set(0, clamp(a.wrist.y + wave * 0.1, -1.65, 1.65), 0);
    qb.setFromEuler(eul);
    const g = gloves[side];
    g.root.quaternion.copy(qa).multiply(qb);
    g.root.position.copy(hand).addScaledVector(tEndV, 0.2);
    const c = a.curl;
    const amounts = [c.index, c.middle, c.ring];
    // Each finger has three joints that only bend one way, toward the palm, within the limits of a real
    // hand: it can straighten (a hair past straight at the knuckle) but never bend backward, the middle and
    // end joints are tied together the way tendons tie them, and the fingers fan out only when open.
    const fs = fingerS[side];
    g.fingers.forEach((f, i) => {
      const k = fs[i]!;
      if (opts.still) k.x = amounts[i] ?? 0;
      else k.step(amounts[i] ?? 0, 150 - i * 11, 10.5, stepDt);
      const kk = clamp(k.x, 0, 1);
      const mcp = clamp(0.07 + kk * 1.4, -0.12, 1.5);
      const pip = clamp(0.1 + kk * 1.55, 0, 1.75);
      const dip = clamp(0.05 + kk * 0.95, 0, 0.75 * pip + 0.1);
      f.rotation.x = mcp;
      // spread: the outer fingers lean away from the middle when the hand is open, and close up in a fist
      f.rotation.z = (i - 1) * -0.1 * (1 - kk);
      const mid = g.mids[i];
      if (mid) mid.rotation.x = pip;
      const tip = g.tips[i];
      if (tip) tip.rotation.x = dip;
    });
    // The thumb sits on the side of the palm and swings across it (opposition): as it curls it also turns
    // inward, so its pad meets the fingers instead of poking out sideways.
    const th = fs[3]!;
    if (opts.still) th.x = c.thumb;
    else th.step(c.thumb, 130, 9.5, stepDt);
    const tk = clamp(th.x, 0, 1);
    g.thumb.rotation.z = clamp(0.05 + a.thumbOut * 0.5 - tk * 0.55, -0.6, 0.7);
    g.thumb.rotation.x = clamp(tk * 0.8, 0, 1.0);
    g.thumb.rotation.y = tk * 0.35;
    g.thumbTip.rotation.x = clamp(0.08 + tk * 0.95, 0, 1.25);
  }

  /** Where a hand wants to be this frame, before it has been checked against anything solid. */
  function rawHand(side: Side, a: ArmPose, t: number) {
    const move = armMotion(side, t);
    const wave = a.wave * Math.sin(t * 7);
    return new Vector3(
      a.hand.x + move.x + wave * 0.16 * (side === "R" ? 1 : -1),
      a.hand.y + move.y + Math.abs(wave) * 0.04,
      a.hand.z + move.z,
    );
  }

  function frame(dt: number) {
    clock += dt;
    // after the wind-up, go for the real pose
    if (windT > 0) {
      windT -= dt;
      if (windT <= 0 && pendingTgt) {
        tgt = pendingTgt;
        pendingTgt = null;
      }
    }
    // spring the pose: arms and body lag and overshoot a little, the face settles a bit calmer
    {
      const n = Math.max(1, Math.ceil(dt / 0.008));
      const h = dt / n;
      const c = cur as unknown as Tree;
      const t = tgt as unknown as Tree;
      const w = vel as unknown as Tree;
      for (let i = 0; i < n; i++) {
        for (const key of Object.keys(c)) {
          const isFace = key === "face";
          const k = isFace ? 260 : 170;
          const d = isFace ? 29 : 15;
          const x = c[key];
          const tt = t[key];
          const vv = w[key];
          if (typeof x === "number" && typeof tt === "number" && typeof vv === "number") {
            const v1 = vv + (k * (tt - x) - d * vv) * h;
            w[key] = v1;
            c[key] = x + v1 * h;
          } else if (x && tt && vv && typeof x === "object") {
            follow(x as Tree, tt as Tree, vv as Tree, k, d, h);
          }
        }
      }
    }
    // blinking
    // a blink closes fast and opens a little slower, both eased; now and then it comes twice
    const smooth = (p: number) => p * p * (3 - 2 * p);
    nextBlink -= dt;
    if (nextBlink <= 0 && blinkT < 0 && !opts.still) blinkT = 0;
    let blink = 1;
    if (blinkT >= 0) {
      blinkT += dt;
      if (blinkT < 0.07) blink = 1 - smooth(blinkT / 0.07);
      else if (blinkT < 0.2) blink = smooth((blinkT - 0.07) / 0.13);
      else {
        blinkT = -1;
        if (!blinkDouble && Math.random() < 0.18) {
          blinkDouble = true;
          nextBlink = 0.1;
        } else {
          blinkDouble = false;
          nextBlink = 2.4 + Math.random() * 3.8;
        }
      }
    }
    // when the pointer has been still for a while he glances about on his own; the eyes lead the head
    const idleLook = !opts.still && clock - lastLookAt > 4;
    const gazeX = idleLook ? Math.sin(clock * 0.5) * 0.6 : lookX;
    const gazeY = idleLook ? Math.sin(clock * 0.37) * 0.18 : lookY;
    sacT -= dt;
    if (sacT <= 0) {
      sacT = 1.1 + Math.random() * 2.8;
      sacX = (Math.random() - 0.5) * 0.5;
      sacY = (Math.random() - 0.5) * 0.3;
    }
    const sacK = idleLook ? 0.6 : 0.3;
    if (opts.still) {
      eyeX.x = gazeX;
      eyeY.x = gazeY;
    } else {
      eyeX.step(gazeX + sacX * sacK, 340, 27, dt);
      eyeY.step(gazeY + sacY * sacK, 340, 27, dt);
    }
    const smileLift = clamp(cur.face.mouthSmile, 0, 1.1);
    const f: Face = {
      ...cur.face,
      lookX: cur.face.lookX + eyeX.x * 0.8,
      lookY: cur.face.lookY + eyeY.x * 0.6,
      // small unrelated drifts in the brows and mouth so that he is never frozen
      browLiftL: cur.face.browLiftL + 0.07 * Math.sin(clock * 0.8),
      browLiftR: cur.face.browLiftR + 0.07 * Math.sin(clock * 0.8 + 1.3),
      mouthOpen: cur.face.mouthOpen + 0.015 * Math.sin(clock * 1.9),
    };
    // a broad smile pushes the cheeks up into the eyes
    f.eyeL = cur.face.eyeL * blink * (1 - 0.12 * smileLift * (1 - cur.face.happyL));
    f.eyeR = cur.face.eyeR * blink * (1 - 0.12 * smileLift * (1 - cur.face.happyR));
    drawIfChanged(f);

    // turning toward the pointer, and the little breaths
    const wantYaw = yawOverride ?? gazeX * 0.85;
    const wantPitch = yawOverride === null ? -gazeY * 0.28 : 0;
    // a still picture goes straight to where he is turned; a live one eases there
    // the turn is a spring too: it leads with a little overshoot, then settles
    if (opts.still) {
      yaw = wantYaw;
      pitch = wantPitch;
      yawS.x = wantYaw;
      pitchS.x = wantPitch;
    } else {
      yawS.step(wantYaw, 62, 9.5, dt);
      pitchS.step(wantPitch, 62, 9.5, dt);
      yaw = yawS.x;
      pitch = pitchS.x;
    }
    // a spin on the spot: wind up the wrong way, whip round, overshoot, settle
    let spinAngle = 0;
    if (spinT >= 0) {
      spinT += dt;
      const p = Math.min(1, spinT / 1.15);
      const c1 = 1.9;
      const c3 = c1 + 1;
      const e = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); // ease-out-back
      spinAngle = e * Math.PI * 2;
      if (p >= 1) spinT = -1;
    }
    // hop: crouch (anticipation), launch stretched, hang, land squashed, rebound
    nextHop -= dt;
    if (nextHop <= 0 && hopT < 0 && !opts.still) {
      hopT = 0;
      nextHop = 14 + Math.random() * 8;
    }
    if (mood === "cheer" && hopT < 0 && !opts.still && clock - lastCheerHop > 1.7) {
      hopT = 0;
      lastCheerHop = clock;
    }
    let lift = 0;
    let squash = 1;
    if (hopT >= 0) {
      const before = hopT;
      hopT += dt;
      const p = hopT / 0.95;
      if (before === 0) puff.v -= 1.6;
      if (p >= 1) {
        hopT = -1;
        puff.v += 3.4;
        headY.v -= 1.1;
        capeY.v += 2.2;
      } else if (p < 0.2) {
        squash = 1 - 0.14 * Math.sin((p / 0.2) * Math.PI * 0.5);
      } else {
        const q = (p - 0.2) / 0.8;
        lift = 4 * 0.62 * q * (1 - q);
        // stretched on the way up, rounder at the top, squashed as he lands
        squash =
          1 +
          0.09 * Math.sin(Math.min(1, q * 1.6) * Math.PI) -
          (q > 0.86 ? 0.13 * ((q - 0.86) / 0.14) : 0);
      }
    }
    const breathe = 1 + 0.012 * Math.sin(clock * 1.9);
    const dts = Math.max(dt, 0.001);
    const yawVel = (yaw + spinAngle - prevYaw) / dts;
    prevYaw = yaw + spinAngle;
    if (!opts.still && Math.abs(yawVel) > 2.4 && blinkT < 0 && nextBlink > 0.5) nextBlink = 0;
    vy += ((lift - prevLift) / dts - vy) * 0.55;
    prevLift = lift;
    if (!opts.still) {
      lean.step(clamp(-yawVel * 0.2, -0.55, 0.55), 85, 7, dt);
      stretch.step(clamp(-vy * 0.1, -0.4, 0.4), 95, 8, dt);
      puff.step(0, 120, 5.5, dt);
      headY.step(clamp(-vy * 0.045, -0.22, 0.22), 75, 7.5, dt);
      capeX.step(clamp(-yawVel * 0.5, -1.4, 1.4), 30, 3.4, dt);
      capeY.step(clamp(-vy * 0.4, -1.2, 1.2), 32, 3.6, dt);
      capeZ.step(clamp(Math.abs(yawVel) * 0.12 + Math.abs(vy) * 0.1, 0, 1), 30, 3.6, dt);
    }
    capeDrive.sx = capeX.x;
    capeDrive.sy = capeY.x;
    capeDrive.sz = capeZ.x;
    jelly.uJ.value.set(lean.x, 0, puff.x * 0.16, stretch.x * 0.7);
    // toes point down while he is going up and flex up as he comes down
    if (!opts.still) bootS.step(clamp(vy * 0.2, -0.5, 0.6), 120, 11, dt);
    for (const b of boots) b.rotation.x = bootS.x;
    root.rotation.y = yaw + spinAngle;
    root.position.y = lift + 0.035 * Math.sin(clock * 2.1);
    root.position.x = opts.still ? 0 : 0.05 * Math.sin(clock * 0.55);
    shadow.position.x = root.position.x;
    body.position.y = BODY_Y + headY.x;
    body.rotation.z =
      cur.roll + 0.03 * Math.sin(clock * 0.9) + 0.012 * Math.sin(clock * 2.3) - eyeX.x * 0.03;
    body.rotation.x = cur.pitch + pitch;
    body.scale.set(1 / Math.sqrt(squash * breathe), squash * breathe, 1);
    const shadowS = 1 - lift * 0.35;
    shadow.scale.set(4.4 * shadowS, 2.3 * shadowS, 1);
    (shadow.material as MeshBasicMaterial).opacity = 1 - lift * 0.5;
    cape.group.rotation.y = -(yaw - wantYaw) * 0.2 + 0.015 * Math.sin(clock * 0.9);
    cape.update(clock);
    stepDt = dt > 0 ? dt : 0.016;
    const hl = rawHand("L", cur.L, clock);
    const hr = rawHand("R", cur.R, clock);
    resolveHands(hl, hr);
    const planL = planArm("L", cur.L, hl);
    const planR = planArm("R", cur.R, hr);
    separateArms(planL, planR);
    placeArm("L", cur.L, planL, clock);
    placeArm("R", cur.R, planR, clock);
    handsReady = true;
  }

  function renderNow() {
    renderer.render(scene, camera);
  }

  // Keep it smooth on weak devices: lower the resolution once, then give up and let the picture take over.
  let slowFrames = 0;
  let slowSamples = 0;
  let slowSteps = 0;
  function loop(ts: number) {
    if (!running) return;
    const raw = last ? (ts - last) / 1000 : 0.016;
    const dt = Math.min(0.1, raw);
    if (opts.onSlow && last && !document.hidden) {
      slowSamples++;
      if (raw > 0.045) slowFrames++;
      if (slowSamples >= 60) {
        if (slowFrames > 36) {
          slowSteps++;
          if (slowSteps === 1) {
            renderer.setPixelRatio(1);
            renderer.setSize(width, height, false);
          } else {
            running = false;
            opts.onSlow();
            return;
          }
        }
        slowSamples = 0;
        slowFrames = 0;
      }
    }
    last = ts;
    frame(dt);
    renderNow();
    raf = requestAnimationFrame(loop);
  }

  const api: DexController = {
    setMood(m) {
      const changed = m !== mood;
      mood = m;
      const next = clone(POSES[m]);
      tgt = next;
      if (opts.still) {
        cur.L = clone(tgt.L);
        cur.R = clone(tgt.R);
        cur.face = clone(tgt.face);
        cur.roll = tgt.roll;
        cur.pitch = tgt.pitch;
        frame(0.016);
        renderNow();
      } else if (changed) {
        // wind up first, then go: the arms swing back a touch before the new gesture
        tgt = windUp(cur, next);
        pendingTgt = next;
        windT = 0.13;
        // a change of mood is felt in the body first: a small pop, the head dips, the cape flicks
        puff.v += 2.4;
        headY.v -= 0.9;
        capeY.v += 1.4;
      }
      if (m === "cheer") hopT = hopT < 0 ? 0 : hopT;
    },
    boing() {
      puff.v += 5.5;
      stretch.v -= 3;
      lean.v += 1.6;
      headY.v -= 1.4;
      capeY.v += 2.6;
      capeX.v += 1.2;
    },
    spin() {
      if (spinT < 0) spinT = 0;
    },
    setLook(x, y) {
      lookX = Math.max(-1, Math.min(1, x));
      lookY = Math.max(-1, Math.min(1, y));
      lastLookAt = clock;
    },
    setYaw(a) {
      yawOverride = a;
      if (opts.still) api.renderOnce();
    },
    hop() {
      if (hopT < 0) hopT = 0;
    },
    resize(w, h) {
      width = Math.max(1, Math.floor(w));
      height = Math.max(1, Math.floor(h));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // keep the whole character in view on a tall or a wide box
      if (viewOverride) camera.fov = viewOverride.fov;
      else camera.fov = camera.aspect < 0.8 ? 27 / Math.max(0.62, camera.aspect / 0.8) : 27;
      camera.updateProjectionMatrix();
      if (!running) {
        frame(0.016);
        renderNow();
      }
    },
    start() {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    setView(v) {
      viewOverride = v;
      if (v) {
        camera.position.set(v.x, v.y, 12.8);
        camera.lookAt(v.x, v.y, 0);
        camera.fov = v.fov;
      } else {
        camera.position.set(0, 2.85, 12.8);
        camera.lookAt(0, 2.65, 0);
        camera.fov = 27;
      }
      camera.updateProjectionMatrix();
      if (!running) {
        frame(0.016);
        renderNow();
      }
    },
    faceImage() {
      drawIfChanged(cur.face, true);
      return faceCanvas.toDataURL("image/png");
    },
    debug() {
      return { ...cur.face };
    },
    renderOnce() {
      frame(0.016);
      renderNow();
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      scene.traverse((o) => {
        const m = o as Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      Object.values(mats).forEach((m) => m.dispose());
      mats.paper.map?.dispose();
      extras.forEach((m) => m.dispose());
      shadowTex.dispose();
      faceTex.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
  drawIfChanged(cur.face, true);
  api.resize(canvas.clientWidth || 300, canvas.clientHeight || 360);
  api.setMood(mood);
  return api;
}
