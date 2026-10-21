import type { BufferGeometry } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * The parts of Dex that were modelled and baked in Blender (tools/blender/build_dex.py): the paper and the
 * pages behind it, the orange fold, the clip, the face plate, one glove and one boot. Each is in the same
 * local space the procedural parts use, so it drops straight in. Vertex colours hold baked soft shadows.
 */
export type DexParts = {
  paper: BufferGeometry;
  page1: BufferGeometry;
  page2: BufferGeometry;
  fold: BufferGeometry;
  clip: BufferGeometry;
  hinge: BufferGeometry;
  face: BufferGeometry;
  glove: BufferGeometry;
  bootUpper: BufferGeometry;
  bootSole: BufferGeometry;
};

const NAMES: Array<keyof DexParts> = [
  "paper",
  "page1",
  "page2",
  "fold",
  "clip",
  "hinge",
  "face",
  "glove",
  "bootUpper",
  "bootSole",
];

let pending: Promise<DexParts> | null = null;

export function loadDexParts(url = "/dex/dex_parts.glb"): Promise<DexParts> {
  if (!pending) {
    pending = new GLTFLoader().loadAsync(url).then((gltf) => {
      const found: Partial<Record<keyof DexParts, BufferGeometry>> = {};
      gltf.scene.traverse((o) => {
        const m = o as { isMesh?: boolean; geometry?: BufferGeometry; name: string };
        if (m.isMesh && m.geometry && (NAMES as string[]).includes(m.name)) {
          found[m.name as keyof DexParts] = m.geometry;
        }
      });
      for (const n of NAMES) if (!found[n]) throw new Error(`dex_parts.glb is missing "${n}"`);
      return found as DexParts;
    });
    pending.catch(() => {
      pending = null;
    });
  }
  return pending;
}
