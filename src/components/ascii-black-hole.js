import React, { useEffect, useRef, useState, useCallback } from 'react';

// Shading ramp from dark to bright
const SHADE = ' .,-~:;=!*#$@';
const SHADE_MAX = SHADE.length - 1;

// Cell values stored in the frame buffer: the low bits hold the shade index
// (0 = empty, SHADE_MAX = brightest); TINT marks photon-ring cells, which are
// drawn with the accent colour instead of the text colour.
const TINT = 16;
const SHADE_MASK = TINT - 1;

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
const HALF_W = 3.45; // half-width of the view, in shadow radii
const EDGE_FADE = 0.7; // the disk fades out before reaching the canvas sides
const CENTER_Y = 0.3; // shifts the hole down to balance the halo above it
const SX = 2; // horizontal sub-samples per cell
const SY = 3; // vertical sub-samples per cell (cells are ~2x taller than wide)
const SAMPLES = SX * SY;

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
    tilt: NaN,
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

// Ray-trace (cheaply) every sub-sample once and average them per cell.
// Everything here is static for a given camera tilt; only the disk turbulence
// changes per frame, so the frame loop just evaluates a few sines per lit cell.
function buildGeometry(geo, W, H, tilt) {
  const incl = INCL + tilt;
  const inclFar = INCL_FAR + tilt * 1.5;
  const unit = W / 2 / HALF_W; // columns per shadow radius
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
        const y = (-(row + (j + 0.5) / SY - H / 2) * ASPECT) / unit + CENTER_Y;
        for (let i = 0; i < SX; i++) {
          const x = (col + (i + 0.5) / SX - W / 2) / unit;
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
  geo.tilt = tilt;
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

// Gravitational-wave ripple: radial displacement + brightness ripple at the
// wave front. Returns false when the effect has expired.
// gx/gy are in grid-column/row units. Distances are computed in pixel-normalized
// units (1 unit = charWidth) to keep the wave circular in pixel space.
function applyWaveDistortion(cellBuf, distBuf, W, H, gx, gy, elapsed) {
  const WAVE_SPEED = 10; // charWidth-units per second
  const WAVE_AMP = 4.0; // max radial displacement in column-units
  const WAVE_SIGMA = 3.0; // wave ring width — wider = softer
  const DURATION = 3.0;

  if (elapsed > DURATION) return false;

  const t = elapsed / DURATION;
  // Cubic ease-out: strong initial pulse, long gentle tail
  const decay = (1 - t) * (1 - t) * (1 - t);

  const waveFront = elapsed * WAVE_SPEED;

  distBuf.set(cellBuf);

  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const dcol = c - gx;
      const drow = r - gy;
      // Convert to pixel-normalised coords (charWidth = 1 unit)
      const dx = dcol;
      const dy = drow * ASPECT;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.5) continue;

      const phase = dist - waveFront;
      const envelope = Math.exp(
        -(phase * phase) / (2 * WAVE_SIGMA * WAVE_SIGMA)
      );
      const disp = WAVE_AMP * envelope * decay;
      if (disp < 0.1) continue;

      // Direction unit vector (pixel-space), then convert displacement back to grid units
      const nx = dx / dist; // column units (unchanged)
      const ny = dy / dist / ASPECT; // row units

      const srcC = Math.round(c - nx * disp);
      const srcR = Math.round(r - ny * disp);

      if (srcC < 0 || srcC >= W || srcR < 0 || srcR >= H) {
        cellBuf[r * W + c] = 0;
        continue;
      }

      const src = distBuf[srcR * W + srcC];
      cellBuf[r * W + c] = src;

      // Smooth brightness ripple at the wave crest (no random scatter)
      if (src !== 0) {
        const boost = Math.round(5 * envelope * decay);
        if (boost > 0) {
          const si = Math.min(SHADE_MAX, (src & SHADE_MASK) + boost);
          cellBuf[r * W + c] = (src & TINT) | si;
        }
      }
    }
  }
  return true;
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
  const tiltRef = useRef(0);
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const rectRef = useRef({ cx: 0, cy: 0 });
  const rafRef = useRef(null);
  const clickWaveRef = useRef(null);
  // Mirror of `reducedMotion` for the native listeners, whose closures are
  // created once and would otherwise capture a stale value.
  const reducedMotionRef = useRef(false);
  reducedMotionRef.current = reducedMotion;
  // Set once `drawFrame` is defined below; lets the theme observer (declared
  // earlier) repaint the static frame without depending on declaration order.
  const drawFrameRef = useRef(null);

  const W = 64;
  const H = 24;
  const geometryRef = useRef(null);
  if (!geometryRef.current) geometryRef.current = createGeometry(W, H);
  const cellBufRef = useRef(new Uint8Array(W * H));
  const distBufRef = useRef(new Uint8Array(W * H));

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

  // Cache the element's viewport center; recompute only on scroll/resize,
  // NOT on mousemove (which would force a layout during scroll and cause jank).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const readRect = () => {
      const rect = el.getBoundingClientRect();
      rectRef.current.cx = rect.left + rect.width / 2;
      rectRef.current.cy = rect.top + rect.height / 2;
    };
    readRect();

    // Coalesce rect reads to at most one per animation frame. Reading
    // getBoundingClientRect() synchronously on every scroll event forces a
    // layout flush per event; near the bottom of a long page the scroll events
    // fire densely and interleave with the canvas RAF, tanking the framerate.
    // rAF-throttling keeps the layout read off the scroll hot path.
    let rectScheduled = false;
    const scheduleRect = () => {
      if (rectScheduled) return;
      rectScheduled = true;
      requestAnimationFrame(() => {
        rectScheduled = false;
        readRect();
      });
    };

    const onMouseMove = (e) => {
      const { cx, cy } = rectRef.current;
      mouseTargetRef.current.x = ((e.clientX - cx) / window.innerWidth) * 2;
      mouseTargetRef.current.y = ((e.clientY - cy) / window.innerHeight) * 2;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', scheduleRect, { passive: true });
    window.addEventListener('resize', scheduleRect);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', scheduleRect);
      window.removeEventListener('resize', scheduleRect);
    };
  }, []);

  // Use native mousedown instead of React onClick so the ripple starts on
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
      clickWaveRef.current = { gx, gy, startTime: Date.now() };
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
  useEffect(() => {
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

  // Draw exactly one frame at the current time and tilt, without advancing
  // them or scheduling another. Shared by the animation loop and the
  // reduced-motion path.
  const drawFrame = useCallback(() => {
    const geo = geometryRef.current;
    // The geometry only depends on the camera tilt, which follows the mouse
    // slowly: re-trace it only once the tilt has visibly changed.
    if (isNaN(geo.tilt) || Math.abs(geo.tilt - tiltRef.current) > 0.002) {
      buildGeometry(geo, W, H, tiltRef.current);
    }
    buildFrame(geo, W, H, timeRef.current, cellBufRef.current);

    if (clickWaveRef.current) {
      const elapsed = (Date.now() - clickWaveRef.current.startTime) / 1000;
      const active = applyWaveDistortion(
        cellBufRef.current,
        distBufRef.current,
        W,
        H,
        clickWaveRef.current.gx,
        clickWaveRef.current.gy,
        elapsed
      );
      if (!active) clickWaveRef.current = null;
    }

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
    // Moving the mouse up/down gently tilts the camera above/below the disk.
    const target = Math.max(
      -0.04,
      Math.min(0.04, -mouseTargetRef.current.y * 0.03)
    );
    tiltRef.current += (target - tiltRef.current) * 0.05;
    drawFrame();
    timeRef.current += 0.015;
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
};

const canvasStyle = {
  display: 'block',
  color: 'var(--text-primary)',
  maxWidth: '100%',
  height: 'auto',
  cursor: 'pointer',
};

// Reduced motion: the click ripple is disabled, so don't advertise it.
const canvasStyleStatic = { ...canvasStyle, cursor: 'default' };
