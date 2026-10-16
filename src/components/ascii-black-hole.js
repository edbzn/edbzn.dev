import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { applyAssemble } from './ascii-assemble';
import { useFillColumns } from './use-fill-columns';
import { applyClickShatter } from './ascii-click-shatter';

// Shading ramp from dark to bright
const SHADE = ' .,-~:;=!*#$@';
const SHADE_MAX = SHADE.length - 1;

// Cell values stored in the frame buffer: the low bits hold the shade index
// (0 = empty, SHADE_MAX = brightest); TINT marks photon-ring cells, which are
// drawn with the accent colour instead of the text colour.
// ascii-click-shatter.js relies on this same encoding.
const TINT = 16;

// Pre-computed opacity per shade level. Faint characters stay faint so the
// outer disk dissolves into the background instead of ending on a hard edge.
const SHADE_OPACITY_VALUES = [...SHADE].map((_, i) =>
  i === 0 ? 0 : 0.18 + 0.82 * Math.pow(i / SHADE_MAX, 0.9)
);

// Black hole geometry, in units of the shadow radius.
const ASPECT = 1.95; // cell height / cell width (13px line / ~6.6px glyph)
const SHADOW_R = 1.0; // event-horizon shadow: always empty
const RING_R = 1.07; // photon ring radius
const RING_W = 0.06; // photon ring thickness (gaussian sigma)
const LENS_R = 1.0; // the lensed far disk is pushed out past this radius
const LENS_SOFT = 0.6; // how far from the shadow the lensing stays strong
const DISK_IN = 1.3; // inner edge of the accretion disk
const DISK_OUT = 4.4; // outer edge of the accretion disk
const DISK_FADE = 2.0; // radial distance over which the outer disk fades out
const INCL = 0.12; // sin(camera elevation): the disk is seen almost edge-on
const INCL_FAR = 1.2; // ...but its far side, lensed, wraps around the shadow
const FAR_FALLOFF = 0.3; // extra radial falloff of the lensed halo
const NEAR_GAIN = 1.3; // the band crossing in front of the shadow stands out
const UNDER_W = 0.4; // band under the shadow showing the secondary image
const UNDER_STRETCH = 2.2; // radial compression of that secondary image
const UNDER_DIM = 0.6;
const DOPPLER = 0.3; // relativistic beaming: approaching (left) side brighter
const UNIT = 8.5; // columns per shadow radius: sets the drawing's size
const HALF_W = 3.45; // the disk fades out this far from the centre, in shadow radii
const EDGE_FADE = 0.7; // ...over this distance, in shadow radii
const CENTER_Y = 0.3; // shifts the hole down to balance the halo above it
const SX = 2; // horizontal sub-samples per cell
const SY = 3; // vertical sub-samples per cell (cells are ~2x taller than wide)
const SAMPLES = SX * SY;

// Canvas size: the same height for every footer animation, and at least
// this many columns (it widens to fill the content column).
const ROWS = 22;
const MIN_COLS = 60; // the disk, out to where it fades

function parseCssColor(raw) {
  if (!raw) return null;
  // Parse hex (#rrggbb or #rgb), rgb/rgba(...), or hsl/hsla(...).
  // Browsers normalize computed colors to different formats (e.g. Chrome
  // returns hsla() for colors with alpha), so all three must be handled.
  const hex = raw.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  const hsl = raw.match(
    /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/i
  );
  if (hex) {
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  if (hsl) return hslToRgb(Number(hsl[1]), Number(hsl[2]), Number(hsl[3]));
  const m = raw.match(/(\d+)/g);
  if (!m || m.length < 3) return null;
  return m.slice(0, 3).map(Number);
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ];
}

// Per-cell geometry, averaged over the cell's sub-samples.
function createGeometry(W, H) {
  const n = W * H;
  return {
    incl: NaN, // camera the geometry was traced for
    roll: NaN,
    r: new Float32Array(n), // disk radius seen by the cell
    phi: new Float32Array(n), // disk azimuth seen by the cell
    omega: new Float32Array(n), // Keplerian angular velocity at that radius
    weight: new Float32Array(n), // static disk brightness (0 = no disk)
    ring: new Float32Array(n), // static photon-ring brightness
  };
}

