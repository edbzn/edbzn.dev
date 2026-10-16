/**
 * Generates the cover banner of each blog post: a minimal 1200×500 SVG
 * (no text) drawn from math, physics or space objects, written to
 * `content/blog/<slug>/cover.svg` and referenced by the post's `cover`.
 *
 * The SVGs have no background and use white and grey only: the blog list
 * paints the tile per theme and inverts the shapes for the light theme.
 * The subject of each drawing stays within the middle 800px, so the list's
 * 1.6:1 thumbnail crop shows all of it.
 *
 * Usage: node scripts/generate-banners.js
 */

const fs = require('node:fs');
const path = require('node:path');

const W = 1200;
const H = 500;
const C = {
  blue: '#8f8f8f',
  amber: '#ffffff',
  dim: 'rgba(255, 255, 255, 0.16)',
  line: 'rgba(255, 255, 255, 0.22)',
};

const svg = (body) =>
  [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    ...body,
    `</svg>`,
    '',
  ].join('\n');

// One changed library (amber) lights up only the projects that depend on it.
function affected() {
  const nodes = {
    a: [330, 150, 'changed'],
    b: [330, 250, 'idle'],
    c: [330, 350, 'idle'],
    d: [600, 200, 'affected'],
    e: [600, 300, 'idle'],
    f: [870, 150, 'affected'],
    g: [870, 250, 'affected'],
    h: [870, 350, 'idle'],
  };
  const edges = [
    ['a', 'd'],
    ['b', 'd'],
    ['b', 'e'],
    ['c', 'e'],
    ['d', 'f'],
    ['d', 'g'],
    ['e', 'g'],
    ['e', 'h'],
  ];
  const lit = (n) => nodes[n][2] !== 'idle';
  const r = 30;
  const body = [];
  for (const [from, to] of edges) {
    const [ax, ay] = nodes[from];
    const [bx, by] = nodes[to];
    const d = Math.hypot(bx - ax, by - ay);
    const [ux, uy] = [(bx - ax) / d, (by - ay) / d];
    const [x1, y1, x2, y2] = [
      ax + ux * r,
      ay + uy * r,
      bx - ux * r,
      by - uy * r,
    ];
    const on = lit(from) && lit(to);
    body.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${on ? C.blue : C.line}" stroke-width="${on ? 5 : 3}" stroke-linecap="round"/>`
    );
  }
  for (const [x, y, state] of Object.values(nodes)) {
    const fill = { changed: C.amber, affected: C.blue, idle: 'none' }[state];
    const stroke =
      state === 'idle' ? `stroke="${C.line}" stroke-width="3"` : '';
    body.push(
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${stroke}/>`
    );
  }
  return svg(body);
}

// --- Space and atom helpers ---------------------------------------------

const DARK = 'rgba(255, 255, 255, 0.1)';
const ORBIT = 'rgba(255, 255, 255, 0.3)';
const rad = (deg) => (deg * Math.PI) / 180;

const circle = (cx, cy, r, fill, extra = '') =>
  `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${fill}" ${extra}/>`;

const orbit = (cx, cy, rx, ry, rot = 0, extra = '') =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="none" stroke="${ORBIT}" stroke-width="3" ${extra}/>`;

// Point at angle `t` (degrees) on an ellipse rotated by `rot` degrees.
const onOrbit = (cx, cy, rx, ry, rot, t) => {
  const x = rx * Math.cos(rad(t));
  const y = ry * Math.sin(rad(t));
  return [
    cx + x * Math.cos(rad(rot)) - y * Math.sin(rad(rot)),
    cy + x * Math.sin(rad(rot)) + y * Math.cos(rad(rot)),
  ];
};

// A sphere lit from one side: `shadow` shifts the dark disc across it
// (0 = new, ~2r = full). Negative values light the left side.
let clipId = 0;
const litSphere = (cx, cy, r, shadow, lit = C.blue) => {
  const id = `s${clipId++}`;
  return [
    `<mask id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/><circle cx="${cx - shadow}" cy="${cy}" r="${r}" fill="#000"/></mask>`,
    circle(cx, cy, r, DARK),
    circle(cx, cy, r, lit, `mask="url(#${id})"`),
    circle(cx, cy, r, 'none', `stroke="${ORBIT}" stroke-width="3"`),
  ];
};

// Atom: nucleus + orbits, one electron per orbit.
const atom = (
  cx,
  cy,
  { rx, ry, rots, electrons, nucleus = C.amber, nr = 30 }
) => [
  ...rots.map((rot) => orbit(cx, cy, rx, ry, rot)),
  circle(cx, cy, nr, nucleus),
  ...rots.map((rot, i) =>
    circle(...onOrbit(cx, cy, rx, ry, rot, electrons[i]), 13, C.blue)
  ),
];

// --- Banners ---------------------------------------------------------------

const f = (n) => n.toFixed(1);
const dotted = (x1, y1, x2, y2, extra = '') =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${ORBIT}" stroke-width="4" stroke-dasharray="2 14" stroke-linecap="round" ${extra}/>`;
const bond = (x1, y1, x2, y2, width = 6) =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${ORBIT}" stroke-width="${width}" stroke-linecap="round"/>`;

// Four-pointed star.
const sparkle = (x, y, s, fill) =>
  `<path d="M ${x} ${y - s} Q ${x} ${y} ${x + s} ${y} Q ${x} ${y} ${x} ${y + s} Q ${x} ${y} ${x - s} ${y} Q ${x} ${y} ${x} ${y - s} Z" fill="${fill}"/>`;

// One codebase (the star), one planet per platform.
function crossPlatformSetup() {
  const [cx, cy, rot] = [600, 250, -8];
  const orbits = [
    [130, 46, 35, 14],
    [215, 76, 205, 19],
    [300, 106, 320, 24],
  ];
  return svg([
    ...orbits.map(([rx, ry]) => orbit(cx, cy, rx, ry, rot)),
    circle(cx, cy, 40, C.amber),
    ...orbits.map(([rx, ry, t, r]) =>
      circle(...onOrbit(cx, cy, rx, ry, rot, t), r, C.blue)
    ),
  ]);
}

// Virtual scroll: a long feed, only the items in view are rendered.
function socialFeed() {
  const body = [];
  const n = 11;
  const step = 88;
  const x = (i) => 600 + (i - (n - 1) / 2) * step;
  const visible = (i) => i >= 4 && i <= 6;
  body.push(
    `<rect x="${x(4) - 52}" y="${250 - 58}" width="${x(6) - x(4) + 104}" height="116" rx="58" fill="none" stroke="${ORBIT}" stroke-width="3"/>`
  );
  for (let i = 0; i < n; i++) {
    if (visible(i)) {
      body.push(circle(x(i), 250, 30, i === 6 ? C.amber : C.blue));
    } else {
      const fade = 1 - Math.abs(i - 5) / 7;
      body.push(
        circle(
          x(i),
          250,
          24,
          'none',
          `stroke="${ORBIT}" stroke-width="3" opacity="${f(fade)}"`
        )
      );
    }
  }
  return svg(body);
}

// An observable feeding its subscribers: values travel down each
// subscription. The bottom one was unsubscribed: it stops at a teardown bar,
// and nothing flows past it to its (now empty) subscriber.
function subscriptions() {
  const [sx, sy] = [340, 250];
  const subscribers = [
    [860, 130, true],
    [890, 250, true],
    [860, 370, false],
  ];
  const r = 22;
  // Quadratic Bezier from the source to (bx, by): the three fan out right
  // away, then ease into their subscriber.
  const curve = (bx, by) => {
    const [p0, c, p1] = [
      [sx, sy],
      [sx + (bx - sx) * 0.45, sy + (by - sy) * 0.35],
      [bx - r - 6, by],
    ];
    const at = (t) =>
      [0, 1].map(
        (k) => (1 - t) ** 2 * p0[k] + 2 * (1 - t) * t * c[k] + t * t * p1[k]
      );
    const tangent = (t) =>
      [0, 1].map((k) => 2 * (1 - t) * (c[k] - p0[k]) + 2 * t * (p1[k] - c[k]));
    // Control points of the [0, t] and [t, 1] halves (de Casteljau).
    const split = (t) => [
      [0, 1].map((k) => p0[k] + t * (c[k] - p0[k])),
      [0, 1].map((k) => c[k] + t * (p1[k] - c[k])),
    ];
    return { p0, c, p1, at, tangent, split };
  };
  const path = (from, ctrl, to, extra) =>
    `<path d="M ${f(from[0])} ${f(from[1])} Q ${f(ctrl[0])} ${f(ctrl[1])} ${f(to[0])} ${f(to[1])}" fill="none" ${extra}/>`;

  const body = [];
  subscribers.forEach(([bx, by, live], i) => {
    const k = curve(bx, by);
    const cut = 0.5;
    if (live) {
      body.push(path(k.p0, k.c, k.p1, `stroke="${C.line}" stroke-width="3"`));
    } else {
      // Teardown: the line ends at a bar across it, then only a faint
      // dashed trace remains.
      const mid = k.at(cut);
      const [c0, c1] = k.split(cut);
      body.push(path(k.p0, c0, mid, `stroke="${C.line}" stroke-width="3"`));
      body.push(
        path(
          mid,
          c1,
          k.p1,
          `stroke="${C.dim}" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"`
        )
      );
      const [tx, ty] = k.tangent(cut);
      const len = Math.hypot(tx, ty);
      const [nx, ny] = [(-ty / len) * 28, (tx / len) * 28];
      body.push(
        `<line x1="${f(mid[0] + nx)}" y1="${f(mid[1] + ny)}" x2="${f(mid[0] - nx)}" y2="${f(mid[1] - ny)}" stroke="${C.amber}" stroke-width="6" stroke-linecap="round"/>`
      );
    }
    // Values in flight, only up to the teardown on the cut subscription.
    const stops = live ? [0.3, 0.5, 0.7, 0.88] : [0.24, 0.4];
    stops.forEach((t, j) => {
      const [x, y] = k.at(t + i * 0.03);
      body.push(circle(x, y, 9, j % 2 ? C.blue : C.amber));
    });
    body.push(
      live
        ? circle(bx, by, r, C.blue)
        : circle(bx, by, r, 'none', `stroke="${C.line}" stroke-width="3"`)
    );
  });
  body.push(
    circle(sx, sy, 56, 'none', `stroke="${ORBIT}" stroke-width="3"`),
    circle(sx, sy, 36, C.amber)
  );
  return svg(body);
}

// ES modules bonded straight to the entry module: no bundle in between.
function nobuild() {
  const atoms = {
    main: [540, 250, 34, C.amber],
    a: [390, 150, 24, C.blue],
    b: [370, 340, 22, C.blue],
    c: [700, 150, 26, C.blue],
    d: [710, 345, 24, C.blue],
    e: [860, 250, 20, C.blue],
  };
  const bonds = [
    ['main', 'a'],
    ['main', 'b'],
    ['main', 'c'],
    ['main', 'd'],
    ['c', 'e'],
    ['d', 'e'],
  ];
  return svg([
    ...bonds.map(([p, q]) =>
      bond(atoms[p][0], atoms[p][1], atoms[q][0], atoms[q][1])
    ),
    ...Object.values(atoms).map(([x, y, r, fill]) => circle(x, y, r, fill)),
  ]);
}

// Project references: a constellation.
function projectReferences() {
  const stars = [
    [300, 310, 16],
    [410, 190, 20],
    [540, 260, 30],
    [660, 140, 18],
    [720, 300, 22],
    [850, 210, 18],
    [920, 340, 14],
  ];
  const links = [
    [0, 1],
    [1, 2],
    [2, 3],
    [2, 4],
    [4, 5],
    [4, 6],
  ];
  return svg([
    ...links.map(([p, q]) =>
      bond(stars[p][0], stars[p][1], stars[q][0], stars[q][1], 2)
    ),
    ...stars.map(([x, y, s], i) =>
      sparkle(x, y, s, i === 2 ? C.amber : C.blue)
    ),
  ]);
}

// Each state is a new snapshot, never a mutation: a row of moon phases.
function immutableStore() {
  const r = 56;
  const phases = [0.35, 0.75, 1.15, 1.6]; // shadow shift, in radii
  const body = phases.flatMap((p, i) =>
    litSphere(600 + (i - 2) * 175, 250, r, -p * r)
  );
  body.push(circle(600 + 2 * 175, 250, r, C.amber)); // the current state
  return svg(body);
}

// Elements placed by a function, not a template: a phyllotaxis galaxy.
function vueRender() {
  const body = [];
  const n = 150;
  for (let i = 1; i < n; i++) {
    const r = 14.5 * Math.sqrt(i);
    const a = i * 137.508;
    const [x, y] = onOrbit(600, 250, r, r, 0, a);
    body.push(
      circle(
        x,
        y,
        (2.5 + (i / n) * 5).toFixed(1),
        C.blue,
        `opacity="${(0.35 + (i / n) * 0.65).toFixed(2)}"`
      )
    );
  }
  body.push(circle(600, 250, 12, C.amber));
  return svg(body);
}

// Two atoms whose orbits overlap: a name collision.
function vueMixins() {
  const opts = { rx: 170, ry: 50, nr: 24, nucleus: C.blue };
  const body = [
    ...atom(470, 250, { ...opts, rots: [0, 60], electrons: [200, 330] }),
    ...atom(730, 250, { ...opts, rots: [0, -60], electrons: [340, 210] }),
  ];
  const y = 250 - 50 * Math.sqrt(1 - (130 / 170) ** 2);
  for (let i = 0; i < 8; i++) {
    const [x1, y1] = onOrbit(600, y, 24, 24, 0, i * 45);
    const [x2, y2] = onOrbit(600, y, 36, 36, 0, i * 45);
    body.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${C.amber}" stroke-width="5" stroke-linecap="round"/>`
    );
  }
  body.push(circle(600, y, 14, C.amber));
  return svg(body);
}

// --- Physics and math ------------------------------------------------------

const GREYS = ['#ffffff', '#d4d4d4', '#b0b0b0', '#8f8f8f', '#6a6a6a'];

// Polyline through points [[x, y], ...].
const polyline = (pts, stroke, width = 5, extra = '') =>
  `<polyline points="${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

// Line with a filled arrowhead at its end.
const arrow = (x1, y1, x2, y2, stroke, width = 4, head = 16) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const bx = x2 - head * Math.cos(a);
  const by = y2 - head * Math.sin(a);
  const w = head * 0.55;
  return [
    `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(bx)}" y2="${f(by)}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`,
    `<path d="M ${f(x2)} ${f(y2)} L ${f(bx - w * Math.sin(a))} ${f(by + w * Math.cos(a))} L ${f(bx + w * Math.sin(a))} ${f(by - w * Math.cos(a))} Z" fill="${stroke}"/>`,
  ].join('\n');
};

// Sample y = fn(x) between x0 and x1.
const curve = (x0, x1, fn, step = 4) => {
  const pts = [];
  for (let x = x0; x <= x1; x += step) pts.push([x, fn(x)]);
  return pts;
};

// Data comes in, the store broadcasts it as waves to its subscribers.
function dataStore() {
  const [sx, sy] = [470, 250];
  const body = [arrow(240, sy, sx - 40, sy, C.blue, 5, 20)];
  [70, 130, 190, 250, 310].forEach((r, i) => {
    const [x1, y1] = onOrbit(sx, sy, r, r, 0, -36);
    const [x2, y2] = onOrbit(sx, sy, r, r, 0, 36);
    body.push(
      `<path d="M ${f(x1)} ${f(y1)} A ${r} ${r} 0 0 1 ${f(x2)} ${f(y2)}" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="${f(0.85 - i * 0.15)}"/>`
    );
  });
  body.push(circle(sx, sy, 18, C.amber));
  for (const y of [150, 250, 350]) {
    body.push(
      `<rect x="${880 - 16}" y="${y - 16}" width="32" height="32" rx="4" fill="${C.blue}"/>`
    );
  }
  return svg(body);
}

// Eager: the signal runs from the start. Lazy: flat until subscribed.
function eagerLazy() {
  const wave = (y0, from) => (x) => y0 - 42 * Math.sin((x - from) / 34);
  const sub = 560;
  return svg([
    polyline(curve(230, 970, wave(160, 230)), C.blue),
    polyline(
      [
        [230, 340],
        [sub, 340],
      ],
      ORBIT,
      5
    ),
    polyline(curve(sub, 970, wave(340, sub)), C.amber),
    circle(sub, 340, 12, C.amber),
  ]);
}

// "lit": a beam of light split by a prism.
function litHtml() {
  const tri = [
    [600, 130],
    [480, 338],
    [720, 338],
  ];
  const entry = [542, 234];
  const exit = [654, 224];
  return svg([
    polyline([[240, 300], entry], C.amber, 6),
    ...GREYS.map((g, i) => polyline([exit, [970, 130 + i * 52]], g, 5)),
    `<polygon points="${tri.map((p) => p.join(',')).join(' ')}" fill="${DARK}" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>`,
    polyline([entry, exit], 'rgba(255, 255, 255, 0.5)', 5),
  ]);
}

// A crystal lattice (the SSD's silicon) with a vacancy and a stray atom.
function readOnlySsd() {
  const body = [];
  const cols = 9;
  const rows = 5;
  const gap = 70;
  const x0 = 600 - ((cols - 1) / 2) * gap;
  const y0 = 250 - ((rows - 1) / 2) * gap;
  const hole = [5, 2];
  const isHole = (c, r) => c === hole[0] && r === hole[1];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [x, y] = [x0 + c * gap, y0 + r * gap];
      if (c + 1 < cols && !isHole(c, r) && !isHole(c + 1, r))
        body.push(bond(x, y, x + gap, y, 2));
      if (r + 1 < rows && !isHole(c, r) && !isHole(c, r + 1))
        body.push(bond(x, y, x, y + gap, 2));
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [x, y] = [x0 + c * gap, y0 + r * gap];
      if (c === hole[0] && r === hole[1]) {
        body.push(
          circle(
            x,
            y,
            14,
            'none',
            `stroke="#ffffff" stroke-width="3" stroke-dasharray="4 5"`
          )
        );
      } else {
        body.push(circle(x, y, 10, C.blue));
      }
    }
  }
  body.push(circle(x0 + 6.5 * gap, y0 + 1.5 * gap, 12, C.amber)); // the stray atom
  return svg(body);
}

// A function maps its domain to a codomain: domains to apps.
function dns() {
  const body = [
    `<ellipse cx="400" cy="250" rx="100" ry="165" fill="none" stroke="${ORBIT}" stroke-width="3"/>`,
    `<ellipse cx="800" cy="250" rx="100" ry="165" fill="none" stroke="${ORBIT}" stroke-width="3"/>`,
  ];
  const from = [
    [400, 160],
    [400, 250],
    [400, 340],
  ];
  const to = [
    [800, 200],
    [800, 310],
  ];
  const maps = [
    [0, 0],
    [1, 0],
    [2, 1],
  ];
  for (const [i, j] of maps) {
    const [x1, y1] = from[i];
    const [x2, y2] = to[j];
    body.push(
      arrow(x1 + 20, y1, x2 - 22, y2, i === 0 ? C.amber : C.blue, 4, 18)
    );
  }
  body.push(
    ...from.map(([x, y], i) => circle(x, y, 12, i === 0 ? C.amber : C.blue))
  );
  body.push(...to.map(([x, y]) => circle(x, y, 12, C.blue)));
  return svg(body);
}

// Cache hit: the request reflects off the service worker; only a faint
// ray goes through to the network.
function runtimeCache() {
  const [mx, my] = [600, 330];
  const body = [
    `<line x1="${mx}" y1="${my}" x2="${mx}" y2="120" stroke="${ORBIT}" stroke-width="3" stroke-dasharray="8 10"/>`,
    `<line x1="${mx}" y1="${my}" x2="680" y2="460" stroke="${ORBIT}" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round"/>`,
  ];
  for (let x = 330; x <= 860; x += 26) {
    body.push(
      `<line x1="${x}" y1="${my + 6}" x2="${x - 16}" y2="${my + 24}" stroke="${ORBIT}" stroke-width="3" stroke-linecap="round"/>`
    );
  }
  body.push(
    `<line x1="320" y1="${my}" x2="880" y2="${my}" stroke="${C.blue}" stroke-width="6" stroke-linecap="round"/>`
  );
  body.push(arrow(360, 110, mx - 4, my - 4, C.amber, 5, 0.1));
  body.push(arrow(mx + 4, my - 4, 840, 110, C.amber, 5, 22));
  return svg(body);
}

