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
// (0 = empty, SHADE_MAX = brightest); TINT marks graticule, atmosphere and
// rim cells, drawn with the accent colour instead of the text colour.
// ascii-click-shatter.js relies on this same encoding.
const TINT = 16;

// Pre-computed opacity per shade level. Faint characters stay faint so the
// ocean reads as a light dotted texture under the brighter continents.
const SHADE_OPACITY_VALUES = [...SHADE].map((_, i) =>
  i === 0 ? 0 : 0.2 + 0.8 * Math.pow(i / SHADE_MAX, 0.9)
);

// Land mask: an equirectangular bitmap (longitude -180..180 left to right,
// latitude 90..-90 top to bottom) rasterized from Natural Earth's 1:110m land
// polygons. Each comma-separated row is run-length encoded: alternating ocean
// and land runs, starting with ocean, one base-64 digit per run (a run longer
// than 63 continues after an empty run of the other kind).
const MASK_W = 192;
const MASK_H = 96;
const LAND_RLE = `
  /0/0/03,/0/0/03,/0/0/03,/0c8/0K,ME/0F,Jd2qg7B3H,A171463sh3J1E,v113123218721m
  G311dbe2k,u4b31111ejE2feA,tb221128bhE2713s56g,a8f9232b7hn5kO532,25s325412538
  cpc71281U,53I564aqf1/0a,316D13121476a4d61/0k1,8Db385q61/0l1,8C93c3q72/08274,
  a48o8521B2143/011121329,c1cn78u2732/949,qq2at251114+a3a,rp2cp2123/0982b,sCs3
  1/0cj,sx42t/0c11j,uv43q/0dm,uyvh12162Jn,ut21x817642J32j,usx74225742G51k,ury5
  81131c2A1461k,uqz5b21c3y4161l,voC2259O2242l,wnBadJ64m,xkCc417K42p,y11hCe1Tv,
  A971Bw1Cv,z11781Ap172Aw,A116Ir17212ww,D5Hs2a5q21v,E4a1wt1b5a2bA,E531Ct298747
  11B,F8Ct28956771v,I7Au25b49661v,L5zv13e39661v,O1Awh3c3C,O247pze1a13181u,Q11a
  pye1o1t,Tapwr18131t,Tdn26np12162x,Sfwkr11153x,Sfwiu235x,Riuhv32571p,Rlrhw233
  2165k,Rnqfy28166i,RoqeA1g5h,SnqeS211h,Snqe/0c,TlrfM3n,Tksf41E11332j,Ujrg32D7
  22j,Whre33Ddi,Whsc52Cfh,Wgtc43zjg,Wewb42Akf,WcyaHle,Wcy9Ile,Wcz8Ile,WbA7Jle,
  WaC5L559f,Va/0s1a8f,V9/0F6g,V8/0I2f21,V6/0/12,V5/0M2c23,V4/0+24,U4/0+25,U5/0
  /05,U4/0/06,U3/0/07,V3/0/06,X1/0/06,/0/0/03,/0/0/03,/0/0/03,/0/0/03,/0/0/03,
  Y2Z4n23338n,Y1We5Cg,W5A2251o2La,G1e213r/0y5,v55mo/0z7,iGo/0A9,cIe26/0H8,922G
  e44/0H9,0/0/0/03,0/0/0/03,0/0/0/03,0/0/0/03,0/0/0/03
`;
const RLE_DIGITS =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/';

const LAND = (() => {
  const mask = new Uint8Array(MASK_W * MASK_H);
  LAND_RLE.replace(/\s/g, '')
    .split(',')
    .forEach((row, y) => {
      let x = y * MASK_W;
      let land = 0;
      for (const digit of row) {
        const end = x + RLE_DIGITS.indexOf(digit);
        mask.fill(land, x, end);
        x = end;
        land ^= 1;
      }
    });
  return mask;
})();

