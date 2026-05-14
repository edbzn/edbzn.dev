import React, { useEffect, useRef, useState, useCallback } from 'react';

// Shading ramp from dark to bright
const SHADE = ' .,-~:;=!*#$@';
const SHADE_CODES = new Uint8Array([...SHADE].map((c) => c.charCodeAt(0)));
const SPACE_CODE = 32;

// Reverse lookup: char code → shade index (0 = space/dimmest, 12 = brightest)
const CHAR_TO_SHADE = new Map();
for (let i = 0; i < SHADE.length; i++) {
  CHAR_TO_SHADE.set(SHADE.charCodeAt(i), i);
}

// Pre-computed opacity values for each shade level (0 = dimmest, 1 = brightest)
const SHADE_OPACITY_VALUES = (() => {
  const values = [];
  const len = SHADE.length / 2 + 1; // more levels in the darker half for better contrast
  for (let i = 0; i < len; i++) {
    values.push(i / (len - 1));
  }
  return values;
})();

// Pre-computed single-char strings — avoids String.fromCharCode allocation per frame.
const CHAR_STRINGS = new Array(128);
for (let i = 0; i < 128; i++) CHAR_STRINGS[i] = String.fromCharCode(i);

function buildFrame(ax, ay, W, H, mx, my, charBuf) {
  const ASPECT = 1.8;
  const R = 1.0;
  const lxRaw = 0.3 + mx;
  const lyRaw = -0.5 + my;
  const lzRaw = 1.0;
  const lLen = Math.sqrt(lxRaw * lxRaw + lyRaw * lyRaw + lzRaw * lzRaw) || 1;
  const lx = lxRaw / lLen;
  const ly = lyRaw / lLen;
  const lz = lzRaw / lLen;

  const cosA = Math.cos(ax),
    sinA = Math.sin(ax);
  const cosB = Math.cos(ay),
    sinB = Math.sin(ay);

  charBuf.fill(SPACE_CODE);

  const scale = H / 2;
  const halfW = W / 2;
  const halfH = H / 2;
  const shadeMax = SHADE_CODES.length - 1;

  for (let row = 0; row < H; row++) {
    const vy = (row - halfH) / scale;
    const vy2 = vy * vy;
    const rowOff = row * W;
    for (let col = 0; col < W; col++) {
      const vx = (col - halfW) / scale / ASPECT;
      const d2 = vx * vx + vy2;
      if (d2 > R * R) continue;

      const vz = Math.sqrt(R * R - d2);
      const nx = vx / R,
        ny = vy / R,
        nz = vz / R;

      const t1x = nx * cosB + nz * sinB;
      const t1z = -nx * sinB + nz * cosB;
      const wnx = t1x;
      const wny = ny * cosA + t1z * sinA;
      const wnz = -ny * sinA + t1z * cosA;

      const dot = wnx * lx + wny * ly + wnz * lz;
      const lum = (dot + 1) * 0.5;
      const shade = 0.1 + 0.9 * lum;
      let si = (shade * SHADE_CODES.length) | 0;
      if (si > shadeMax) si = shadeMax;

      // Soft edge fade: no hard circular rim — outer cells dissolve smoothly
      const edgeFade = Math.pow(1.0 - d2, 2.0);

      // Drifting fog mask: two overlapping sine waves create organic moving patches.
      // ax/ay grow with time, so the mask shifts as the sphere rotates.
      // Using two waves (not three) so the product doesn't go deeply negative too often.
      const fog =
        Math.sin(vx * 2.6 + ax * 0.4) * Math.cos(vy * 2.0 - ay * 0.25);
      // Cells where fog < -0.85 are hidden; smooth ramp up to fully visible.
      // High bias (0.85) means only the deepest negative patches disappear → ~90% visible.
      const fogMask = Math.min(1.0, Math.max(0, fog + 0.85) * 2.0);

      const visibility = edgeFade * fogMask;
      if (visibility < 0.05) continue;

      si = Math.min(shadeMax, Math.round(si * visibility));
      if (si <= 0) continue;

      charBuf[rowOff + col] = SHADE_CODES[si];
    }
  }
}

