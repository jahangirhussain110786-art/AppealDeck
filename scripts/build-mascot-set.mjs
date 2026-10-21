// Builds the whole mascot set from the approved pictures: transparent, cleaned, and cropped to ONE shared
// box so Dex keeps the same size and the same footing in every mood.
//
// The pictures themselves are never redrawn. The first one (hello) was made on a white studio background, so
// its background is removed (the floor shadow stays as a soft navy). The others arrive with their own
// transparency; their near-invisible specks are cleared and their edges snapped.
//
//   node scripts/build-mascot-set.mjs
import fs from "node:fs";
import sharp from "sharp";

const OUT = "public/mascot";
const POSES = [
  { name: "hello", src: "docs/handoffs/assets/dex-source.webp", studio: true },
  { name: "happy", src: "docs/handoffs/assets/poses/dex-happy.png" },
  { name: "cheering", src: "docs/handoffs/assets/poses/dex-cheering.png" },
  { name: "explaining", src: "docs/handoffs/assets/poses/dex-explaining.png" },
  // Drawn about 10% larger than the others, so it is scaled down to match their size and footing.
  { name: "thinking", src: "docs/handoffs/assets/poses/dex-thinking.png", scale: 0.9 },
  { name: "calm", src: "docs/handoffs/assets/poses/dex-calm.png" },
];
const WIDTHS = [960, 640, 320, 160];
const PAD = 16;

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** A picture on a white studio background -> RGBA, with the floor shadow kept as soft navy. */
async function cutStudio(file) {
  const { data, info } = await sharp(file)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width,
    H = info.height;
  const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
  const kind = new Uint8Array(W * H); // 0 foreground, 1 background, 2 floor shadow
  const stack = new Int32Array(W * H);
  const flood = (seeds, accept, mark) => {
    let top = 0;
    for (const s of seeds)
      if (kind[s] === 0 && accept(s)) {
        kind[s] = mark;
        stack[top++] = s;
      }
    while (top) {
      const i = stack[--top],
        x = i % W,
        y = (i - x) / W;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (kind[j] === 0 && accept(j)) {
          kind[j] = mark;
          stack[top++] = j;
        }
      }
    }
  };
  const isWhite = (i) => {
    const [r, g, b] = px(i);
    return Math.min(r, g, b) >= 238 && Math.max(r, g, b) - Math.min(r, g, b) <= 18;
  };
  const edge = [];
  for (let x = 0; x < W; x++) edge.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) edge.push(y * W, y * W + W - 1);
  flood(edge, isWhite, 1);
  const SHADOW_FROM = Math.round(H * 0.75);
  const isShadow = (i) => {
    if (Math.floor(i / W) < SHADOW_FROM) return false;
    const [r, g, b] = px(i),
      l = lum(r, g, b),
      sat = Math.max(r, g, b) - Math.min(r, g, b);
    return l >= 135 && l <= 248 && sat <= 45 && b >= r - 3;
  };
  const seeds = [];
  for (let i = 0; i < W * H; i++) {
    if (kind[i] !== 0 || !isShadow(i)) continue;
    const x = i % W;
    if (
      (x > 0 && kind[i - 1] === 1) ||
      (x < W - 1 && kind[i + 1] === 1) ||
      (i >= W && kind[i - W] === 1) ||
      (i < W * (H - 1) && kind[i + W] === 1)
    )
      seeds.push(i);
  }
  flood(seeds, isShadow, 2);
  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const [r, g, b] = px(i),
      x = i % W,
      y = (i - x) / W;
    let R = r,
      G = g,
      B = b,
      A = 255;
    if (kind[i] === 1) A = 0;
    else if (kind[i] === 2)
      A = 0; // the floor shadow: the site draws one, so every mood has the same
    else {
      const touches =
        (x > 0 && kind[i - 1] !== 0) ||
        (x < W - 1 && kind[i + 1] !== 0) ||
        (y > 0 && kind[i - W] !== 0) ||
        (y < H - 1 && kind[i + W] !== 0);
      const mn = Math.min(r, g, b);
      if (touches && mn > 222) A = Math.round(Math.max(0, Math.min(1, (255 - mn) / 33)) * 255);
    }
    rgba[i * 4] = R;
    rgba[i * 4 + 1] = G;
    rgba[i * 4 + 2] = B;
    rgba[i * 4 + 3] = A;
  }
  return { rgba, W, H };
}