// Interest fading out: a damped oscillation and its envelope.
function lostInterest() {
  const [x0, x1, y0, a] = [230, 970, 250, 150];
  const env = (x) => a * Math.exp(-(x - x0) / 190);
  return svg([
    polyline(
      curve(x0, x1, (x) => y0 - env(x)),
      ORBIT,
      3,
      'stroke-dasharray="2 10"'
    ),
    polyline(
      curve(x0, x1, (x) => y0 + env(x)),
      ORBIT,
      3,
      'stroke-dasharray="2 10"'
    ),
    polyline(
      curve(x0, x1, (x) => y0 - env(x) * Math.cos((x - x0) / 30), 2),
      C.amber,
      5
    ),
  ]);
}

// Requests through plugins: rays through three lenses, source to focus.
function convoyr() {
  const lenses = [430, 600, 770];
  const lens = (x) =>
    `<path d="M ${x} 150 Q ${x + 44} 250 ${x} 350 Q ${x - 44} 250 ${x} 150 Z" fill="rgba(255, 255, 255, 0.08)" stroke="${C.blue}" stroke-width="4" stroke-linejoin="round"/>`;
  return svg([
    `<line x1="220" y1="250" x2="980" y2="250" stroke="${ORBIT}" stroke-width="3" stroke-dasharray="8 10"/>`,
    ...lenses.map(lens),
    polyline(
      [
        [240, 250],
        [430, 185],
        [770, 185],
        [960, 250],
      ],
      C.amber,
      4
    ),
    polyline(
      [
        [240, 250],
        [430, 315],
        [770, 315],
        [960, 250],
      ],
      C.amber,
      4
    ),
    circle(240, 250, 14, C.blue),
    circle(960, 250, 14, C.amber),
  ]);
}