// Static part of the disk brightness at disk-plane point (X, Z), where Z
// points away from the viewer. Returns 0 outside the disk.
function diskWeight(X, Z) {
  const r = Math.sqrt(X * X + Z * Z);
  if (r < DISK_IN || r > DISK_OUT) return 0;
  const falloff = Math.pow(DISK_IN / r, 1.3);
  const inner = Math.min(1, (r - DISK_IN) / 0.25);
  const outer = Math.min(1, (DISK_OUT - r) / DISK_FADE);
  // The disk spins counter-clockwise seen from above, so its left side
  // (X < 0) moves towards the viewer and is Doppler-boosted.
  const beta = DOPPLER / Math.sqrt(r / DISK_IN);
  const dop = 1 - (X / r) * beta;
  return falloff * inner * outer * dop * dop * dop;
}

// Map a screen point to the far side of the disk, bent over the top of the
// shadow by gravitational lensing. A screen radius rho shows the disk at
// projected distance sqrt(rho² - LENS_R²): light grazing the shadow comes
// from right behind the hole. Close to the shadow the far disk looks almost
// face-on (a halo around the hole); further out lensing fades and it flattens
// back into the edge-on disk.
function lensFar(x, y, rho, incl, inclFar, out) {
  if (y <= 0 || rho <= LENS_R) return 0;
  const k = Math.sqrt(rho * rho - LENS_R * LENS_R) / rho;
  const q = (rho - LENS_R) / LENS_SOFT;
  const inclEff = incl + (inclFar - incl) / (1 + q * q);
  const X = x * k;
  const Z = (y * k) / inclEff;
  const w = diskWeight(X, Z);
  if (w === 0) return 0;
  out.X = X;
  out.Z = Z;
  return w * Math.pow(DISK_IN / Math.sqrt(X * X + Z * Z), FAR_FALLOFF);
}

// Ray-trace (cheaply) every sub-sample and average them per cell, for a
// camera at elevation `incl` (sine of the angle above the disk plane) rolled
// by `roll` radians. The disk turbulence is shaded separately per frame.
function buildGeometry(geo, W, H, incl, roll) {
  // Seen from higher up, the lensed far side wraps the shadow even more.
  const inclFar = INCL_FAR + (incl - INCL) * 1.5;
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  const hit = { X: 0, Z: 0 };
  const under = { X: 0, Z: 0 };
  let cell = 0;
  for (let row = 0; row < H; row++) {
    for (let col = 0; col < W; col++, cell++) {
      let ringSum = 0;
      let wSum = 0;
      // Disk coordinates are averaged weighted by brightness; the azimuth via
      // its cosine/sine so cells straddling ±π don't average to 0.
      let rSum = 0;
      let cosSum = 0;
      let sinSum = 0;
      let omegaSum = 0;
      for (let j = 0; j < SY; j++) {
        const y0 = (-(row + (j + 0.5) / SY - H / 2) * ASPECT) / UNIT + CENTER_Y;
        for (let i = 0; i < SX; i++) {
          const x0 = (col + (i + 0.5) / SX - W / 2) / UNIT;
          // Camera roll: turn the view around the hole.
          const x = x0 * cr + y0 * sr;
          const y = y0 * cr - x0 * sr;
          const rho = Math.sqrt(x * x + y * y);
          let w = 0;
          let ring = 0;

          // 1) Near side of the disk, in front of the hole: not lensed, it
          //    crosses the lower part of the shadow as a bright band.
          const zNear = y / incl;
          if (zNear < 0) {
            w = diskWeight(x, zNear) * NEAR_GAIN;
            hit.X = x;
            hit.Z = zNear;
          }

          if (w === 0 && rho >= SHADOW_R) {
            // 2) Thin photon ring hugging the shadow, Doppler-tinted too.
            const dr = (rho - RING_R) / RING_W;
            ring = Math.exp(-dr * dr) * (1.05 - DOPPLER * (x / rho));

            // 3) Far side of the disk, lensed into an arc over the shadow.
            w = lensFar(x, y, rho, incl, inclFar, hit);

            // 4) Secondary image: a thinner, dimmer copy under the shadow.
            if (y < 0 && rho < SHADOW_R + UNDER_W) {
              const ru = LENS_R + (rho - SHADOW_R) * UNDER_STRETCH;
              const f = ru / rho;
              const wu =
                lensFar(x * f, -y * f, ru, incl, inclFar, under) * UNDER_DIM;
              if (wu > w) {
                w = wu;
                hit.X = under.X;
                hit.Z = under.Z;
              }
            }
          }

          if (w > 0) w *= Math.min(1, (HALF_W - Math.abs(x)) / EDGE_FADE);

          ringSum += ring;
          if (w > 0) {
            const r = Math.sqrt(hit.X * hit.X + hit.Z * hit.Z);
            wSum += w;
            rSum += w * r;
            cosSum += (w * hit.X) / r;
            sinSum += (w * hit.Z) / r;
            omegaSum += w / (r * Math.sqrt(r));
          }
        }
      }
      geo.ring[cell] = ringSum / SAMPLES;
      geo.weight[cell] = wSum / SAMPLES;
      if (wSum > 0) {
        geo.r[cell] = rSum / wSum;
        geo.phi[cell] = Math.atan2(sinSum, cosSum);
        geo.omega[cell] = omegaSum / wSum;
      }
    }
  }
  geo.incl = incl;
  geo.roll = roll;
}

