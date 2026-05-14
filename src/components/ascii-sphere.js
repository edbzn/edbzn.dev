import React, { useEffect, useRef, useState, useCallback } from 'react';

// Shading ramp from dark to bright
const SHADE = ' .,-~:;=!*#$@';
const SHADE_CODES = new Uint8Array([...SHADE].map((c) => c.charCodeAt(0)));
const SPACE_CODE = 32;
const NEWLINE_CODE = 10;

// Reverse lookup: char code → shade index (0 = space/dimmest, 12 = brightest)
const CHAR_TO_SHADE = new Map();
for (let i = 0; i < SHADE.length; i++) {
  CHAR_TO_SHADE.set(SHADE.charCodeAt(i), i);
}

// Pre-computed CSS opacity strings for each shade level (uses default text color)
const SHADE_OPACITIES = (() => {
  const opacities = [];
  const len = SHADE.length;
  for (let i = 0; i < len; i++) {
    const t = i / (len - 1); // 0 (dimmest) → 1 (brightest)
    const opacity = 0 + 1 * t;
    opacities.push(opacity.toFixed(2));
  }
  return opacities;
})();

const WORDS = [
  'CI/CD',
  'Docker',
  'Node',
  'Terraform',
  'Vim',
  'Zsh',
  'React',
  'Linux',
  'Bash',
  'Rust',
  'API',
  'Angular',
  'REST',
  'GraphQL',
  'TypeScript',
  'Monorepo',
  'K8s',
  'Nginx',
  'Redis',
  'Vite',
  'WASM',
  'OXC',
  'Agentic',
  'MCP',
  'Python',
  'Nx',
  'Esbuild',
  'Node.js',
  'Cloud',
  'Serverless',
  'Git',
  'Ansible',
  'MongoDB',
  'Qwik',
  'Vue.js',
  'Svelte',
  'SemVer',
];

function pickWords() {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6);
}

function buildFrame(ax, ay, W, H, words, mx, my, charBuf) {
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

      charBuf[rowOff + col] = SHADE_CODES[si];
    }
  }

  const gap = '    ';
  const fullText = words.join(gap) + gap;
  const textLen = fullText.length;
  const eqRow = Math.round(H / 2);
  const scrollOffset = (ay / (2 * Math.PI)) * textLen;
  const rCols = Math.floor(R * scale * ASPECT);
  const halfWRound = Math.round(W / 2);

  for (let dc = -rCols; dc <= rCols; dc++) {
    const col = halfWRound + dc;
    if (col < 0 || col >= W) continue;
    const idx = eqRow * W + col;
    if (charBuf[idx] === SPACE_CODE) continue;

    const t = (dc + rCols) / (2 * rCols);
    const ci =
      Math.floor(((t * textLen + scrollOffset) % textLen) + textLen) % textLen;
    const code = fullText.charCodeAt(ci);
    if (code === SPACE_CODE) continue;
    charBuf[idx] = code;
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

  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
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

function frameToHtml(charBuf, W, H) {
  // Build opacity-shaded HTML — group consecutive chars with same opacity into spans
  const parts = [];
  for (let r = 0; r < H; r++) {
    const rowOff = r * W;
    let currentColor = null;
    let run = '';

    for (let c = 0; c < W; c++) {
      const code = charBuf[rowOff + c];
      if (code === SPACE_CODE) {
        const color = '';
        if (color !== currentColor) {
          if (run)
            parts.push(
              currentColor && currentColor !== '1'
                ? `<span style="opacity:${currentColor}">${run}</span>`
                : run
            );
          run = '';
          currentColor = color;
        }
        run += ' ';
        continue;
      }

      const shadeIdx = CHAR_TO_SHADE.get(code);
      const color = shadeIdx !== undefined ? SHADE_OPACITIES[shadeIdx] : '1';

      if (color !== currentColor) {
        if (run)
          parts.push(
            currentColor && currentColor !== '1'
              ? `<span style="opacity:${currentColor}">${run}</span>`
              : run
          );
        run = '';
        currentColor = color;
      }
      run += String.fromCharCode(code);
    }
    if (run)
      parts.push(
        currentColor && currentColor !== '1'
          ? `<span style="opacity:${currentColor}">${run}</span>`
          : run
      );
    parts.push('\n');
  }
  return parts.join('');
}

export const AsciiSphere = () => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  const preRef = useRef(null);
  const angleRef = useRef({ x: 0.35, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const rectRef = useRef({ cx: 0, cy: 0 });
  const rafRef = useRef(null);
  const clickWaveRef = useRef(null);
  const wordsRef = useRef({
    words: pickWords(),
    lastSwap: 0,
  });

  const W = 44;
  const H = 22;
  const charBufRef = useRef(new Uint8Array(W * H));
  const distBufRef = useRef(new Uint8Array(W * H));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
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
      const pre = preRef.current;
      if (!pre) return;
      const rect = pre.getBoundingClientRect();
      const gx = ((e.clientX - rect.left) / rect.width) * W;
      const gy = ((e.clientY - rect.top) / rect.height) * H;
      clickWaveRef.current = { gx, gy, startTime: Date.now() };
    };
    div.addEventListener('mousedown', onMouseDown);
    return () => div.removeEventListener('mousedown', onMouseDown);
  }, [W, H]);

  const animate = useCallback(() => {
    const now = Date.now();
    if (now - wordsRef.current.lastSwap > 8000) {
      wordsRef.current.words = pickWords();
      wordsRef.current.lastSwap = now;
    }
    const ease = 0.05;
    mouseRef.current.x +=
      (mouseTargetRef.current.x - mouseRef.current.x) * ease;
    mouseRef.current.y +=
      (mouseTargetRef.current.y - mouseRef.current.y) * ease;
    const mx = mouseRef.current.x * 0.3;
    const my = mouseRef.current.y * 0.2;

    buildFrame(
      angleRef.current.x + my,
      angleRef.current.y + mx,
      W,
      H,
      wordsRef.current.words,
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

    const rendered = frameToHtml(charBufRef.current, W, H);
    // Write directly to the DOM — bypass React reconciliation every frame.
    const pre = preRef.current;
    if (pre) pre.innerHTML = rendered;
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
      <pre ref={preRef} style={preStyle} />
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

const preStyle = {
  fontFamily: '"Fira Code", "Courier New", Courier, monospace',
  fontSize: 'min(11px, 2.5vw)',
  lineHeight: 'min(12px, 2.8vw)',
  letterSpacing: 0,
  color: 'var(--text-primary)',
  textShadow: 'none',
  margin: 0,
  padding: 0,
  whiteSpace: 'pre',
  opacity: 0.85,
  overflow: 'hidden',
  cursor: 'pointer',
};