// Same shape reused at every scale: a Sierpinski triangle.
function reusableLayouts() {
  const body = [];
  const tri = (ax, ay, bx, by, cx, cy, depth) => {
    if (depth === 0) {
      // The top copy of the whole shape is highlighted
      const hl = by <= 251;
      body.push(
        `<polygon points="${f(ax)},${f(ay)} ${f(bx)},${f(by)} ${f(cx)},${f(cy)}" fill="${hl ? C.amber : C.blue}"/>`
      );
      return;
    }
    const [abx, aby] = [(ax + bx) / 2, (ay + by) / 2];
    const [acx, acy] = [(ax + cx) / 2, (ay + cy) / 2];
    const [bcx, bcy] = [(bx + cx) / 2, (by + cy) / 2];
    tri(ax, ay, abx, aby, acx, acy, depth - 1);
    tri(abx, aby, bx, by, bcx, bcy, depth - 1);
    tri(acx, acy, bcx, bcy, cx, cy, depth - 1);
  };
  tri(600, 62, 382, 440, 818, 440, 4);
  return svg(body);
}

// A wireframe sphere with a few locales marked on it.
function i18n() {
  const [cx, cy, r] = [600, 250, 150];
  const grey = `fill="none" stroke="${C.blue}" stroke-width="3"`;
  const body = [];
  for (const k of [0.32, 0.68]) {
    body.push(
      `<ellipse cx="${cx}" cy="${cy}" rx="${r * k}" ry="${r}" ${grey}/>`
    );
  }
  body.push(
    `<line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}" stroke="${C.blue}" stroke-width="3"/>`
  );
  for (const k of [-0.6, -0.3, 0, 0.3, 0.6]) {
    const y = cy + k * r;
    const rx = Math.sqrt(r * r - (k * r) ** 2);
    body.push(
      `<ellipse cx="${cx}" cy="${f(y)}" rx="${f(rx)}" ry="${f(rx * 0.16)}" ${grey}/>`
    );
  }
  body.push(circle(cx, cy, r, 'none', `stroke="#ffffff" stroke-width="5"`));
  body.push(
    circle(cx - r * 0.32, cy - 0.3 * r + r * 0.16 * 0.95 * 0.95, 11, C.amber)
  );
  body.push(circle(cx + r * 0.68 * 0.72, cy + r * 0.04, 11, C.amber));
  body.push(
    circle(cx + r * 0.2, cy + 0.6 * r + 0.8 * r * 0.16 * 0.9, 11, C.amber)
  );
  return svg(body);
}