// Shade every cell for time t: the disk turns differentially (inner orbits
// faster) and its turbulence is a few sheared sine waves in (angle, radius).
function buildFrame(geo, W, H, t, cellBuf) {
  const { r, phi, omega, weight, ring } = geo;
  for (let cell = 0; cell < W * H; cell++) {
    const rg = ring[cell];
    const w = weight[cell];
    let d = 0;
    if (w > 0) {
      const a = phi[cell] + omega[cell] * t;
      const rr = r[cell];
      d =
        w *
        (0.62 +
          0.22 * Math.sin(a * 3 + rr * 4.1) +
          0.16 * Math.sin(a * 7 - rr * 9.3 + 1.7 + t * 0.3) +
          0.1 * Math.sin(a * 13 + rr * 17 + 0.4));
    }
    const v = rg + d;
    if (v <= 0) {
      cellBuf[cell] = 0;
      continue;
    }
    const si = Math.round(Math.pow(v > 1 ? 1 : v, 0.6) * SHADE_MAX);
    cellBuf[cell] = si > 0 && rg > d ? si | TINT : si;
  }
}

// Render cellBuf directly onto a canvas context — zero string allocation per frame.
// palette: precomputed fillStyle strings and glyphs per cell value (shade | TINT).
function renderFrame(ctx, cellBuf, W, H, cw, lh, palette) {
  ctx.clearRect(0, 0, W * cw, H * lh);
  let current = -1;
  for (let r = 0; r < H; r++) {
    const rowOff = r * W;
    const y = r * lh;
    for (let c = 0; c < W; c++) {
      const v = cellBuf[rowOff + c];
      if (v === 0) continue;
      if (v !== current) {
        ctx.fillStyle = palette.colors[v];
        current = v;
      }
      ctx.fillText(palette.chars[v], c * cw, y);
    }
  }
}

