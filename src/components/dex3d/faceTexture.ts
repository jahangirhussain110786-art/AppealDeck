/**
 * The front of Dex's paper: the title bars, the face, the text lines, the dot and the tick, drawn on a
 * canvas that becomes a texture. Only the face changes; it is redrawn when an expression value moves.
 *
 * Every part of the face is continuous: the eye is an iris sitting behind two eyelid curves, so a blink,
 * a squint and a smiling arc are all the same shape at different numbers, and the mouth is one shape
 * that goes from a line to a wide-open laugh. Nothing switches between two drawings, which is what
 * makes expressions glide instead of pop.
 */

export type Face = {
  /** 0 closed, 1 wide open. */
  eyeL: number;
  eyeR: number;
  /** 0 round eye, 1 a happy arc (a smiling closed eye). */
  happyL: number;
  happyR: number;
  /** Eyebrow tilt (-1 worried to 1 cheerful) and lift (-1 low to 1 high). */
  browTiltL: number;
  browTiltR: number;
  browLiftL: number;
  browLiftR: number;
  /** Where the eyes look, -1 to 1. */
  lookX: number;
  lookY: number;
  /** 0 closed, 1 wide open. */
  mouthOpen: number;
  /** -1 a frown, 0 flat, 1 a broad smile. */
  mouthSmile: number;
  /** 0.4 small, 1 normal, 1.4 wide. */
  mouthWidth: number;
  /** 0 none, 1 full. */
  cheeks: number;
};

export const FACE_SIZE = { width: 768, height: 908 } as const;

const NAVY = "#0b1429";
const STORY_INK = "#3a2a26";
const K = 0.5523;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function roundRect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/** The upper lid curve, left corner to right corner. A negative `top` bows it downward. */
function upperLid(c: CanvasRenderingContext2D, cx: number, cy: number, rx: number, top: number) {
  c.moveTo(cx - rx, cy);
  c.bezierCurveTo(cx - rx, cy - K * top, cx - K * rx, cy - top, cx, cy - top);
  c.bezierCurveTo(cx + K * rx, cy - top, cx + rx, cy - K * top, cx + rx, cy);
}

/** The lower lid curve, right corner to left corner. A negative `bot` arches it upward (a smile). */
function lowerLid(c: CanvasRenderingContext2D, cx: number, cy: number, rx: number, bot: number) {
  c.moveTo(cx + rx, cy);
  c.bezierCurveTo(cx + rx, cy + K * bot, cx + K * rx, cy + bot, cx, cy + bot);
  c.bezierCurveTo(cx - K * rx, cy + bot, cx - rx, cy + K * bot, cx - rx, cy);
}

function star(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.beginPath();
  c.moveTo(x, y - r);
  c.quadraticCurveTo(x + r * 0.12, y - r * 0.12, x + r, y);
  c.quadraticCurveTo(x + r * 0.12, y + r * 0.12, x, y + r);
  c.quadraticCurveTo(x - r * 0.12, y + r * 0.12, x - r, y);
  c.quadraticCurveTo(x - r * 0.12, y - r * 0.12, x, y - r);
  c.closePath();
}

/**
 * One eye. `open` is how far the lids are apart, `happy` raises the lower lid into a smiling arc. The
 * iris stays the same size and is cut by the lids, which is how a drawn eye blinks.
 */