// Rspack: a fast comet.
function rspack() {
  const [hx, hy] = [830, 190];
  const [tx, ty] = [300, 340];
  const ang = Math.atan2(hy - ty, hx - tx);
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  const w = 30;
  return svg([
    `<linearGradient id="tail" gradientUnits="userSpaceOnUse" x1="${hx}" y1="${hy}" x2="${tx}" y2="${ty}"><stop offset="0" stop-color="${C.amber}" stop-opacity="0.8"/><stop offset="1" stop-color="${C.amber}" stop-opacity="0"/></linearGradient>`,
    `<path d="M ${f(hx + nx * w)} ${f(hy + ny * w)} L ${tx} ${ty} L ${f(hx - nx * w)} ${f(hy - ny * w)} Z" fill="url(#tail)"/>`,
    circle(hx, hy, 32, C.amber),
  ]);
}

// Partitions of the same square: whole, 3 strips (sharded), 4x4 (atomized).
// The gaps are the startup overhead, and they grow with the piece count.
function atomization() {
  const size = 180;
  const gap = 10;
  const body = [];
  const square = (cx, cols, rows, fill) => {
    const w = (size - gap * (cols - 1)) / cols;
    const h = (size - gap * (rows - 1)) / rows;
    const x0 = cx - size / 2;
    const y0 = 250 - size / 2;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        body.push(
          `<rect x="${f(x0 + c * (w + gap))}" y="${f(y0 + r * (h + gap))}" width="${f(w)}" height="${f(h)}" rx="4" fill="${fill}"/>`
        );
      }
    }
  };
  square(330, 1, 1, C.blue);
  square(600, 3, 1, C.amber);
  square(870, 4, 4, C.blue);
  return svg(body);
}