export const AsciiBlackHole = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const metricsRef = useRef({ cw: 6.6, lh: 12 });
  // Precomputed fillStyle strings for each cell value.
  // Rebuilt once on init and whenever the CSS colors change (theme switch).
  const paletteRef = useRef(null);
  const timeRef = useRef(0);
  // Extra rotation speed fed by mouse movement, and the distance the mouse
  // travelled since the last frame (in viewport widths).
  const boostRef = useRef(0);
  const mouseTravelRef = useRef(0);
  const rafRef = useRef(null);
  // Live click bursts (see ascii-click-shatter.js).
  const burstsRef = useRef([]);
  // When the entrance started (see ascii-assemble.js): null until the canvas
  // first scrolls into view, 0 once it has played.
  const introRef = useRef(null);
  // Camera orbit phase: drives its elevation and roll.
  const cameraRef = useRef(0);
  // Mirror of `reducedMotion` for the native listeners, whose closures are
  // created once and would otherwise capture a stale value.
  const reducedMotionRef = useRef(false);
  reducedMotionRef.current = reducedMotion;
  // Set once `drawFrame` is defined below; lets the theme observer (declared
  // earlier) repaint the static frame without depending on declaration order.
  const drawFrameRef = useRef(null);

  // The canvas spans the full content width; the drawing keeps its size.
  const W = useFillColumns(containerRef, MIN_COLS);
  const H = ROWS;
  const geometryRef = useRef(null);
  const cellBufRef = useRef(null);
  const distBufRef = useRef(null);
  if (cellBufRef.current?.length !== W * H) {
    geometryRef.current = createGeometry(W, H);
    cellBufRef.current = new Uint8Array(W * H);
    distBufRef.current = new Uint8Array(W * H);
  }

  // Respect prefers-reduced-motion: the disk is a permanent rAF loop, so a
  // reader who asked for less motion gets a single static frame instead.
  // Tracked reactively so toggling the OS setting takes effect without a reload.
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReducedMotion(mq.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      // threshold: 0 = animate as long as even 1px is visible.
      // A higher threshold like 0.1 stops the animation when DevTools opens
      // and shrinks the viewport, pushing the canvas partially off-screen.
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Accumulate how far the mouse moves; the animation loop turns it into
  // extra rotation speed.
  useEffect(() => {
    let lastX = null;
    let lastY = null;
    const onMouseMove = (e) => {
      if (lastX !== null) {
        mouseTravelRef.current +=
          Math.hypot(e.clientX - lastX, e.clientY - lastY) / window.innerWidth;
      }
      lastX = e.clientX;
      lastY = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  // Use native mousedown instead of React onClick so the burst starts on
  // press, before the next animation frame is drawn.
  useEffect(() => {
    const div = containerRef.current;
    if (!div) return;
    const onMouseDown = (e) => {
      const canvas = canvasRef.current;
      if (!canvas || reducedMotionRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const gx = ((e.clientX - rect.left) / rect.width) * W;
      const gy = ((e.clientY - rect.top) / rect.height) * H;
      burstsRef.current.push({
        gx,
        gy,
        startTime: Date.now(),
        seed: Math.floor(Math.random() * 1e6),
      });
    };
    div.addEventListener('mousedown', onMouseDown);
    return () => div.removeEventListener('mousedown', onMouseDown);
  }, [W, H]);

  // Build precomputed fillStyle strings from the --text-primary (disk) and
  // --accent-color (photon ring) CSS variables. Reading the variables directly
  // is more reliable than getComputedStyle(canvas).color because
  // document.fonts.ready can fire before the stylesheet is parsed, which would
  // yield rgb(0,0,0) (invisible on dark background).
  const buildPalette = useCallback(() => {
    const style = getComputedStyle(document.documentElement);
    // Note: black (rgb(0,0,0)) is the legitimate light-theme color, so it must
    // NOT be rejected. The "not yet resolved" case is handled by the empty
    // string check (getPropertyValue returns '' before CSS parses).
    const base = parseCssColor(style.getPropertyValue('--text-primary').trim());
    if (!base) return false;
    const accent =
      parseCssColor(style.getPropertyValue('--accent-color').trim()) || base;
    const colors = new Array(TINT * 2);
    const chars = new Array(TINT * 2);
    SHADE_OPACITY_VALUES.forEach((a, i) => {
      const alpha = a.toFixed(3);
      colors[i] = `rgba(${base[0]},${base[1]},${base[2]},${alpha})`;
      colors[i | TINT] =
        `rgba(${accent[0]},${accent[1]},${accent[2]},${alpha})`;
      chars[i] = chars[i | TINT] = SHADE[i];
    });
    paletteRef.current = { colors, chars };
    return true;
  }, []);

  // Initialise canvas: measure font metrics, set DPR-scaled dimensions.
  // Before paint, so the canvas never shows at its default 300x150 size.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      const fs = 11;
      const lh = 13;
      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;
      // Use Fira Code only if already in the font cache. Setting ctx.font to an
      // uncached web font triggers a synchronous download + parse on the main thread
      // which tanks the framerate when the canvas first enters the viewport.
      // Fall back to system monospace immediately; re-init after fonts.ready to
      // upgrade metrics once Fira Code finishes loading (off the scroll hot-path).
      const font = document.fonts.check(`${fs}px "Fira Code"`)
        ? `${fs}px "Fira Code", "Courier New", Courier, monospace`
        : `${fs}px "Courier New", Courier, monospace`;
      ctx.font = font;
      ctx.textBaseline = 'top';
      const cw = ctx.measureText('M').width;
      metricsRef.current = { cw, lh };
      canvas.width = Math.round(W * cw * dpr);
      canvas.height = Math.round(H * lh * dpr);
      // Only the width is set: the height follows the canvas aspect ratio, so
      // the drawing scales down uniformly on narrow screens.
      canvas.style.width = `${Math.round(W * cw)}px`;
      ctx.scale(dpr, dpr);
      ctx.font = font;
      ctx.textBaseline = 'top';
      buildPalette();
      // Resizing the canvas cleared it; repaint the static frame if no loop runs.
      if (reducedMotionRef.current) drawFrameRef.current?.();
    };
    // Init immediately with the best font available right now — no blocking wait.
    init();
    // Once all fonts have settled, re-init to upgrade to Fira Code metrics if it
    // wasn't available above. This runs off the scroll hot-path.
    document.fonts.ready.then(() => {
      if (canvasRef.current) init();
    });
    // Also try after full page load in case fonts.ready fires before CSS is parsed.
    window.addEventListener('load', () => buildPalette(), { once: true });

    // Update the palette when the theme (CSS colors) changes. Under reduced
    // motion there is no rAF loop to repaint, so redraw the static frame here
    // or the black hole would keep the previous theme's colors.
    const themeObserver = new MutationObserver(() => {
      buildPalette();
      if (reducedMotionRef.current) drawFrameRef.current?.();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
    return () => themeObserver.disconnect();
  }, [W, H, buildPalette]);

  // Draw exactly one frame at the current time, without advancing
  // them or scheduling another. Shared by the animation loop and the
  // reduced-motion path.
  const drawFrame = useCallback(() => {
    const geo = geometryRef.current;
    // The camera slowly bobs above/below its mean height over the disk
    // and rolls a little, so the view keeps changing; reduced motion keeps
    // it still. Re-traced only when it has actually moved.
    const phase = cameraRef.current;
    const incl = INCL + 0.11 * Math.sin(phase) + 0.05;
    const roll = 0.14 * Math.sin(phase * 0.63 + 1.1);
    if (
      Math.abs(geo.incl - incl) > 1e-4 ||
      Math.abs(geo.roll - roll) > 1e-4 ||
      isNaN(geo.incl)
    ) {
      buildGeometry(geo, W, H, incl, roll);
    }
    buildFrame(geo, W, H, timeRef.current, cellBufRef.current);

    // On first appearance the characters gather from random spots.
    if (introRef.current) {
      const live = applyAssemble(
        cellBufRef.current,
        distBufRef.current,
        W,
        H,
        (Date.now() - introRef.current) / 1000
      );
      if (!live) introRef.current = 0;
    }

    // Clicks burst the characters around them apart; several bursts stack.
    burstsRef.current = applyClickShatter(
      cellBufRef.current,
      distBufRef.current,
      W,
      H,
      burstsRef.current,
      Date.now()
    );

    const ctx = ctxRef.current;
    // Lazy fallback: if the palette wasn't built yet (CSS loaded after
    // fonts.ready), try again now that the page is fully rendered.
    if (ctx && !paletteRef.current) buildPalette();
    if (ctx && paletteRef.current) {
      const { cw, lh } = metricsRef.current;
      renderFrame(ctx, cellBufRef.current, W, H, cw, lh, paletteRef.current);
    }
  }, [W, H, buildPalette]);

  drawFrameRef.current = drawFrame;

  const animate = useCallback(() => {
    // Mouse movement spins the disk up; the extra speed then winds down
    // smoothly. Speeding up time keeps the differential rotation (inner
    // orbits faster).
    boostRef.current = Math.min(
      2,
      boostRef.current * 0.97 + mouseTravelRef.current * 3
    );
    mouseTravelRef.current = 0;
    drawFrame();
    timeRef.current += 0.012 * (1 + boostRef.current);
    // One slow camera bob every ~70s, slightly quicker while spun up.
    cameraRef.current += 0.0015 * (1 + boostRef.current * 0.2);
    rafRef.current = requestAnimationFrame(animate);
  }, [drawFrame]);

  useEffect(() => {
    if (reducedMotion) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // One static frame, redrawn on visibility so it survives a theme change.
      if (isVisible) drawFrame();
      return undefined;
    }
    if (isVisible) {
      if (introRef.current === null) introRef.current = Date.now();
      rafRef.current = requestAnimationFrame(animate);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isVisible, animate, reducedMotion, drawFrame]);

  return (
    <div ref={containerRef} style={containerStyle} aria-hidden="true">
      <canvas
        ref={canvasRef}
        style={reducedMotion ? canvasStyleStatic : canvasStyle}
      />
    </div>
  );
};

const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '160px',
  overflow: 'hidden',
  userSelect: 'none',
  maxWidth: '100%',
  // No blue tap rectangle on mobile when the canvas is tapped.
  WebkitTapHighlightColor: 'transparent',
};

const canvasStyle = {
  display: 'block',
  color: 'var(--text-primary)',
  maxWidth: '100%',
  height: 'auto',
  cursor: 'pointer',
};

// Reduced motion: the click burst is disabled, so don't advertise it.
const canvasStyleStatic = { ...canvasStyle, cursor: 'default' };