// Wave distortion: radial displacement + brightness ripple at the wave front.
// Returns false when the effect has expired.
// gx/gy are in grid-column/row units. Distances are computed in pixel-normalized
// units (1 unit = charWidth) to keep the wave circular in pixel space.
function applyWaveDistortion(charBuf, distBuf, W, H, gx, gy, elapsed) {
  const SPHERE_ASPECT = 1.8; // lineHeight / charWidth — must match buildFrame
  const WAVE_SPEED = 10; // charWidth-units per second
  const WAVE_AMP = 4.0; // max radial displacement in column-units
  const WAVE_SIGMA = 3.0; // wave ring width — wider = softer
  const DURATION = 3.0;

  if (elapsed > DURATION) return false;

  const t = elapsed / DURATION;
  // Cubic ease-out: strong initial pulse, long gentle tail
  const decay = (1 - t) * (1 - t) * (1 - t);

  const waveFront = elapsed * WAVE_SPEED;

  distBuf.set(charBuf);

  // Pre-compute sphere membership for fast boundary checks.
  const ASPECT = 1.8;
  const scale = H / 2;
  const halfW = W / 2;
  const halfH = H / 2;

  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      // Skip cells outside the sphere — wave must not place chars there.
      const vx = (c - halfW) / scale / ASPECT;
      const vy = (r - halfH) / scale;
      if (vx * vx + vy * vy > 1.0) continue;

      const dcol = c - gx;
      const drow = r - gy;
      // Convert to pixel-normalised coords (charWidth = 1 unit)
      const dx = dcol;
      const dy = drow * SPHERE_ASPECT;
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
      const ny = dy / dist / SPHERE_ASPECT; // row units

      const srcC = Math.round(c - nx * disp);
      const srcR = Math.round(r - ny * disp);

      if (srcC < 0 || srcC >= W || srcR < 0 || srcR >= H) {
        charBuf[r * W + c] = SPACE_CODE;
        continue;
      }

      const srcCode = distBuf[srcR * W + srcC];
      charBuf[r * W + c] = srcCode;

      // Smooth brightness ripple at the wave crest (no random scatter)
      if (srcCode !== SPACE_CODE) {
        const shadeIdx = CHAR_TO_SHADE.get(srcCode) ?? 0;
        const boost = Math.round(5 * envelope * decay);
        if (boost > 0) {
          const boostedIdx = Math.min(SHADE_CODES.length - 1, shadeIdx + boost);
          charBuf[r * W + c] = SHADE_CODES[boostedIdx];
        }
      }
    }
  }
  return true;
}

// Render charBuf directly onto a canvas context — zero string allocation per frame.
// shadeColors: precomputed fillStyle string per shade index (length = SHADE.length).
function renderFrame(ctx, charBuf, W, H, cw, lh, shadeColors) {
  ctx.clearRect(0, 0, W * cw, H * lh);
  let currentShade = -1;
  for (let r = 0; r < H; r++) {
    const rowOff = r * W;
    const y = r * lh;
    for (let c = 0; c < W; c++) {
      const code = charBuf[rowOff + c];
      if (code === SPACE_CODE) continue;
      const si = CHAR_TO_SHADE.get(code) ?? SHADE.length - 1;
      if (si !== currentShade) {
        ctx.fillStyle = shadeColors[si];
        currentShade = si;
      }
      ctx.fillText(CHAR_STRINGS[code], c * cw, y);
    }
  }
}