function eye(
  c: CanvasRenderingContext2D,
  W: number,
  H: number,
  cx: number,
  cy0: number,
  open: number,
  happy: number,
  lookX: number,
  lookY: number,
  story: boolean,
) {
  const rx = W * (story ? 0.104 : 0.088);
  const ry = H * (story ? 0.128 : 0.116);
  const o = clamp(open, 0, 1.12);
  const h = clamp(happy, 0, 1);
  const cy = cy0 + ry * 0.18 * h;
  const ink = story ? STORY_INK : NAVY;
  // a closed lid sags into a gentle bowl; a happy one arches up
  const sag = ry * 0.26 * Math.pow(1 - Math.min(1, o), 2) * (1 - h);
  const top = ry * o * (1 - 0.45 * h) - sag;
  const bot = ry * o * (1 - 1.3 * h) + sag;
  const thickness = top + bot;

  if (thickness > ry * 0.04) {
    c.save();
    c.beginPath();
    upperLid(c, cx, cy, rx, top);
    lowerLid(c, cx, cy, rx, bot);
    c.closePath();
    c.clip();
    const ix = cx + lookX * rx * 0.3;
    const iy = cy + lookY * ry * 0.22;
    const irx = rx * 1.02;
    const iry = ry * 1.04;
    const g = c.createRadialGradient(
      ix - irx * 0.25,
      iy - iry * 0.4,
      irx * 0.1,
      ix,
      iy,
      iry * 1.15,
    );
    g.addColorStop(0, story ? "#3a56a8" : "#34497f");
    g.addColorStop(0.6, story ? "#16275e" : "#0f1b38");
    g.addColorStop(1, story ? "#070d26" : "#060c1c");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(ix, iy, irx, iry, 0, 0, Math.PI * 2);
    c.fill();
    // light coming up from below
    const glow = c.createRadialGradient(ix, iy + iry * 0.95, 0, ix, iy + iry * 0.95, irx * 1.1);
    glow.addColorStop(0, story ? "rgba(120,170,255,0.75)" : "rgba(74,114,208,0.6)");
    glow.addColorStop(1, "rgba(74,114,208,0)");
    c.fillStyle = glow;
    c.fillRect(ix - irx * 1.2, iy - iry * 1.2, irx * 2.4, iry * 2.4);
    if (story) {
      c.fillStyle = "rgba(255,255,255,0.9)";
      const dots: Array<[number, number, number]> = [
        [-0.45, 0.25, 0.05],
        [0.5, -0.1, 0.06],
        [0.15, 0.55, 0.045],
        [-0.15, -0.6, 0.04],
        [0.62, 0.48, 0.04],
      ];
      for (const [dx, dy, r] of dots) {
        c.beginPath();
        c.arc(ix + dx * rx, iy + dy * ry, r * rx, 0, Math.PI * 2);
        c.fill();
      }
    }
    // highlights drift with the gaze a little, which makes the eye look round and wet
    c.fillStyle = "#fff";
    if (story) {
      c.beginPath();
      c.ellipse(ix - rx * 0.34, iy - ry * 0.4, rx * 0.3, ry * 0.26, -0.3, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(ix + rx * 0.42, iy + ry * 0.42, rx * 0.12, 0, Math.PI * 2);
      c.fill();
      star(c, ix + rx * 0.12, iy - ry * 0.12, rx * 0.34);
      c.fill();
    } else {
      c.beginPath();
      c.ellipse(
        cx - rx * 0.36 + lookX * rx * 0.28,
        cy - ry * 0.42 + lookY * ry * 0.2,
        rx * 0.46,
        ry * 0.42,
        0,
        0,
        Math.PI * 2,
      );
      c.fill();
      c.globalAlpha = 0.9;
      c.beginPath();
      c.arc(cx + rx * 0.4 + lookX * rx * 0.2, cy + ry * 0.52, rx * 0.19, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
    }
    // the shadow the upper lid casts on the iris
    const sh = c.createLinearGradient(0, cy - top, 0, cy - top + ry * 0.75);
    sh.addColorStop(0, "rgba(6,12,28,0.42)");
    sh.addColorStop(1, "rgba(6,12,28,0)");
    c.fillStyle = sh;
    c.fillRect(cx - rx * 1.2, cy - top - 2, rx * 2.4, ry * 0.8 + 2);
    c.restore();
  }

  // the lid lines: they fade in as the eye closes or smiles
  const closed = clamp(1 - thickness / (ry * 0.9), 0, 1);
  const lidA = story ? Math.max(0.85, closed) : Math.max(closed, h);
  c.save();
  c.strokeStyle = ink;
  c.lineCap = "round";
  c.globalAlpha = lidA;
  c.lineWidth = W * (story ? 0.015 : 0.02) + W * 0.009 * Math.max(closed, h);
  c.beginPath();
  upperLid(c, cx, cy, rx, top);
  c.stroke();
  if (h > 0.05) {
    c.globalAlpha = h;
    c.lineWidth = W * 0.016 * h;
    c.beginPath();
    lowerLid(c, cx, cy, rx, bot);
    c.stroke();
  }
  c.restore();
}

function brow(
  c: CanvasRenderingContext2D,
  W: number,
  H: number,
  cx: number,
  cy: number,
  tilt: number,
  lift: number,
  side: -1 | 1,
  color: string,
  dip: number,
) {
  const y = cy - H * 0.125 - lift * H * 0.022 + dip * H * 0.016;
  const half = W * 0.075;
  // tilt raises the outer end for cheerful, the inner end for worried
  const outer = -tilt * H * 0.016;
  const inner = tilt * H * 0.016;
  c.strokeStyle = color;
  c.lineWidth = W * 0.027;
  c.lineCap = "round";
  c.beginPath();
  const xo = cx + side * half; // outer end
  const xi = cx - side * half; // inner end
  c.moveTo(xi, y + inner);
  c.quadraticCurveTo(cx, y - H * 0.02 + (inner + outer) / 2, xo, y + outer);
  c.stroke();
}

function mouth(c: CanvasRenderingContext2D, W: number, H: number, f: Face, story: boolean) {
  const mx = W * 0.5;
  const my = H * 0.615;
  const hw = W * 0.075 * clamp(f.mouthWidth, 0.3, 1.5);
  const smile = clamp(f.mouthSmile, -1, 1.1) * H * 0.034;
  const open = clamp(f.mouthOpen, 0, 1.15);
  const drop = H * 0.068 * open;
  const upperCtl = my + smile * 0.8;
  const upperMid = my + smile * 0.4;
  const lowerMid = upperMid + drop;
  const ink = story ? STORY_INK : NAVY;

  const outline = () => {
    c.beginPath();
    c.moveTo(mx - hw, my);
    c.quadraticCurveTo(mx, upperCtl, mx + hw, my);
    c.bezierCurveTo(mx + hw, my + (lowerMid - my) * 0.55, mx + hw * 0.55, lowerMid, mx, lowerMid);
    c.bezierCurveTo(mx - hw * 0.55, lowerMid, mx - hw, my + (lowerMid - my) * 0.55, mx - hw, my);
    c.closePath();
  };

  if (drop > H * 0.004) {
    outline();
    c.fillStyle = story ? "#7a1c1c" : "#6f1a10";
    c.fill();
    c.save();
    outline();
    c.clip();
    // the tongue
    c.fillStyle = "#ff8f8f";
    c.beginPath();
    c.ellipse(mx, lowerMid + drop * 0.05, hw * 0.62, drop * 0.5, 0, 0, Math.PI * 2);
    c.fill();
    // the top teeth, as the mouth opens
    const teeth = clamp((open - 0.3) * 2.2, 0, 1);
    if (teeth > 0.02) {
      const th = Math.min(drop * 0.34, H * 0.022);
      c.globalAlpha = teeth;
      c.fillStyle = "#fff";
      c.beginPath();
      c.moveTo(mx - hw, my);
      c.quadraticCurveTo(mx, upperCtl, mx + hw, my);
      c.lineTo(mx + hw, my + th);
      c.quadraticCurveTo(mx, upperCtl + th, mx - hw, my + th);
      c.closePath();
      c.fill();
    }
    c.restore();
  }
  // the lip line: a bold line when shut, finer when he is laughing
  c.strokeStyle = ink;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.lineWidth = W * (0.019 - 0.008 * Math.min(1, open));
  if (drop > H * 0.004) {
    outline();
  } else {
    c.beginPath();
    c.moveTo(mx - hw, my);
    c.quadraticCurveTo(mx, upperCtl + smile * 0.8, mx + hw, my);
  }
  c.stroke();
  // dimples at the corners of a broad smile
  const dim = clamp((f.mouthSmile - 0.55) / 0.45, 0, 1);
  if (dim > 0.02) {
    c.globalAlpha = 0.55 * dim;
    c.lineWidth = W * 0.01;
    for (const sx of [-1, 1]) {
      const x = mx + sx * (hw + W * 0.014);
      c.beginPath();
      c.moveTo(x - sx * W * 0.006, my - H * 0.012);
      c.quadraticCurveTo(x + sx * W * 0.008, my - H * 0.002, x - sx * W * 0.002, my + H * 0.012);
      c.stroke();
    }
    c.globalAlpha = 1;
  }
}

export function drawFace(c: CanvasRenderingContext2D, f: Face, story = false) {
  const W = c.canvas.width;
  const H = c.canvas.height;
  c.clearRect(0, 0, W, H);

  // title bars, top left
  if (!story) {
    c.fillStyle = "#c6d0e8";
    roundRect(c, W * 0.1, H * 0.085, W * 0.2, H * 0.034, H * 0.017);
    c.fill();
    c.fillStyle = "#dfe5f2";
    roundRect(c, W * 0.1, H * 0.135, W * 0.13, H * 0.028, H * 0.014);
    c.fill();
  }

  // cheeks, a little rosier when he smiles
  const cheek = clamp(f.cheeks + Math.max(0, f.mouthSmile - 0.8) * 0.2, 0, 1);
  if (cheek > 0.01) {
    for (const sx of [-1, 1]) {
      const cx = W * 0.5 + sx * W * 0.3;
      const cy = H * 0.575;
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, W * 0.125);
      g.addColorStop(0, `rgba(255,140,104,${0.8 * cheek})`);
      g.addColorStop(1, "rgba(255,140,104,0)");
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(cx, cy, W * 0.125, H * 0.065, 0, 0, Math.PI * 2);
      c.fill();
    }
  }

  const ex = W * 0.19;
  const ey = H * 0.455;
  eye(c, W, H, W * 0.5 - ex, ey, f.eyeL, f.happyL, f.lookX, f.lookY, story);
  eye(c, W, H, W * 0.5 + ex, ey, f.eyeR, f.happyR, f.lookX, f.lookY, story);
  const browColor = story ? "#5a3b30" : NAVY;
  // the brows follow the lids: they dip a little as an eye closes
  const dipL = clamp(1 - f.eyeL, 0, 1);
  const dipR = clamp(1 - f.eyeR, 0, 1);
  brow(c, W, H, W * 0.5 - ex, ey, f.browTiltL, f.browLiftL, -1, browColor, dipL);
  brow(c, W, H, W * 0.5 + ex, ey, f.browTiltR, f.browLiftR, 1, browColor, dipR);

  mouth(c, W, H, f, story);

  if (story) return;
  // text lines
  c.fillStyle = "#d7ddec";
  roundRect(c, W * 0.1, H * 0.745, W * 0.72, H * 0.034, H * 0.017);
  c.fill();
  roundRect(c, W * 0.1, H * 0.815, W * 0.52, H * 0.034, H * 0.017);
  c.fill();
  roundRect(c, W * 0.1, H * 0.885, W * 0.62, H * 0.034, H * 0.017);
  c.fill();
  // the orange dot
  c.fillStyle = "#ee6a1c";
  c.beginPath();
  c.arc(W * 0.9, H * 0.762, W * 0.019, 0, Math.PI * 2);
  c.fill();

  // the tick
  c.save();
  c.lineCap = "round";
  c.lineJoin = "round";
  const tg = c.createLinearGradient(W * 0.3, H * 0.8, W * 0.62, H * 0.9);
  tg.addColorStop(0, "#ff9b4d");
  tg.addColorStop(1, "#d9530d");
  c.strokeStyle = "rgba(11,20,41,0.16)";
  c.lineWidth = W * 0.055;
  c.beginPath();
  c.moveTo(W * 0.3 + 3, H * 0.835 + 5);
  c.lineTo(W * 0.38 + 3, H * 0.895 + 5);
  c.lineTo(W * 0.64 + 3, H * 0.77 + 5);
  c.stroke();
  c.strokeStyle = tg;
  c.lineWidth = W * 0.05;
  c.beginPath();
  c.moveTo(W * 0.3, H * 0.835);
  c.lineTo(W * 0.38, H * 0.895);
  c.lineTo(W * 0.64, H * 0.77);
  c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.45)";
  c.lineWidth = W * 0.012;
  c.beginPath();
  c.moveTo(W * 0.3, H * 0.822);
  c.lineTo(W * 0.38, H * 0.88);
  c.lineTo(W * 0.64, H * 0.757);
  c.stroke();
  c.restore();
}

export const NEUTRAL_FACE: Face = {
  eyeL: 1,
  eyeR: 1,
  happyL: 0,
  happyR: 0,
  browTiltL: 0.1,
  browTiltR: 0.1,
  browLiftL: 0,
  browLiftR: 0,
  lookX: 0,
  lookY: 0,
  mouthOpen: 0.7,
  mouthSmile: 0.8,
  mouthWidth: 1,
  cheeks: 1,
};
