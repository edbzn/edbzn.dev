import React, { useEffect, useRef, useState, useCallback } from 'react';

// Shading ramp from dark to bright
const SHADE = ' .,:;=~+*#';

// Badge text layout in face-local coordinates
const ALPINISM_WORDS = [
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
];

function pickTwo(words) {
  const a = Math.floor(Math.random() * words.length);
  let b = Math.floor(Math.random() * (words.length - 1));
  if (b >= a) b++;
  return [words[a], words[b]];
}

function buildFaceText(w1, w2) {
  const gap1 = Math.min(0.045, 0.28 / Math.max(w1.length - 1, 1));
  const gap2 = Math.min(0.045, 0.28 / Math.max(w2.length - 1, 1));
  return [
    { text: w1, y: -0.06, gap: gap1 },
    { text: w2, y: 0.12, gap: gap2 },
  ];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function norm(v) {
  const len = Math.sqrt(dot(v, v)) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

// Pointy-top hexagon vertices (matching Nx badge orientation)
function hexVertices(r) {
  const v = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2; // pointy top
    v.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return v;
}

// Build a thin hexagonal prism (badge shape)
function buildPrism(radius, thickness) {
  const hex = hexVertices(radius);
  const pts = [];
  // Front face: indices 0-5
  for (const [x, y] of hex) pts.push([x, y, thickness / 2]);
  // Back face: indices 6-11
  for (const [x, y] of hex) pts.push([x, y, -thickness / 2]);
  return pts;
}

function rotatePoint(p, ax, ay) {
  // Rotate around X
  let [x, y, z] = p;
  let cy = Math.cos(ax),
    sy = Math.sin(ax);
  let y2 = y * cy - z * sy;
  let z2 = y * sy + z * cy;
  // Rotate around Y
  let cx = Math.cos(ay),
    sx = Math.sin(ay);
  let x2 = x * cx + z2 * sx;
  let z3 = -x * sx + z2 * cx;
  return [x2, y2, z3];
}

// Scanline fill a convex polygon into the buffer
function fillPoly(buf, zBuf, verts2d, avgZ, charIdx, w, h) {
  let minY = h,
    maxY = 0;
  for (const v of verts2d) {
    if (v[1] < minY) minY = v[1];
    if (v[1] > maxY) maxY = v[1];
  }
  minY = Math.max(0, Math.floor(minY));
  maxY = Math.min(h - 1, Math.ceil(maxY));
  const n = verts2d.length;

  for (let row = minY; row <= maxY; row++) {
    let xMin = w,
      xMax = 0;
    for (let i = 0; i < n; i++) {
      const [x0, y0] = verts2d[i];
      const [x1, y1] = verts2d[(i + 1) % n];
      if ((y0 <= row && y1 > row) || (y1 <= row && y0 > row)) {
        const t = (row - y0) / (y1 - y0);
        const x = x0 + t * (x1 - x0);
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
      }
    }
    const sx = Math.max(0, Math.floor(xMin));
    const ex = Math.min(w - 1, Math.ceil(xMax));
    for (let col = sx; col <= ex; col++) {
      const idx = row * w + col;
      if (avgZ < zBuf[idx]) {
        zBuf[idx] = avgZ;
        buf[idx] = charIdx;
      }
    }
  }
}

// Draw a line with Bresenham
function drawEdge(buf, zBuf, x0, y0, z0, x1, y1, z1, charIdx, w, h) {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0),
    dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1,
    sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  const steps = Math.max(dx, dy) || 1;
  let cx = x0,
    cy = y0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const z = z0 + (z1 - z0) * t;
    if (cx >= 0 && cx < w && cy >= 0 && cy < h) {
      const idx = cy * w + cx;
      if (z <= zBuf[idx]) {
        zBuf[idx] = z;
        buf[idx] = charIdx;
      }
    }
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      cx += sx;
    }
    if (e2 < dx) {
      err += dx;
      cy += sy;
    }
  }
}

function projectPoint(p, dist, W, H, ASPECT) {
  const s = dist / (dist + p[2]);
  return [p[0] * s * (H * ASPECT) + W / 2, p[1] * s * H + H / 2, p[2]];
}