export const AsciiSphere = () => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const metricsRef = useRef({ cw: 6.6, lh: 12 });
  // Precomputed fillStyle strings for each shade level.
  // Rebuilt once on init and whenever the CSS color changes (theme switch).
  const shadeColorsRef = useRef(null);
  const angleRef = useRef({ x: 0.35, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const rectRef = useRef({ cx: 0, cy: 0 });
  const rafRef = useRef(null);
  const clickWaveRef = useRef(null);

  const W = 44;
  const H = 22;
  const charBufRef = useRef(new Uint8Array(W * H));
  const distBufRef = useRef(new Uint8Array(W * H));

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

    const updateRect = () => {
      const rect = el.getBoundingClientRect();
      rectRef.current.cx = rect.left + rect.width / 2;
      rectRef.current.cy = rect.top + rect.height / 2;
    };
    updateRect();

    const onMouseMove = (e) => {
      const { cx, cy } = rectRef.current;
      mouseTargetRef.current.x = ((e.clientX - cx) / window.innerWidth) * 2;
      mouseTargetRef.current.y = ((e.clientY - cy) / window.innerHeight) * 2;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', updateRect, { passive: true });
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
    };
  }, []);

  // Use native mousedown instead of React onClick so the event fires before
  // pre.innerHTML is replaced by the next animation frame (which would swallow
  // clicks on the span characters).
  useEffect(() => {
    const div = containerRef.current;
    if (!div) return;
    const onMouseDown = (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const gx = ((e.clientX - rect.left) / rect.width) * W;
      const gy = ((e.clientY - rect.top) / rect.height) * H;
      clickWaveRef.current = { gx, gy, startTime: Date.now() };
    };
    div.addEventListener('mousedown', onMouseDown);
    return () => div.removeEventListener('mousedown', onMouseDown);
  }, [W, H]);

  // Build precomputed fillStyle strings from the --text-primary CSS variable.
  // Reading the variable directly is more reliable than getComputedStyle(canvas).color
  // because document.fonts.ready can fire before the stylesheet is parsed,
  // which would yield rgb(0,0,0) (invisible on dark background).
  const buildShadeColors = useCallback(() => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--text-primary')
      .trim();
    if (!raw) return false;
    // Parse hex (#rrggbb or #rgb) or rgb/rgba(...)
    let r, g, b;
    const hex = raw.match(/^#([0-9a-f]{3,8})$/i)?.[1];
    if (hex) {
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      }
    } else {
      const m = raw.match(/(\d+)/g);
      if (!m || m.length < 3) return false;
      [r, g, b] = m.map(Number);
    }
    // Reject black (likely means CSS variable not yet resolved)
    if (r === 0 && g === 0 && b === 0) return false;
    shadeColorsRef.current = SHADE_OPACITY_VALUES.map(
      (a) => `rgba(${r},${g},${b},${(a * 1.0).toFixed(3)})`
    );
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
      ctx.font = `${fs}px "Fira Code", "Courier New", Courier, monospace`;
      ctx.textBaseline = 'top';
      const cw = ctx.measureText('M').width;
      metricsRef.current = { cw, lh };
      canvas.width = Math.round(W * cw * dpr);
      canvas.height = Math.round(H * lh * dpr);
      canvas.style.width = `${Math.round(W * cw)}px`;
      canvas.style.height = `${Math.round(H * lh)}px`;
      ctx.scale(dpr, dpr);
      ctx.font = `${fs}px "Fira Code", "Courier New", Courier, monospace`;
      ctx.textBaseline = 'top';
      buildShadeColors();
    };
    document.fonts.ready.then(init);
    // Also try after full page load in case fonts.ready fires before CSS is parsed.
    window.addEventListener('load', () => buildShadeColors(), { once: true });

    // Update shade colors when the theme (CSS color) changes.
    const themeObserver = new MutationObserver(() => buildShadeColors());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
    return () => themeObserver.disconnect();
  }, [W, H, buildShadeColors]);

  const animate = useCallback(() => {
    const now = Date.now();
    const ease = 0.05;
    mouseRef.current.x +=
      (mouseTargetRef.current.x - mouseRef.current.x) * ease;
    mouseRef.current.y +=
      (mouseTargetRef.current.y - mouseRef.current.y) * ease;
    const mx = mouseRef.current.x * 0.05;
    const my = mouseRef.current.y * 0.03;

    buildFrame(
      angleRef.current.x + my,
      angleRef.current.y + mx,
      W,
      H,
      mouseRef.current.x,
      mouseRef.current.y,
      charBufRef.current
    );

    if (clickWaveRef.current) {
      const elapsed = (now - clickWaveRef.current.startTime) / 1000;
      const active = applyWaveDistortion(
        charBufRef.current,
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
    // Lazy fallback: if shadeColors weren't built yet (CSS loaded after fonts.ready),
    // try again now that the page is fully rendered.
    if (ctx && !shadeColorsRef.current) buildShadeColors();
    if (ctx && shadeColorsRef.current) {
      const { cw, lh } = metricsRef.current;
      renderFrame(
        ctx,
        charBufRef.current,
        W,
        H,
        cw,
        lh,
        shadeColorsRef.current
      );
    }
    angleRef.current.x += 0.004;
    angleRef.current.y += 0.008;
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isVisible) {
      rafRef.current = requestAnimationFrame(animate);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isVisible, animate]);

  return (
    <div ref={containerRef} style={containerStyle} aria-hidden="true">
      <canvas ref={canvasRef} style={canvasStyle} />
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
  cursor: 'pointer',
};