// Universal Scalability Law: speedup rises, peaks, then falls, while the
// ideal (linear) speedup keeps climbing.
function parallelism() {
  const [ox, oy] = [270, 410];
  const [w, h] = [660, 300];
  const usl = (n) => n / (1 + 0.04 * (n - 1) + 0.006 * n * (n - 1));
  const nMax = 40;
  const sMax = 7;
  const px = (n) => ox + ((n - 1) / (nMax - 1)) * w;
  const py = (s) => oy - ((s - 1) / (sMax - 1)) * h;
  const pts = [];
  let peak = [1, 1];
  for (let n = 1; n <= nMax; n += 0.25) {
    const s = usl(n);
    if (s > peak[1]) peak = [n, s];
    pts.push([px(n), py(s)]);
  }
  const [peakX, peakY] = [px(peak[0]), py(peak[1])];
  const dash = `stroke="${ORBIT}" stroke-width="3" stroke-dasharray="6 9"`;
  return svg([
    arrow(ox, oy, ox + w + 30, oy, C.blue, 4, 18),
    arrow(ox, oy, ox, oy - h - 40, C.blue, 4, 18),
    `<line x1="${ox}" y1="${oy}" x2="${f(px(sMax))}" y2="${f(py(sMax))}" ${dash}/>`,
    `<line x1="${f(peakX)}" y1="${f(peakY)}" x2="${f(peakX)}" y2="${oy}" ${dash}/>`,
    `<line x1="${f(peakX)}" y1="${f(peakY)}" x2="${ox}" y2="${f(peakY)}" ${dash}/>`,
    polyline(pts, C.amber, 5),
    circle(peakX, peakY, 12, C.amber),
  ]);
}