/** A picture that already has transparency: clear the near-invisible specks and snap the edges. */
async function cleanAlpha(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width,
    H = info.height,
    rgba = Buffer.from(data);
  for (let i = 0; i < W * H; i++) {
    const a = rgba[i * 4 + 3];
    rgba[i * 4 + 3] = a < 24 ? 0 : a >= 236 ? 255 : a;
  }
  // Drop any island of pixels that is both tiny and faint (specks), keeping real small props such as sparkles.
  const label = new Int32Array(W * H),
    st = [];
  for (let s = 0; s < W * H; s++) {
    if (label[s] || rgba[s * 4 + 3] === 0) continue;
    const comp = [];
    let mx = 0;
    st.push(s);
    label[s] = 1;
    while (st.length) {
      const i = st.pop();
      comp.push(i);
      if (rgba[i * 4 + 3] > mx) mx = rgba[i * 4 + 3];
      const x = i % W,
        y = (i - x) / W;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, -1],
        [1, -1],
        [-1, 1],
      ]) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (!label[j] && rgba[j * 4 + 3] > 0) {
          label[j] = 1;
          st.push(j);
        }
      }
    }
    if (comp.length < 400 && mx < 120) for (const i of comp) rgba[i * 4 + 3] = 0;
  }
  return { rgba, W, H };
}

const cut = [];
for (const p of POSES)
  cut.push({ ...p, ...(p.studio ? await cutStudio(p.src) : await cleanAlpha(p.src)) });
const { W, H } = cut[0];
if (cut.some((c) => c.W !== W || c.H !== H))
  throw new Error("All poses must share one canvas size.");

const boxOf = (rgba) => {
  let x0 = W,
    y0 = H,
    x1 = 0,
    y1 = 0;
  for (let i = 0; i < W * H; i++)
    if (rgba[i * 4 + 3] > 40) {
      const x = i % W,
        y = (i - x) / W;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  return { x0, y0, x1, y1 };
};
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const plain = cut.filter((c) => !c.scale).map((c) => boxOf(c.rgba));
const targetBottom = median(plain.map((b) => b.y1));
const targetCentre = median(plain.map((b) => (b.x0 + b.x1) / 2));
for (const c of cut) {
  if (!c.scale) continue;
  const b = boxOf(c.rgba);
  const w = Math.round(W * c.scale),
    h = Math.round(H * c.scale);
  const small = await sharp(c.rgba, { raw: { width: W, height: H, channels: 4 } })
    .resize(w, h)
    .png()
    .toBuffer();
  const left = Math.round(targetCentre - ((b.x0 + b.x1) / 2) * c.scale);
  const top = Math.round(targetBottom - b.y1 * c.scale);
  c.rgba = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: small, left, top }])
    .raw()
    .toBuffer();
}

// One crop for the whole set.
let minX = W,
  minY = H,
  maxX = 0,
  maxY = 0;
for (const c of cut)
  for (let i = 0; i < W * H; i++) {
    if (c.rgba[i * 4 + 3] > 40) {
      const x = i % W,
        y = (i - x) / W;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
const left = Math.max(0, minX - PAD),
  top = Math.max(0, minY - PAD);
const width = Math.min(W - left, maxX - minX + 1 + 2 * PAD),
  height = Math.min(H - top, maxY - minY + 1 + 2 * PAD);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const c of cut) {
  const base = await sharp(c.rgba, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left, top, width, height })
    .png()
    .toBuffer();
  // WebP carries the transparency, so there is no PNG in the site's files.
  for (const w of WIDTHS)
    fs.writeFileSync(
      `${OUT}/dex-${c.name}-${w}.webp`,
      await sharp(base).resize({ width: w }).webp({ quality: 92, alphaQuality: 100 }).toBuffer(),
    );
}
console.log(
  JSON.stringify({
    canvas: [W, H],
    sharedCrop: { left, top, width, height },
    poses: cut.map((c) => c.name),
    files: fs.readdirSync(OUT).length,
  }),
);