// Globe geometry and motion.
const ASPECT = 1.95; // cell height / cell width (13px line / ~6.6px glyph)
const RIM = 1.2; // rows kept free around the disc for the atmosphere
const SX = 2; // horizontal sub-samples per cell
const SY = 3; // vertical sub-samples per cell (cells are ~2x taller than wide)
const SAMPLES = SX * SY;
const TILT = 0.36; // north pole tipped ~20° towards the viewer
const TILT_RANGE = 0.1; // the mouse height adds or removes up to ~6°
const SPIN = (2 * Math.PI) / 80; // one turn every 80 s, in rad/s
const NUDGE_MAX = 2 * SPIN; // mouse nudges keep the speed within ±3× SPIN
const START_LON = (15 * Math.PI) / 180; // Europe and Africa face the viewer
const GRID_STEP = Math.PI / 6; // graticule every 30°
const GRID_HALF_W = 0.022; // graticule half-width, in radians

// Light from the upper left, slightly in front: the terminator sits on the
// right of the disc. The half-vector puts a soft glint on the ocean.
const LIGHT = normalize(-0.55, 0.45, 0.7);
const HALF = normalize(LIGHT[0], LIGHT[1], LIGHT[2] + 1);

function normalize(x, y, z) {
  const len = Math.sqrt(x * x + y * y + z * z);
  return [x / len, y / len, z / len];
}

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

