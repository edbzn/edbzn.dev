import React, { useEffect, useRef, useState, useCallback } from 'react';

// Shading ramp from dark to bright
const SHADE = ' .,-~:;=!*#$@';
const SHADE_CODES = new Uint8Array([...SHADE].map((c) => c.charCodeAt(0)));
const SPACE_CODE = 32;
const NEWLINE_CODE = 10;

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

function renderFrame(ax, ay, W, H, words, mx, my, charBuf, outBuf) {
  const ASPECT = 1.8; // Fira Code char aspect ratio without letter-spacing
  const R = 1.0;
  // Inline normalize to avoid array alloc
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

  // Step 1: Raycast sphere for shading
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

      // Ry^-1 first
      const t1x = nx * cosB + nz * sinB;
      const t1z = -nx * sinB + nz * cosB;
      // Rx^-1 second (t1y === ny)
      const wnx = t1x;
      const wny = ny * cosA + t1z * sinA;
      const wnz = -ny * sinA + t1z * cosA;

      // Half-lambert
      const dot = wnx * lx + wny * ly + wnz * lz;
      const lum = (dot + 1) * 0.5;
      const shade = 0.1 + 0.9 * lum;
      let si = (shade * SHADE_CODES.length) | 0;
      if (si > shadeMax) si = shadeMax;

      charBuf[rowOff + col] = SHADE_CODES[si];
    }
  }

  // Step 2: Flat horizontal text band at the equator
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

  // Build output string in one pass via outBuf (Uint16Array of char codes + newlines)
  let o = 0;
  for (let r = 0; r < H; r++) {
    const rowOff = r * W;
    for (let c = 0; c < W; c++) {
      outBuf[o++] = charBuf[rowOff + c];
    }
    outBuf[o++] = NEWLINE_CODE;
  }
  return String.fromCharCode.apply(null, outBuf);
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
  const wordsRef = useRef({
    words: pickWords(),
    lastSwap: 0,
  });

  const W = 44;
  const H = 22;
  // Reusable buffers — never reallocated per frame
  const charBufRef = useRef(new Uint8Array(W * H));
  const outBufRef = useRef(new Uint16Array(W * H + H)); // +H newlines

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
    const rendered = renderFrame(
      angleRef.current.x + my,
      angleRef.current.y + mx,
      W,
      H,
      wordsRef.current.words,
      mouseRef.current.x,
      mouseRef.current.y,
      charBufRef.current,
      outBufRef.current
    );
    // Write directly to the DOM — bypass React reconciliation every frame.
    const pre = preRef.current;
    if (pre) pre.textContent = rendered;
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
};