// Sovereignty: a small world with its own orbit, next to a giant.
function sovereignty() {
  const [px, py] = [770, 250];
  return svg([
    circle(150, 250, 270, DARK, `stroke="${ORBIT}" stroke-width="3"`),
    orbit(px, py, 150, 52, -14),
    circle(px, py, 52, C.amber),
    circle(...onOrbit(px, py, 150, 52, -14, 35), 14, C.blue),
  ]);
}

const dir = path.join(__dirname, '..', 'content', 'blog');
const banners = {
  'nx-atomization-vs-sharding': atomization,
  'nx-parallelism-pitfall': parallelism,
  'understanding-nx-affected-graph-vs-cache-hits': affected,
  'data-store-service-in-angular': dataStore,
  'building-an-immutable-store-from-scratch-with-react': immutableStore,
  'eager-vs-leazy-in-rxjs': eagerLazy,
  'experimenting-with-lit-html': litHtml,
  'fixing-filesystem-read-only-with-samsung-ssd': readOnlySsd,
  'how-to-configure-dns-using-heroku-and-google-domains': dns,
  'runtime-cache-made-easy': runtimeCache,
  'vuejs-programmatic-rendering-example': vueRender,
  'why-i-dont-like-vuejs-mixins': vueMixins,
  'a-practical-guide-to-building-cross-platform-apps-with-angular-ionic-capacitor-and-nx-part-1':
    crossPlatformSetup,
  'a-practical-guide-to-building-cross-platform-apps-with-angular-ionic-capacitor-and-nx-part-2':
    socialFeed,
  'cross-framework-i18n-with-angular-localize-and-nx': i18n,
  'i-dont-care-about-open-source-anymore': lostInterest,
  'introducing-convoyr': convoyr,
  'managing-subscriptions-in-angular': subscriptions,
  'nobuild-angular': nobuild,
  'nx-20-exploring-the-new-ts-preset-and-typescript-project-references':
    projectReferences,
  'reusable-layouts-in-angular': reusableLayouts,
  'souverainete-numerique-etat-des-lieux-technique': sovereignty,
  'state-of-rspack-in-angular': rspack,
};
for (const [slug, draw] of Object.entries(banners)) {
  fs.writeFileSync(path.join(dir, slug, 'cover.svg'), draw());
}
