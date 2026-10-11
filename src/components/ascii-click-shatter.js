// Click effect shared by the footer animations (ascii-black-hole.js and
// ascii-globe.js): the characters around the click burst apart like 3D
// particles, then a damped spring pulls each one back home.
//
// Both animations use the same frame buffer encoding, mirrored here: one byte
// per cell, the low bits holding the shade index (0 = empty, SHADE_MAX =
// brightest) and TINT marking accent-coloured cells.
const SHADE_MAX = 12;
const TINT = 16;
const SHADE_MASK = TINT - 1;
const ASPECT = 1.95; // cell height / cell width (13px line / ~6.6px glyph)

const REACH = 9; // radius of the burst, in columns
const KICK = 6; // peak flight distance next to the click, in columns
const SPRING = 2.6; // spring angular frequency, rad/s
const DAMPING = 0.75; // seconds for the motion to decay by e
const FOCAL = 6; // perspective: depth at which a particle looks twice as far out
const MAX_DELAY = 0.18; // random extra delay per particle, in seconds
const DELAY_PER_COL = 0.012; // the burst spreads out from the click
const DURATION = 4.8; // seconds until a burst has settled

// Stable pseudo-random value in [0, 1) per cell and burst.
function hash(c, r, seed) {
  let h = (c * 374761393 + r * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Displaces the lit cells of `cellBuf` by every live burst and writes the
// result back into it; `outBuf` is scratch space of the same size.
// bursts: [{ gx, gy, startTime, seed }], gx/gy in grid-column/row units,
// startTime in ms. Returns the bursts that are still moving.
export function applyClickShatter(cellBuf, outBuf, W, H, bursts, now) {
  const live = bursts.filter((b) => (now - b.startTime) / 1000 < DURATION);
  if (live.length === 0) return live;

  const ages = live.map((b) => (now - b.startTime) / 1000);

  outBuf.fill(0);
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const v = cellBuf[r * W + c];
      if (v === 0) continue;

      let dx = 0;
      let dy = 0;
      let dz = 0;
      for (let k = 0; k < live.length; k++) {
        const b = live[k];
        const ox = c - b.gx;
        const oy = (r - b.gy) * ASPECT;
        const d2 = ox * ox + oy * oy;
        const falloff = Math.exp(-d2 / (REACH * REACH));
        if (falloff < 0.02) continue;
        // Each particle starts a little later than the click: further out and
        // a random bit more. Its flight is the impulse response of an
        // under-damped spring: out, slightly past home on the way back, then
        // settled (normalised to peak at ~1).
        const t =
          ages[k] -
          Math.sqrt(d2) * DELAY_PER_COL -
          hash(c + 11, r + 5, b.seed) * MAX_DELAY;
        if (t <= 0) continue;
        const swing = (Math.exp(-t / DAMPING) * Math.sin(SPRING * t)) / 0.55;
        // Mostly away from the click, with some scatter and depth.
        const jitter = (hash(c, r, b.seed) - 0.5) * 1.2;
        const ang = (d2 > 0.0001 ? Math.atan2(oy, ox) : 0) + jitter;
        const speed = KICK * falloff * (0.6 + 0.8 * hash(r, c, b.seed + 1));
        const amount = speed * swing;
        dx += Math.cos(ang) * amount;
        dy += Math.sin(ang) * amount;
        dz += (hash(c + 7, r + 3, b.seed) * 2 - 1) * amount * 0.6;
      }

      let shade = v & SHADE_MASK;
      let tc = c;
      let tr = r;
      if (dx !== 0 || dy !== 0) {
        // Particles coming towards the camera spread further and glow;
        // those going away fade.
        const persp = FOCAL / Math.max(FOCAL * 0.4, FOCAL - dz);
        tc = Math.round(c + dx * persp);
        tr = Math.round(r + (dy * persp) / ASPECT);
        if (tc < 0 || tc >= W || tr < 0 || tr >= H) continue;
        shade = Math.max(
          1,
          Math.min(SHADE_MAX, Math.round(shade * (0.55 + 0.45 * persp)))
        );
      }
      const cell = tr * W + tc;
      if (shade > (outBuf[cell] & SHADE_MASK)) {
        outBuf[cell] = (v & TINT) | shade;
      }
    }
  }
  cellBuf.set(outBuf);
  return live;
}
