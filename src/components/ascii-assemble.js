// Entrance shared by the footer animations (ascii-globe.js,
// ascii-black-hole.js and ascii-galaxy.js): the first time the canvas scrolls
// into view, every character bursts out of the centre of the canvas and flies
// in a straight line to its place while brightening, shooting a little past it
// and springing back. Positions are kept on the canvas, so no character ever
// leaves it.
//
// Same frame buffer encoding as ascii-click-shatter.js: one byte per cell, the
// low bits holding the shade index and TINT marking accent-coloured cells.
import { hash } from './ascii-click-shatter';

const TINT = 16;
const SHADE_MASK = TINT - 1;
const ASPECT = 1.95; // cell height / cell width (13px line / ~6.6px glyph)

const FLIGHT = 1.0; // seconds each character takes to reach its place
const MAX_DELAY = 0.35; // the last characters set off this much later
const OVERSHOOT = 1.7; // how far past its place a character shoots (ease-out-back)
const START_DIM = 0.5; // characters start at this share of their brightness

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

// Moves the lit cells of `cellBuf` along their entrance flight, `age` seconds
// after it started, and writes the result back into it; `outBuf` is scratch
// space of the same size. Returns false once every character has landed.
export function applyAssemble(cellBuf, outBuf, W, H, age) {
  if (age >= FLIGHT + MAX_DELAY) return false;

  const maxDist = Math.hypot(W / 2, (H / 2) * ASPECT);
  // Every flight starts from the centre cell.
  const sc = Math.floor(W / 2);
  const sr = Math.floor(H / 2);
  outBuf.fill(0);
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const v = cellBuf[r * W + c];
      if (v === 0) continue;

      // Inner characters set off first, with some randomness on top.
      const dist = Math.hypot(c - W / 2, (r - H / 2) * ASPECT) / maxDist;
      const delay = (0.4 * dist + 0.6 * hash(c, r, 1)) * MAX_DELAY;
      const p = Math.min(1, Math.max(0, (age - delay) / FLIGHT));
      // Ease-out-back: a fast burst out of the centre that overshoots its
      // place, then settles back onto it.
      const q = p - 1;
      const e = 1 + (OVERSHOOT + 1) * q * q * q + OVERSHOOT * q * q;

      // Overshooting can carry characters by the edges past them: hold them
      // on the canvas.
      const tc = clamp(Math.round(sc + (c - sc) * e), 0, W - 1);
      const tr = clamp(Math.round(sr + (r - sr) * e), 0, H - 1);

      const shade = Math.max(
        1,
        Math.round((v & SHADE_MASK) * (START_DIM + (1 - START_DIM) * p))
      );
      const cell = tr * W + tc;
      if (shade > (outBuf[cell] & SHADE_MASK)) {
        outBuf[cell] = (v & TINT) | shade;
      }
    }
  }
  cellBuf.set(outBuf);
  return true;
}