const smoothstep = (a, b, x) => {
  const k = clamp((x - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
};

// Canvas size: the same height for every footer animation, and at least
// this many columns (it widens to fill the content column).
const ROWS = 22;
const MIN_COLS = 42; // the globe and its atmosphere

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

// The disc's centre on the grid and its radius in rows and in columns.
function discOf(W, H) {
  const rows = H / 2 - RIM;
  return { cx: W / 2, cy: H / 2, rows, cols: rows * ASPECT };
}

// Everything that only depends on the grid: the view-space normal of each
// sub-sample on the disc, and per cell its lighting, ocean glint and
// atmosphere. Light and camera never move, only the globe under them turns.
function createGeometry(W, H) {
  const n = W * H;
  const geo = {
    count: new Uint8Array(n), // sub-samples on the disc (0 = off the globe)
    sx: new Float32Array(n * SAMPLES), // their view-space normals
    sy: new Float32Array(n * SAMPLES),
    sz: new Float32Array(n * SAMPLES),
    light: new Float32Array(n), // diffuse lighting, 0..1
    glint: new Float32Array(n), // specular highlight on water, 0..1
    rim: new Float32Array(n), // atmosphere just outside the disc, 0..1
  };
  const disc = discOf(W, H);
  let cell = 0;
  for (let row = 0; row < H; row++) {
    for (let col = 0; col < W; col++, cell++) {
      let count = 0;
      let mx = 0;
      let my = 0;
      let mz = 0;
      let rim = 0;
      for (let j = 0; j < SY; j++) {
        const y = -(row + (j + 0.5) / SY - disc.cy) / disc.rows;
        for (let i = 0; i < SX; i++) {
          const x = (col + (i + 0.5) / SX - disc.cx) / disc.cols;
          const d2 = x * x + y * y;
          if (d2 >= 1) {
            // A thin halo hugging the limb, brighter on the lit side.
            const r = Math.sqrt(d2);
            const fall = (r - 1) / 0.06;
            const lit = (x * LIGHT[0] + y * LIGHT[1]) / r;
            rim += Math.exp(-fall * fall) * (0.2 + 0.8 * Math.max(0, lit));
            continue;
          }
          const k = cell * SAMPLES + count++;
          const z = Math.sqrt(1 - d2);
          geo.sx[k] = x;
          geo.sy[k] = y;
          geo.sz[k] = z;
          mx += x;
          my += y;
          mz += z;
        }
      }
      geo.count[cell] = count;
      geo.rim[cell] = rim / SAMPLES;
      if (count === 0) continue;
      const [nx, ny, nz] = normalize(mx, my, mz);
      const ndl = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
      geo.light[cell] = Math.pow(clamp((ndl + 0.25) / 1.15, 0, 1), 1.3);
      const ndh = Math.max(0, nx * HALF[0] + ny * HALF[1] + nz * HALF[2]);
      geo.glint[cell] = Math.pow(ndh, 40);
    }
  }
  return geo;
}

// Shade every cell for a globe turned so that longitude `lon0` faces the
// viewer, its north pole tipped towards the viewer by `tilt` radians.
// Land is bright and dense, the ocean a faint dotted texture crossed by a
// fainter graticule.
function buildFrame(geo, W, H, lon0, tilt, cellBuf) {
  const { count, sx, sy, sz, light, glint, rim } = geo;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  const lonScale = MASK_W / (2 * Math.PI);
  const latScale = MASK_H / Math.PI;
  for (let cell = 0; cell < W * H; cell++) {
    const n = count[cell];
    if (n === 0) {
      const si = Math.round(rim[cell] * 5);
      cellBuf[cell] = si > 0 ? TINT | si : 0;
      continue;
    }
    let land = 0;
    let grid = 0;
    for (let s = cell * SAMPLES, end = s + n; s < end; s++) {
      // Undo the tilt to find where on the globe the sample lands.
      const y = sy[s] * cosT + sz[s] * sinT;
      const z = sz[s] * cosT - sy[s] * sinT;
      const lat = Math.asin(y);
      const lon = Math.atan2(sx[s], z) + lon0;
      let u = Math.floor(lon * lonScale + MASK_W / 2) % MASK_W;
      if (u < 0) u += MASK_W;
      const v = Math.min(
        MASK_H - 1,
        Math.floor((Math.PI / 2 - lat) * latScale)
      );
      if (LAND[v * MASK_W + u] === 1) {
        land++;
        continue;
      }
      // Parallels, and meridians that stop short of the poles where they
      // would bunch up.
      const dLat = Math.abs(lat - Math.round(lat / GRID_STEP) * GRID_STEP);
      const dLon =
        Math.abs(lon - Math.round(lon / GRID_STEP) * GRID_STEP) *
        Math.sqrt(1 - y * y);
      if (dLat < GRID_HALF_W || (dLon < GRID_HALF_W && Math.abs(y) < 0.9)) {
        grid++;
      }
    }
    const l = light[cell];
    const landV = 0.55 + 0.45 * l;
    const seaV = 0.05 + 0.08 * l + 0.08 * glint[cell];
    // Coastlines stay crisp (a cell is land once most of it is), with a
    // narrow blend in between; cells only partly on the disc anti-alias the limb.
    const k = smoothstep(0.25, 0.6, land / n);
    const v = (k * landV + (1 - k) * seaV) * Math.sqrt(n / SAMPLES);
    const si = Math.round(Math.min(1, v) * SHADE_MAX);
    // Graticule lines take the accent colour so they never read as land.
    cellBuf[cell] = grid >= 2 && land * 2 < n ? TINT | Math.max(si, 2) : si;
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

export const AsciiGlobe = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const metricsRef = useRef({ cw: 6.6, lh: 12 });
  // Precomputed fillStyle strings for each cell value.
  // Rebuilt once on init and whenever the CSS colors change (theme switch).
  const paletteRef = useRef(null);
  // Longitude facing the viewer, and how far the north pole tips towards it.
  const lonRef = useRef(START_LON);
  const tiltRef = useRef(TILT);
  const tiltTargetRef = useRef(TILT);
  // Extra spin speed from mouse nudges (rad/s), the speed it eases towards,
  // and the signed horizontal distance the mouse travelled since the last
  // frame (in viewport widths).
  const nudgeRef = useRef(0);
  const nudgeTargetRef = useRef(0);
  const mouseTravelRef = useRef(0);
  const lastTimeRef = useRef(null);
  const rectRef = useRef({ cy: 0 });
  const rafRef = useRef(null);
  // Live click bursts (see ascii-click-shatter.js).
  const burstsRef = useRef([]);
  // When the entrance started (see ascii-assemble.js): null until the canvas
  // first scrolls into view, 0 once it has played.
  const introRef = useRef(null);
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

  // Respect prefers-reduced-motion: the globe is a permanent rAF loop, so a
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

  // Horizontal mouse movement nudges the spin; the mouse height relative to
  // the globe tilts it a little. The globe's viewport position is cached and
  // recomputed only on scroll/resize, NOT on mousemove (which would force a
  // layout during scroll and cause jank).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const readRect = () => {
      const rect = el.getBoundingClientRect();
      rectRef.current.cy = rect.top + rect.height / 2;
    };
    readRect();

    // Coalesce rect reads to at most one per animation frame. Reading
    // getBoundingClientRect() synchronously on every scroll event forces a
    // layout flush per event; near the bottom of a long page the scroll events
    // fire densely and interleave with the canvas RAF, tanking the framerate.
    let rectScheduled = false;
    const scheduleRect = () => {
      if (rectScheduled) return;
      rectScheduled = true;
      requestAnimationFrame(() => {
        rectScheduled = false;
        readRect();
      });
    };

    let lastX = null;
    const onMouseMove = (e) => {
      if (lastX !== null) {
        mouseTravelRef.current += (e.clientX - lastX) / window.innerWidth;
      }
      lastX = e.clientX;
      // Above the globe, look down on it a little more; below, a little less.
      const above = (rectRef.current.cy - e.clientY) / window.innerHeight;
      tiltTargetRef.current = TILT + TILT_RANGE * clamp(above * 2, -1, 1);
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

  // Use native mousedown instead of React onClick so the burst starts on
  // press, before the next animation frame is drawn.
  useEffect(() => {
    const div = containerRef.current;
    if (!div) return;
    const onMouseDown = (e) => {
      const canvas = canvasRef.current;
      if (!canvas || reducedMotionRef.current) return;
      const rect = canvas.getBoundingClientRect();
      burstsRef.current.push({
        gx: ((e.clientX - rect.left) / rect.width) * W,
        gy: ((e.clientY - rect.top) / rect.height) * H,
        startTime: Date.now(),
        seed: Math.floor(Math.random() * 1e6),
      });
    };
    div.addEventListener('mousedown', onMouseDown);
    return () => div.removeEventListener('mousedown', onMouseDown);
  }, [W, H]);

  // Build precomputed fillStyle strings from the --text-primary (globe) and
  // --accent-color (graticule, atmosphere) CSS variables. Reading the variables
  // directly is more reliable than getComputedStyle(canvas).color because
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
      // which tanks the framerate when the globe first enters the viewport.
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
    // or the globe would keep the previous theme's colors.
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

  // Draw exactly one frame at the current orientation, without advancing it
  // or scheduling another. Shared by the animation loop and the
  // reduced-motion path.
  const drawFrame = useCallback(() => {
    const geo = geometryRef.current;
    const lon0 = lonRef.current;
    const tilt = tiltRef.current;
    buildFrame(geo, W, H, lon0, tilt, cellBufRef.current);

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

  const animate = useCallback(
    (time) => {
      // Time-based, so the globe turns at the same pace on any refresh rate.
      // Capped so a long frame (or a tab coming back) doesn't jump it ahead.
      const last = lastTimeRef.current;
      const dt = last === null ? 0 : Math.min(0.05, (time - last) / 1000);
      lastTimeRef.current = time;

      // Mouse movement pushes the spin target, which then decays; the actual
      // speed eases towards it, so a nudge never jolts the globe.
      nudgeTargetRef.current = clamp(
        nudgeTargetRef.current * Math.exp(-dt / 1.5) +
          mouseTravelRef.current * 8 * SPIN,
        -NUDGE_MAX,
        NUDGE_MAX
      );
      mouseTravelRef.current = 0;
      nudgeRef.current +=
        (nudgeTargetRef.current - nudgeRef.current) * (1 - Math.exp(-dt / 0.5));
      tiltRef.current +=
        (tiltTargetRef.current - tiltRef.current) * (1 - Math.exp(-dt / 1.2));
      // Eastward rotation: the near side moves left to right.
      lonRef.current =
        (lonRef.current - (SPIN + nudgeRef.current) * dt) % (2 * Math.PI);

      drawFrame();
      rafRef.current = requestAnimationFrame(animate);
    },
    [drawFrame]
  );

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
      lastTimeRef.current = null;
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