function renderFrame(ax, ay, W, H, frontText, backText) {
  const buf = new Array(W * H).fill(0);
  const zBuf = new Array(W * H).fill(Infinity);

  const radius = 0.5;
  const thickness = 0.07;
  const dist = 3.2;
  const ASPECT = 2.0;

  const pts3d = buildPrism(radius, thickness);

  // Apply rotation
  const rotated = pts3d.map((p) => rotatePoint(p, ax, ay));

  // Project to screen
  const proj = rotated.map((p) => projectPoint(p, dist, W, H, ASPECT));

  // Define faces: front hex (0-5), back hex (6-11), 6 side quads
  const frontFace = [0, 1, 2, 3, 4, 5];
  const backFace = [6, 7, 8, 9, 10, 11];
  const sides = [];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    sides.push([i, j, j + 6, i + 6]);
  }

  const light = norm([0.3, -0.5, -1]);

  // Collect visible faces
  const faces = [];

  const addFace = (indices) => {
    const p = indices.map((i) => rotated[i]);
    const n = norm(cross(sub(p[1], p[0]), sub(p[2], p[0])));
    const facing = dot(n, [0, 0, -1]);
    if (facing <= 0) return;
    const avgZ =
      indices.reduce((s, i) => s + rotated[i][2], 0) / indices.length;
    const brightness = Math.max(0, dot(n, light));
    const ci = Math.min(
      SHADE.length - 2,
      Math.floor(brightness * (SHADE.length - 1))
    );
    faces.push({ indices, avgZ, charIdx: Math.max(1, ci) });
  };

  addFace(frontFace);
  addFace([...backFace].reverse());
  for (const s of sides) addFace(s);

  // Painter's sort back-to-front
  faces.sort((a, b) => b.avgZ - a.avgZ);

  for (const f of faces) {
    const verts = f.indices.map((i) => [proj[i][0], proj[i][1]]);
    fillPoly(buf, zBuf, verts, f.avgZ, f.charIdx, W, H);
  }

  // Draw edges
  const edgeCharIdx = SHADE.length - 1;
  const allEdges = [];
  for (let i = 0; i < 6; i++) {
    allEdges.push([i, (i + 1) % 6]);
    allEdges.push([i + 6, ((i + 1) % 6) + 6]);
    allEdges.push([i, i + 6]);
  }
  for (const [a, b] of allEdges) {
    drawEdge(
      buf,
      zBuf,
      proj[a][0],
      proj[a][1],
      proj[a][2],
      proj[b][0],
      proj[b][1],
      proj[b][2],
      edgeCharIdx,
      W,
      H
    );
  }

  // Convert shade buffer to character buffer
  const charBuf = buf.map((idx) => SHADE[idx]);

  // Overlay text on faces
  const frontNormal = rotatePoint([0, 0, 1], ax, ay);
  const frontFacing = -frontNormal[2];
  const backFacing = frontNormal[2];

  const stampText = (lines, zOffset) => {
    // Determine if text X-axis is flipped by checking projected direction
    const originProj = projectPoint(
      rotatePoint([0, 0, zOffset], ax, ay),
      dist,
      W,
      H,
      ASPECT
    );
    const rightProj = projectPoint(
      rotatePoint([0.01, 0, zOffset], ax, ay),
      dist,
      W,
      H,
      ASPECT
    );
    const xFlipped = rightProj[0] < originProj[0];

    for (const line of lines) {
      const text = xFlipped
        ? line.text.split('').reverse().join('')
        : line.text;
      const n = text.length;
      const startU = (-(n - 1) * line.gap) / 2;
      for (let i = 0; i < n; i++) {
        const ch = text[i];
        if (ch === ' ') continue;
        const u = startU + i * line.gap;
        const p3d = rotatePoint([u, line.y, zOffset], ax, ay);
        const [sx, sy, sz] = projectPoint(p3d, dist, W, H, ASPECT);
        const col = Math.round(sx);
        const row = Math.round(sy);
        if (col >= 0 && col < W && row >= 0 && row < H) {
          const idx = row * W + col;
          if (sz <= zBuf[idx] + 0.05) {
            charBuf[idx] = ch;
          }
        }
      }
    }
  };

  // Front face
  if (frontFacing > 0.3) {
    stampText(frontText, thickness / 2 + 0.001);
  }

  // Back face
  if (backFacing > 0.3) {
    stampText(backText, -thickness / 2 - 0.001);
  }

  // Build output string
  let out = '';
  for (let r = 0; r < H; r++) {
    let line = '';
    for (let c = 0; c < W; c++) line += charBuf[r * W + c];
    out += line + '\n';
  }
  return out;
}

export const AsciiHexagon = () => {
  const [frame, setFrame] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  const angleRef = useRef({ x: 0.35, y: 0 });
  const rafRef = useRef(null);
  const wordsRef = useRef({
    front: buildFaceText(...pickTwo(ALPINISM_WORDS)),
    back: buildFaceText(...pickTwo(ALPINISM_WORDS)),
    lastSwap: 0,
  });

  const W = 56;
  const H = 24;

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

  const animate = useCallback(() => {
    const now = Date.now();
    // Pick new words every 8 seconds
    if (now - wordsRef.current.lastSwap > 8000) {
      wordsRef.current.front = buildFaceText(...pickTwo(ALPINISM_WORDS));
      wordsRef.current.back = buildFaceText(...pickTwo(ALPINISM_WORDS));
      wordsRef.current.lastSwap = now;
    }
    const rendered = renderFrame(
      angleRef.current.x,
      angleRef.current.y,
      W,
      H,
      wordsRef.current.front,
      wordsRef.current.back
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
  minHeight: '180px',
  overflow: 'hidden',
  userSelect: 'none',
};

const preStyle = {
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: '10px',
  lineHeight: '11px',
  letterSpacing: '1.5px',
  color: 'var(--text-primary)',
  margin: 0,
  padding: 0,
  whiteSpace: 'pre',
  opacity: 0.9,
};
