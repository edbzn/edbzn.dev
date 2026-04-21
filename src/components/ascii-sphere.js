import React, { useEffect, useRef, useState, useCallback } from 'react';

// Shading ramp from dark to bright
const SHADE = ' .,-~:;=!*#$@';

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

function renderFrame(ax, ay, W, H, words, mx, my) {
  const ASPECT = 1.8; // Fira Code char aspect ratio without letter-spacing
  const R = 1.0;
  const light = normalize([0.3 + mx, -0.5 + my, 1.0]);

  const cosA = Math.cos(ax),
    sinA = Math.sin(ax);
  const cosB = Math.cos(ay),
    sinB = Math.sin(ay);

  const charBuf = new Array(W * H).fill(' ');
  const zBuf = new Array(W * H).fill(Infinity);

  // Step 1: Raycast sphere for shading
  const scale = H / 2;

  for (let row = 0; row < H; row++) {
    for (let col = 0; col < W; col++) {
      const vx = (col - W / 2) / scale / ASPECT;
      const vy = (row - H / 2) / scale;

      const d2 = vx * vx + vy * vy;
      if (d2 > R * R) continue;

      const vz = Math.sqrt(R * R - d2);
      const nx = vx / R,
        ny = vy / R,
        nz = vz / R;

      // Rotate normal from view space to world space (Ry^-1 then Rx^-1)
      // Ry^-1 first
      const t1x = nx * cosB + nz * sinB;
      const t1y = ny;
      const t1z = -nx * sinB + nz * cosB;
      // Rx^-1 second
      const wnx = t1x;
      const wny = t1y * cosA + t1z * sinA;
      const wnz = -t1y * sinA + t1z * cosA;

      // Half-lambert: maps dot [-1,1] → [0,1] with no hard terminator
      const dot = wnx * light[0] + wny * light[1] + wnz * light[2];
      const lum = (dot + 1) * 0.5;
      const shade = 0.1 + 0.9 * lum;
      const si = Math.min(SHADE.length - 1, Math.floor(shade * SHADE.length));

      const idx = row * W + col;
      charBuf[idx] = SHADE[si];
      zBuf[idx] = -vz;
    }
  }

  // Step 2: Flat horizontal text band at the equator, scrolling with rotation
  // Build a repeating text string from words
  const gap = '    ';
  const fullText = words.join(gap) + gap;
  const textLen = fullText.length;

  // The text row is the vertical center of the sphere
  const eqRow = Math.round(H / 2);

  // Scroll offset driven by the Y rotation angle
  // Map ay (radians) to character offset — one full rotation = one full text cycle
  const scrollOffset = (ay / (2 * Math.PI)) * textLen;

  // Sphere radius in columns at the equator row
  const rCols = Math.floor(R * scale * ASPECT);

  for (let dc = -rCols; dc <= rCols; dc++) {
    const col = Math.round(W / 2) + dc;
    if (col < 0 || col >= W) continue;

    // Check sphere exists at this pixel (equator row)
    const idx = eqRow * W + col;
    if (charBuf[idx] === ' ') continue; // outside sphere silhouette

    // Map column to text index
    // Normalize dc from [-rCols, rCols] to [0, textLen)
    const t = (dc + rCols) / (2 * rCols); // 0..1
    const ci =
      Math.floor(((t * textLen + scrollOffset) % textLen) + textLen) % textLen;
    const ch = fullText[ci];
    if (ch === ' ') continue;

    charBuf[idx] = ch;
  }

  let out = '';
  for (let r = 0; r < H; r++) {
    let line = '';
    for (let c = 0; c < W; c++) line += charBuf[r * W + c];
    out += line + '\n';
  }
  return out;
}

function normalize(v) {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function rotateToView(wx, wy, wz, cosA, sinA, cosB, sinB) {
  // Rx first
  const t1x = wx;
  const t1y = wy * cosA - wz * sinA;
  const t1z = wy * sinA + wz * cosA;
  // Ry second
  return [t1x * cosB - t1z * sinB, t1y, t1x * sinB + t1z * cosB];
}

export const AsciiSphere = () => {
  const [frame, setFrame] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  const angleRef = useRef({ x: 0.35, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const wordsRef = useRef({
    words: pickWords(),
    lastSwap: 0,
  });

  const W = 44;
  const H = 22;

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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId = 0;
    const onMouseMove = (e) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseTargetRef.current.x =
          ((e.clientX - centerX) / window.innerWidth) * 2;
        mouseTargetRef.current.y =
          ((e.clientY - centerY) / window.innerHeight) * 2;
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const animate = useCallback(() => {
    const now = Date.now();
    if (now - wordsRef.current.lastSwap > 8000) {
      wordsRef.current.words = pickWords();
      wordsRef.current.lastSwap = now;
    }
    // Ease mouse influence toward target
    const ease = 0.05;
    mouseRef.current.x +=
      (mouseTargetRef.current.x - mouseRef.current.x) * ease;
    mouseRef.current.y +=
      (mouseTargetRef.current.y - mouseRef.current.y) * ease;
    // Add mouse influence to rotation (subtle tilt)
    const mx = mouseRef.current.x * 0.3;
    const my = mouseRef.current.y * 0.2;
    const rendered = renderFrame(
      angleRef.current.x + my,
      angleRef.current.y + mx,
      W,
      H,
      wordsRef.current.words,
      mouseRef.current.x,
      mouseRef.current.y
    );
    setFrame(rendered);
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
      <pre style={preStyle}>{frame}</pre>
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
  margin: 0,
  padding: 0,
  whiteSpace: 'pre',
  opacity: 0.85,
  overflow: 'hidden',
};
