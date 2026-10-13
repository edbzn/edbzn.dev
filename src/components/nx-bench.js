import React, { useEffect, useId, useRef, useState } from 'react';
import * as styles from './nx-bench.module.css';

/**
 * Dependency-free SVG charts for the "Nx atomization vs sharding" post. Every chart takes the
 * benchmark's JSON (github.com/edbzn/nx-atomization-vs-sharding, results/report) as props and
 * server-renders as static SVG; hover (or tap) shows a tooltip once hydrated.
 */

const VARIANTS = ['baseline', 'sharded', 'atomized'];
const VARIANT_LABEL = {
  baseline: 'Default: 1 task per project',
  atomized: 'Atomized: 1 task per spec',
  sharded: 'Sharded: groups of specs',
};
const SHORT = { baseline: 'Default', atomized: 'Atomized', sharded: 'Sharded' };
const KIND_LABEL = {
  build: 'App build',
  ct: 'Cypress CT',
  e2e: 'Playwright',
  unit: 'Vitest',
};
const color = (key) => `var(--nx-${key})`;

const niceStep = (raw) => {
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
};
const ticksFor = (max, count = 4) => {
  const step = niceStep((max || 1) / count);
  const top = Math.ceil(max / step) * step;
  const out = [];
  for (let v = 0; v <= top + step / 1e6; v += step)
    out.push(Math.round(v * 1e6) / 1e6);
  return out;
};
const textWidth = (s, px = 13) => s.length * px * 0.6;
const fmt = (v, d = 0) =>
  v.toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
const secs = (v) => `${fmt(v, v < 10 ? 1 : 0)} s`;

/* ---------------------------------------------------------------- workspace size */

// The same workspace at three sizes. Every chart takes its data keyed by size and shows one
// size at a time; switching on any chart switches them all.
export const SIZES = [12, 50, 100];
const MIX = {
  12: { ct: 5, e2e: 1, unit: 5 },
  50: { ct: 20, e2e: 5, unit: 20 },
  100: { ct: 40, e2e: 10, unit: 40 },
};
let currentSize = SIZES[0];
const sizeListeners = new Set();
const setSize = (size) => {
  currentSize = size;
  sizeListeners.forEach((listener) => listener(size));
};
// The selected size, and the sizes this chart's data covers (keys of `bySize`).
const useSize = (bySize) => {
  const [size, set] = useState(currentSize);
  useEffect(() => {
    sizeListeners.add(set);
    set(currentSize);
    return () => sizeListeners.delete(set);
  }, []);
  const sizes = SIZES.filter((n) => bySize?.[n]);
  return { size: sizes.includes(size) ? size : sizes[0], sizes };
};

// A row of pressable buttons: options are [value, label] pairs.
const Toggle = ({ label, options, value, onChange }) => (
  <div className={styles.toggle}>
    <span className={styles.toggleLabel} aria-hidden="true">
      {label}
    </span>
    <div className={styles.sizeSwitch} role="group" aria-label={label}>
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          aria-pressed={key === value}
          onClick={() => onChange(key)}
        >
          {text}
        </button>
      ))}
    </div>
  </div>
);

const SizeSwitch = ({ size, sizes = SIZES }) => (
  <Toggle
    label="Size"
    options={sizes.map((n) => [n, `${n} projects`])}
    value={size}
    onChange={setSize}
  />
);

/* ---------------------------------------------------------------- workload */

// Two workloads on the same workspaces: quick specs everywhere, or a fifth of the projects with
// slow specs. Charts that take `{ quick, slow }` show a switch; like the size, it's shared.
export const WORKLOADS = [
  ['quick', 'Quick specs'],
  ['slow', 'Slow projects'],
];
let currentWorkload = 'quick';
const workloadListeners = new Set();
const setWorkload = (w) => {
  currentWorkload = w;
  workloadListeners.forEach((listener) => listener(w));
};
// Returns the selected workload's data, or `data` itself when it isn't split by workload.
const useWorkload = (data) => {
  const [workload, set] = useState(currentWorkload);
  useEffect(() => {
    workloadListeners.add(set);
    set(currentWorkload);
    return () => workloadListeners.delete(set);
  }, []);
  const split =
    data && typeof data === 'object' && !Array.isArray(data) && 'quick' in data;
  if (!split) return { workload: null, data };
  const w = data[workload] ? workload : 'quick';
  return { workload: w, data: data[w] };
};
const WorkloadSwitch = ({ workload }) => (
  <Toggle
    label="Workload"
    options={WORKLOADS}
    value={workload}
    onChange={setWorkload}
  />
);

/* ---------------------------------------------------------------- figure + tooltip */

// Tooltip content: { title, rows: [{ label, value, colorKey }] }
const useTooltip = () => {
  const ref = useRef(null);
  const [tip, setTip] = useState(null);
  const show = (event, content) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    setTip({
      ...content,
      x: event.clientX - box.left,
      y: event.clientY - box.top,
      width: box.width,
    });
  };
  const hide = () => setTip(null);
  // Spread on any SVG element: hover with a mouse, tap on a touch screen.
  const bind = (content) => ({
    onPointerEnter: (e) => show(e, content),
    onPointerMove: (e) => show(e, content),
    onPointerDown: (e) => show(e, content),
    onPointerLeave: hide,
  });
  return { ref, tip, show, hide, bind };
};

const Tooltip = ({ tip }) => {
  if (!tip) return null;
  const flip = tip.x > tip.width - 240;
  return (
    <div
      className={styles.tooltip}
      style={{
        top: tip.y + 14,
        left: flip ? undefined : tip.x + 14,
        right: flip ? tip.width - tip.x + 14 : undefined,
      }}
      role="status"
    >
      {tip.title && <div className={styles.tooltipTitle}>{tip.title}</div>}
      {tip.rows?.map((r) => (
        <div key={r.label} className={styles.tooltipRow}>
          {r.colorKey && (
            <i
              className={styles.swatch}
              style={{ background: color(r.colorKey) }}
            />
          )}
          <span className={styles.tooltipLabel}>{r.label}</span>
          {r.value != null && <b>{r.value}</b>}
        </div>
      ))}
    </div>
  );
};

const Figure = ({
  title,
  caption,
  legend,
  tooltip,
  size,
  sizes,
  workload,
  controls,
  children,
}) => (
  <figure
    className={styles.figure}
    ref={tooltip?.ref}
    onPointerLeave={tooltip?.hide}
  >
    {(title || caption) && (
      <div className={styles.head}>
        {title && <div className={styles.title}>{title}</div>}
        {caption && <p className={styles.caption}>{caption}</p>}
      </div>
    )}
    {((size != null && (!sizes || sizes.length > 1)) ||
      workload ||
      controls) && (
      <div className={styles.controls}>
        {workload && <WorkloadSwitch workload={workload} />}
        {size != null && (!sizes || sizes.length > 1) && (
          <SizeSwitch size={size} sizes={sizes} />
        )}
        {controls}
      </div>
    )}
    {legend && <Legend items={legend} />}
    <div className={styles.scroll}>{children}</div>
    {tooltip && <Tooltip tip={tooltip.tip} />}
  </figure>
);

/** Wraps a wide markdown table so it scrolls sideways on phones instead of the page. */
export const Scroll = ({ children }) => (
  <div className={styles.tableScroll}>{children}</div>
);

/** Scales a block (e.g. a mermaid diagram) to the text column. */
export const Wide = ({ children, max }) => (
  <div
    className={styles.diagram}
    style={max ? { maxWidth: max, marginInline: 'auto' } : undefined}
  >
    {children}
  </div>
);

const Legend = ({ items }) => (
  <div className={styles.legend}>
    {items.map(([label, key]) => (
      <span key={label}>
        <i className={styles.swatch} style={{ background: color(key) }} />
        {label}
      </span>
    ))}
  </div>
);

const variantLegend = (labels = VARIANT_LABEL) =>
  VARIANTS.map((v) => [labels[v], v]);
const svgProps = (W, H, label) => ({
  className: `${styles.svg} ${W > 500 ? styles.wide : ''}`,
  viewBox: `0 0 ${W} ${H}`,
  role: 'img',
  'aria-label': label,
});

// The sharded configuration the post presents: a 10 s target (the plugin's estimate from spec
// size), the finest target within 2% of the fastest on the dial. Others appear on the dial.
const DEFAULT_SHARD_TARGET = 10;
const isDefault = (r) =>
  r.shard_target_s == null || r.shard_target_s === DEFAULT_SHARD_TARGET;
const findRun = (runs, variant, scenario, runner, parallel) =>
  runs.find(
    (r) =>
      r.variant === variant &&
      r.scenario === scenario &&
      r.runner === runner &&
      r.parallel === parallel &&
      isDefault(r)
  );

/* ---------------------------------------------------------------- grouped bars */

const runRows = (r) => [
  { label: 'Wall time', value: secs(r.wall_s) },
  { label: 'Tasks', value: fmt(r.tasks) },
  {
    label: 'Parallelism used',
    value: `${fmt(Math.min(1, r.slot_util) * 100)}%`,
  },
];

const change = (v, base) => {
  const p = Math.round((v / base - 1) * 100);
  return p === 0 ? '±0%' : `${p > 0 ? '+' : '−'}${Math.abs(p)}%`;
};

const GroupedBars = ({
  runs,
  field,
  format,
  groups,
  tooltip,
  parallel = 8,
  delta,
  tip,
}) => {
  const W = 680;
  const barH = 12;
  const barGap = 3;
  const groupGap = 18;
  const rows = groups
    .map((g) => ({
      ...g,
      bars: VARIANTS.map((v) =>
        findRun(runs, v, g.scenario, g.runner, parallel)
      ).filter(Boolean),
    }))
    .filter((g) => g.bars.length);
  const labelW = Math.max(...rows.map((g) => textWidth(g.label))) + 16;
  const valueW = delta ? 150 : 92;
  const max = Math.max(...rows.flatMap((g) => g.bars.map((b) => b[field])));
  const x = (v) => (v / max) * (W - labelW - valueW);
  const groupH = VARIANTS.length * (barH + barGap) - barGap;
  const H = rows.length * (groupH + groupGap) - groupGap;
  return (
    <svg {...svgProps(W, H, groups.map((g) => g.label).join(', '))}>
      {rows.map((g, gi) => (
        <g key={g.label} transform={`translate(0,${gi * (groupH + groupGap)})`}>
          <text y={groupH / 2} dy="0.35em">
            {g.label}
          </text>
          {g.bars.map((b) => {
            const y = VARIANTS.indexOf(b.variant) * (barH + barGap);
            const w = Math.max(2, x(b[field]));
            const base = g.bars.find((r) => r.variant === 'baseline');
            const label =
              delta && base && b !== base
                ? `${format(b[field])} · ${change(b[field], base[field])}`
                : format(b[field]);
            return (
              <g
                key={b.variant}
                className={styles.hit}
                {...tooltip.bind(
                  tip
                    ? tip(g, b)
                    : {
                        title: `${g.label} · ${SHORT[b.variant]}`,
                        rows: runRows(b),
                      }
                )}
              >
                <rect
                  x={labelW}
                  y={y - 1}
                  width={W - labelW}
                  height={barH + 2}
                  fill="transparent"
                />
                <rect
                  x={labelW}
                  y={y}
                  width={w}
                  height={barH}
                  rx={3}
                  fill={color(b.variant)}
                />
                <text
                  x={labelW + w + 6}
                  y={y + barH / 2}
                  dy="0.35em"
                  className={styles.muted}
                  fontSize={12}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const localGroups = (size) => [
  {
    scenario: 'full',
    runner: 'ct',
    label: plural(MIX[size].ct, 'Cypress CT project'),
  },
  {
    scenario: 'full',
    runner: 'e2e',
    label: plural(MIX[size].e2e, 'Playwright project'),
  },
  {
    scenario: 'full',
    runner: 'unit',
    label: plural(MIX[size].unit, 'Vitest project'),
  },
  { scenario: 'full', runner: 'all', label: `All ${size} projects` },
];

/** Each runner alone, then all of them: wall time or CPU time per setup. */
export const RunnerChart = ({ runs: data }) => {
  const tooltip = useTooltip();
  const { workload, data: runs } = useWorkload(data);
  const { size, sizes } = useSize(runs);
  const field = 'wall_s';
  const format = secs;
  return (
    <Figure
      workload={workload}
      size={size}
      sizes={sizes}
      title="How long each test runner takes"
      caption="Each runner ran on its own. Percentages compare with the default."
      legend={variantLegend()}
      tooltip={tooltip}
    >
      <GroupedBars
        runs={runs[size]}
        field={field}
        format={format}
        groups={localGroups(size)}
        tooltip={tooltip}
        delta
      />
    </Figure>
  );
};

/** The headline across sizes: one group per workspace size, one bar per setup. */
export const ScaleChart = ({ runs: data }) => {
  const tooltip = useTooltip();
  const { workload, data: runs } = useWorkload(data);
  const field = 'wall_s';
  const format = secs;
  const sizes = SIZES.filter((n) => runs[n]);
  const pick = (n, v) => findRun(runs[n], v, 'full', 'all', 8);
  // The default is drawn last and dashed, so a tie with sharding still shows both lines.
  const series = ['sharded', 'atomized', 'baseline'].map((v) => ({
    key: v,
    label: SHORT[v],
    dash: v === 'baseline' ? '6 5' : undefined,
    points: sizes
      .map((n) => ({ n, run: pick(n, v), base: pick(n, 'baseline') }))
      .filter((p) => p.run)
      .map((p) => ({ x: p.n, y: p.run[field], ...p })),
  }));
  return (
    <Figure
      workload={workload}
      title="How long the run takes"
      caption="Every project runs. Hover a point for details."
      legend={variantLegend()}
      tooltip={tooltip}
    >
      <LineChart
        series={series}
        xs={sizes}
        xFmt={(n) => `${n} projects`}
        yFmt={(v) => `${fmt(v)} s`}
        width={680}
        height={260}
        tooltip={tooltip}
        pointTip={(s, p) => ({
          title: `${p.n} projects · ${VARIANT_LABEL[s.key]}`,
          rows: [
            { label: 'Wall time', value: format(p.y), colorKey: s.key },
            ...(s.key === 'baseline'
              ? []
              : [
                  {
                    label: 'vs the default',
                    value: change(p.y, p.base[field]),
                  },
                ]),
            { label: 'Tasks', value: fmt(p.run.tasks) },
          ],
        })}
      />
    </Figure>
  );
};

/** How many tasks each setup makes of the same specs, per workspace size. */
export const TaskCountChart = ({ runs: data }) => {
  const tooltip = useTooltip();
  const { workload, data: runs } = useWorkload(data);
  const sized = SIZES.flatMap((n) =>
    (runs[n] ?? []).map((r) => ({ ...r, scenario: `n${n}` }))
  );
  return (
    <Figure
      workload={workload}
      title="How many tasks each setup runs"
      caption="Each app also adds a build task and a server-wait task."
      legend={variantLegend()}
      tooltip={tooltip}
    >
      <GroupedBars
        runs={sized}
        field="tasks"
        format={(v) => fmt(v)}
        groups={SIZES.filter((n) => runs[n]).map((n) => ({
          n,
          scenario: `n${n}`,
          runner: 'all',
          label: `${n} projects`,
        }))}
        tooltip={tooltip}
        tip={(g, b) => ({
          title: `${g.label} · ${SHORT[b.variant]}`,
          rows: [
            { label: 'Tasks', value: fmt(b.tasks) },
            { label: 'Per project', value: fmt(b.tasks / g.n, 1) },
          ],
        })}
      />
    </Figure>
  );
};

// One measure per setup and workspace size, from the all-runner runs.
const SETUP_METRICS = {
  parallelism: {
    title: 'How much of the parallelism was used',
    caption:
      'On average, how many of the 8 parallel tasks were running, as a share.',
    label: 'Parallelism used',
    value: (r) => Math.min(1, r.slot_util) * 100,
    format: (v) => `${fmt(v)}%`,
  },
  longest: {
    title: 'The longest single task',
    caption: 'A run can never finish sooner than its longest task.',
    label: 'Longest task',
    value: (r) => r.critical_path_s,
    format: secs,
  },
  memory: {
    title: 'Memory at the busiest moments',
    caption: 'RAM used by all running tasks (99th percentile over the run).',
    label: 'Memory',
    value: (r) => r.mem_gb,
    format: (v) => `${fmt(v, 1)} GB`,
  },
};

/** Lanes busy, longest task or memory, per setup and workspace size. */
export const SetupMetricChart = ({ runs: data, metric }) => {
  const m = SETUP_METRICS[metric];
  const tooltip = useTooltip();
  const { workload, data: runs } = useWorkload(data);
  const sized = SIZES.flatMap((n) =>
    (runs[n] ?? []).map((r) => ({ ...r, scenario: `n${n}`, value: m.value(r) }))
  );
  return (
    <Figure
      workload={workload}
      title={m.title}
      caption={m.caption}
      legend={variantLegend()}
      tooltip={tooltip}
    >
      <GroupedBars
        runs={sized.filter((r) => Number.isFinite(r.value))}
        field="value"
        format={m.format}
        groups={SIZES.filter((n) => runs[n]).map((n) => ({
          n,
          scenario: `n${n}`,
          runner: 'all',
          label: `${n} projects`,
        }))}
        tooltip={tooltip}
        tip={(g, b) => ({
          title: `${g.label} · ${SHORT[b.variant]}`,
          rows: [
            { label: m.label, value: m.format(b.value), colorKey: b.variant },
            { label: 'Wall time', value: secs(b.wall_s) },
          ],
        })}
      />
    </Figure>
  );
};

/* ---------------------------------------------------------------- simple bars */

const Bars = ({ items, format, tooltip }) => {
  const W = 680;
  const barH = 18;
  const gap = 10;
  const labelW = Math.max(...items.map((i) => textWidth(i.label))) + 16;
  const max = Math.max(...items.map((i) => i.value));
  const valueW =
    Math.max(...items.map((i) => textWidth(format(i.value), 12))) + 14;
  const x = (v) => (v / max) * (W - labelW - valueW);
  const H = items.length * (barH + gap) - gap;
  return (
    <svg {...svgProps(W, H, items.map((i) => i.label).join(', '))}>
      {items.map((it, i) => {
        const y = i * (barH + gap);
        const w = Math.max(2, x(it.value));
        return (
          <g
            key={it.label}
            className={styles.hit}
            {...tooltip.bind(
              it.tip ?? {
                title: it.label,
                rows: [{ label: 'Value', value: format(it.value) }],
              }
            )}
          >
            <rect
              x={0}
              y={y - 2}
              width={W}
              height={barH + 4}
              fill="transparent"
            />
            <text y={y + barH / 2} dy="0.35em">
              {it.label}
            </text>
            <rect
              x={labelW}
              y={y}
              width={w}
              height={barH}
              rx={4}
              fill={color(it.colorKey)}
              opacity={it.dim ? 0.45 : 1}
            />
            <text
              x={labelW + w + 6}
              y={y + barH / 2}
              dy="0.35em"
              className={styles.muted}
              fontSize={12}
            >
              {format(it.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export const StartupTaxChart = ({ tax: taxBySize }) => {
  const tooltip = useTooltip();
  // The startup barely changes with the workspace size: show the largest one, without a switch.
  const size = Math.max(...SIZES.filter((n) => taxBySize[n]));
  const tax = taxBySize[size] ?? [];
  const row = (runner) => tax.find((t) => t.runner === runner)?.startup_tax_s;
  const item = (label, runner, colorKey, what, extra = {}) =>
    Number.isFinite(row(runner))
      ? {
          label,
          value: row(runner),
          colorKey,
          tip: {
            title: label,
            rows: [
              {
                label: 'Startup per process',
                value: `${fmt(row(runner), 1)} s`,
              },
              { label: what },
            ],
          },
          ...extra,
        }
      : null;
  const items = [
    item(
      'Vitest file',
      'unit',
      'unit',
      'Node worker, Vite, jsdom, transform imports'
    ),
    item(
      'Playwright spec',
      'e2e',
      'e2e',
      'test runner and Chromium; the app server is shared'
    ),
    item(
      'Cypress component spec',
      'ct',
      'ct',
      'Cypress, Vite + dependency pre-bundling, Electron'
    ),
  ].filter(Boolean);
  return (
    <Figure
      title="Startup cost of each extra task"
      caption={`Median across projects, ${size}-project workspace.`}
      tooltip={tooltip}
    >
      <Bars items={items} format={(v) => `${fmt(v, 1)} s`} tooltip={tooltip} />
    </Figure>
  );
};

/* ---------------------------------------------------------------- the anatomy of a task (illustration) */

// One project with 12 specs (work units) and a fixed startup cost per process, on 4 slots.
const SPECS = [3, 2.5, 2, 2, 1.5, 1.5, 1.2, 1, 1, 0.8, 0.8, 0.7];
const STARTUP = 1;
const SLOTS = 4;

const lptGroups = (specs, n) => {
  const groups = Array.from({ length: n }, () => ({ total: 0, specs: [] }));
  specs
    .map((d, i) => ({ d, i }))
    .sort((a, b) => b.d - a.d)
    .forEach((s) => {
      const g = groups.reduce((m, x) => (x.total < m.total ? x : m));
      g.total += s.d;
      g.specs.push(s);
    });
  return groups.map((g) => g.specs);
};

const schedule = (tasks) => {
  const slots = Array.from({ length: SLOTS }, () => 0);
  return [...tasks]
    .map((specs) => ({
      specs,
      dur: STARTUP + specs.reduce((a, b) => a + b.d, 0),
    }))
    .sort((a, b) => b.dur - a.dur)
    .map((t) => {
      const slot = slots.indexOf(Math.min(...slots));
      const start = slots[slot];
      slots[slot] += t.dur;
      return { ...t, slot, start };
    });
};

// The three setups for the illustrated project: the targets Nx creates and where they come from.
const MODES = [
  {
    key: 'baseline',
    name: 'Default',
    tasks: '1 task per project',
    tree: ['component-test'],
    source: 'The target the Nx plugin infers, running all 12 specs.',
  },
  {
    key: 'sharded',
    name: 'Sharded',
    tasks: '1 task per group of specs',
    tree: [
      'component-test-ci',
      '--shard-1-of-3',
      '--shard-2-of-3',
      '--shard-3-of-3',
    ],
    source: 'A custom plugin balances the specs into shards by size.',
  },
  {
    key: 'atomized',
    name: 'Atomized',
    tasks: '1 task per spec',
    tree: [
      'component-test-ci',
      '--src/button.cy.tsx',
      '--src/card.cy.tsx',
      '… 10 more',
    ],
    source: "Nx's built-in atomizer, one task per spec file.",
  },
];

/** The three setups as cards; picking one highlights its row in the slot illustration. */
export const SplitModes = () => {
  const tooltip = useTooltip();
  const [active, setActive] = useState(null);
  return (
    <Figure
      title="One project with 12 specs, three ways"
      caption="Click a setup to highlight it. Below: the same project with 4 tasks in parallel, as an illustration."
      tooltip={tooltip}
    >
      <div className={styles.modes} role="group" aria-label="Setup">
        {MODES.map((m, i) => (
          <button
            key={m.key}
            type="button"
            className={styles.mode}
            style={{ '--mode': color(m.key) }}
            aria-pressed={active === i}
            onClick={() => setActive(active === i ? null : i)}
          >
            <span className={styles.modeName}>{m.name}</span>
            <span className={styles.modeTasks}>{m.tasks}</span>
            <code className={styles.modeTree}>
              {m.tree.map((t, ti) => (
                <span key={t}>{ti === 0 ? t : `└ ${t}`}</span>
              ))}
            </code>
            <span className={styles.modeSource}>{m.source}</span>
          </button>
        ))}
      </div>
      <Legend
        items={[
          ['Startup', 'startup'],
          ['Running specs', 'work'],
        ]}
      />
      <AnatomySvg tooltip={tooltip} active={active} />
    </Figure>
  );
};

const AnatomySvg = ({ tooltip, active }) => {
  const pattern = useId().replace(/:/g, '');
  const indexed = SPECS.map((d, i) => ({ d, i }));
  const rows = [
    { label: 'Default: 1 task', tasks: schedule([indexed]) },
    { label: 'Sharded: 3 tasks', tasks: schedule(lptGroups(SPECS, 3)) },
    { label: 'Atomized: 12 tasks', tasks: schedule(indexed.map((s) => [s])) },
  ];
  const W = 680;
  const left = 2;
  const laneH = 18;
  const titleH = 22;
  const blockGap = 24;
  const sideW = 128;
  const maxEnd = Math.max(
    ...rows.flatMap((r) => r.tasks.map((t) => t.start + t.dur))
  );
  const unit = (W - left - sideW) / maxEnd;
  const blockH = titleH + SLOTS * laneH;
  const H = rows.length * (blockH + blockGap) - blockGap;
  return (
    <>
      <svg
        {...svgProps(
          W,
          H,
          'Startup and spec work for three ways of splitting one project'
        )}
      >
        <defs>
          <pattern
            id={pattern}
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect
              width="7"
              height="7"
              fill="var(--nx-startup)"
              opacity="0.35"
            />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="7"
              stroke="var(--nx-startup)"
              strokeWidth="3.5"
            />
          </pattern>
        </defs>
        {rows.map((row, ri) => {
          const y0 = ri * (blockH + blockGap);
          const end = Math.max(...row.tasks.map((t) => t.start + t.dur));
          const cpu = row.tasks.reduce((a, t) => a + t.dur, 0);
          const startups = row.tasks.length;
          const summary = {
            title: row.label,
            rows: [
              { label: 'Done at', value: fmt(end, 1) },
              { label: 'Processes started', value: fmt(startups) },
              { label: 'Busy time (specs + startups)', value: fmt(cpu, 1) },
              {
                label: 'Spent on startup',
                value: `${fmt((startups * STARTUP * 100) / cpu)}%`,
              },
            ],
          };
          return (
            <g
              key={row.label}
              transform={`translate(0,${y0})`}
              opacity={active == null || active === ri ? 1 : 0.3}
              style={{ transition: 'opacity 0.15s' }}
            >
              <text x={left} y={15} fontWeight={600} {...tooltip.bind(summary)}>
                {row.label}
              </text>
              {Array.from({ length: SLOTS }, (_, s) => (
                <rect
                  key={s}
                  x={left}
                  y={titleH + s * laneH}
                  width={W - left - sideW}
                  height={laneH - 4}
                  rx={3}
                  fill="var(--nx-grid)"
                  opacity={0.6}
                  {...tooltip.bind({
                    title: row.label,
                    rows: [{ label: 'Unused parallelism' }],
                  })}
                />
              ))}
              {row.tasks.map((t, ti) => {
                const y = titleH + t.slot * laneH;
                const taskInfo = [
                  { label: 'Specs in this task', value: fmt(t.specs.length) },
                  { label: 'Task duration', value: fmt(t.dur, 1) },
                ];
                let cursor = left + t.start * unit;
                const parts = [
                  <rect
                    key="s"
                    className={styles.hit}
                    x={cursor}
                    y={y}
                    width={STARTUP * unit - 1.5}
                    height={laneH - 4}
                    rx={2}
                    fill={`url(#${pattern})`}
                    {...tooltip.bind({
                      title: 'Startup',
                      rows: [
                        {
                          label: 'Boot runner, bundle, launch browser',
                          colorKey: 'startup',
                        },
                        { label: 'Duration', value: fmt(STARTUP, 1) },
                        ...taskInfo,
                      ],
                    })}
                  />,
                ];
                cursor += STARTUP * unit;
                t.specs.forEach((s) => {
                  parts.push(
                    <rect
                      key={s.i}
                      className={styles.hit}
                      x={cursor}
                      y={y}
                      width={Math.max(1, s.d * unit - 1.5)}
                      height={laneH - 4}
                      rx={2}
                      fill="var(--nx-work)"
                      {...tooltip.bind({
                        title: `Spec ${s.i + 1}`,
                        rows: [
                          { label: 'Test work', colorKey: 'work' },
                          { label: 'Duration', value: fmt(s.d, 1) },
                          ...taskInfo,
                        ],
                      })}
                    />
                  );
                  cursor += s.d * unit;
                });
                return <g key={ti}>{parts}</g>;
              })}
              <line
                x1={left + end * unit}
                x2={left + end * unit}
                y1={titleH - 4}
                y2={titleH + SLOTS * laneH - 2}
                stroke="var(--text-primary)"
                strokeWidth={2}
              />
              <g {...tooltip.bind(summary)}>
                <text
                  x={W - sideW + 12}
                  y={titleH + 12}
                  fontWeight={600}
                >{`done at ${fmt(end, 1)}`}</text>
                <text
                  x={W - sideW + 12}
                  y={titleH + 30}
                  className={styles.muted}
                >{`${startups} startup${startups > 1 ? 's' : ''}`}</text>
                <text
                  x={W - sideW + 12}
                  y={titleH + 48}
                  className={styles.muted}
                >{`busy ${fmt(cpu, 1)}`}</text>
              </g>
            </g>
          );
        })}
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- slot timelines */

const SlotLanes = ({ rows, tooltip }) => {
  const W = 680;
  const laneH = 9;
  const titleH = 20;
  const gap = 26;
  const axisH = 22;
  const slots = Math.max(...rows.map((r) => r.slot)) + 1;
  const maxEnd = Math.max(...rows.map((r) => r.end_s));
  const ticks = ticksFor(maxEnd, 6);
  const top = ticks[ticks.length - 1];
  const x = (v) => 2 + (v / top) * (W - 6);
  const panelH = titleH + slots * laneH;
  const H = VARIANTS.length * (panelH + gap) + axisH - gap;
  return (
    <svg {...svgProps(W, H, 'What ran in parallel in each setup')}>
      {VARIANTS.map((v, vi) => {
        const tasks = rows.filter((r) => r.variant === v);
        const end = Math.max(...tasks.map((t) => t.end_s));
        return (
          <g key={v} transform={`translate(0,${vi * (panelH + gap)})`}>
            <text
              x={2}
              y={15}
              fontWeight={600}
            >{`${SHORT[v]} · ${fmt(tasks.length)} tasks · last task ends at ${secs(end)}`}</text>
            <rect
              x={2}
              y={titleH}
              width={W - 6}
              height={slots * laneH}
              fill="var(--nx-grid)"
              opacity={0.5}
            />
            {tasks.map((t) => (
              <rect
                key={`${t.task}-${t.start_s}`}
                className={styles.hit}
                x={x(t.start_s)}
                y={titleH + t.slot * laneH + 0.5}
                width={Math.max(1.5, x(t.end_s) - x(t.start_s) - 0.8)}
                height={laneH - 1.5}
                fill={color(t.kind)}
                {...tooltip.bind({
                  title: t.task,
                  rows: [
                    { label: KIND_LABEL[t.kind], colorKey: t.kind },
                    { label: 'Duration', value: secs(t.end_s - t.start_s) },
                    {
                      label: 'Ran from',
                      value: `${fmt(t.start_s, 1)} to ${fmt(t.end_s, 1)} s`,
                    },
                  ],
                })}
              />
            ))}
          </g>
        );
      })}
      <g transform={`translate(0,${H - axisH + 6})`}>
        {ticks.map((t, i) => (
          <text
            key={t}
            x={x(t)}
            y={13}
            textAnchor={
              i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle'
            }
            className={styles.muted}
            fontSize={12}
          >
            {`${fmt(t)} s`}
          </text>
        ))}
      </g>
    </svg>
  );
};

/** One run per setup: every task, one lane per parallel task. */
export const TaskTimeline = ({ timelines: data }) => {
  const tooltip = useTooltip();
  const { workload, data: timelines } = useWorkload(data);
  const { size, sizes } = useSize(timelines);
  const rows = (timelines[size] ?? []).map((r) => ({
    ...r,
    slot: Number(r.slot),
  }));
  return (
    <Figure
      workload={workload}
      size={size}
      sizes={sizes}
      title="What ran in parallel"
      caption="One row per parallel task. Empty space is unused parallelism."
      legend={Object.entries(KIND_LABEL).map(([k, l]) => [l, k])}
      tooltip={tooltip}
    >
      <SlotLanes rows={rows} tooltip={tooltip} />
    </Figure>
  );
};

/* ---------------------------------------------------------------- work + idle tail */

const BREAKDOWN_LEGEND = [
  ['Work', 'work'],
  ['Extra startups from splitting', 'startup'],
  ['Idle tail', 'tail'],
];

/**
 * Stacked bars, one per run: the work the default does too, the work the split adds (mostly
 * startups) and the idle tail. rows: [{ key, label, lim, run, note }], base: the default's lim.
 */
const BreakdownBars = ({ rows, base, max: wallMax, parallel, tooltip }) => {
  const pattern = useId().replace(/:/g, '');
  const top = ticksFor(wallMax, 6);
  const max = top[top.length - 1];
  const W = 680;
  const labelW = Math.max(84, ...rows.map((r) => textWidth(r.label, 13) + 14));
  const valueW = rows.some((r) => r.note) ? 150 : 56;
  const barH = 24;
  const gap = 16;
  const axisH = 22;
  const x = (v) => (v / max) * (W - labelW - valueW);
  const H = rows.length * (barH + gap) - gap + axisH;
  return (
    <svg {...svgProps(W, H, 'Work and idle tail per run')}>
      <defs>
        <pattern
          id={pattern}
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="7" height="7" fill="var(--nx-startup)" opacity="0.35" />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="7"
            stroke="var(--nx-startup)"
            strokeWidth="3.5"
          />
        </pattern>
      </defs>
      {rows.map(({ key, label, lim, run, note }, i) => {
        const y = i * (barH + gap);
        const shared = Math.min(lim.work, base.work);
        const added = Math.max(0, lim.work - base.work);
        const tail = lim.wall - lim.work;
        const segs = [
          { key: 'work', w: x(shared), fill: 'var(--nx-work)' },
          {
            key: 'added',
            w: x(added),
            fill: `url(#${pattern})`,
            label: added > 0 ? `+${secs(added)}` : null,
          },
          {
            key: 'tail',
            w: x(tail),
            fill: 'var(--nx-tail)',
            label: `tail ${secs(tail)}`,
          },
        ];
        let cursor = labelW;
        const tip = {
          title: `${label} · --parallel=${parallel}`,
          rows: [
            {
              label: 'Work (8 tasks always running)',
              value: secs(lim.work),
              colorKey: 'work',
            },
            ...(lim === base
              ? []
              : [
                  {
                    label: 'of which added by the split',
                    value: secs(added),
                    colorKey: 'startup',
                  },
                ]),
            { label: 'Idle tail', value: secs(tail), colorKey: 'tail' },
            { label: 'Wall time', value: secs(lim.wall) },
            { label: 'Biggest task', value: secs(lim.biggest) },
            ...(run ? [{ label: 'Tasks', value: fmt(run.tasks) }] : []),
          ],
        };
        return (
          <g key={key} className={styles.hit} {...tooltip.bind(tip)}>
            <rect
              x={0}
              y={y - 4}
              width={W}
              height={barH + 8}
              fill="transparent"
            />
            <text y={y + barH / 2} dy="0.35em" fontWeight={600}>
              {label}
            </text>
            {segs.map((g) => {
              const x0 = cursor;
              cursor += g.w;
              if (g.w < 0.5) return null;
              return (
                <g key={g.key}>
                  <rect
                    x={x0}
                    y={y}
                    width={Math.max(1, g.w - 2)}
                    height={barH}
                    rx={3}
                    fill={g.fill}
                  />
                  {g.label && g.w > textWidth(g.label, 12) + 10 && (
                    <text
                      x={x0 + g.w / 2 - 1}
                      y={y + barH / 2}
                      dy="0.35em"
                      textAnchor="middle"
                      fontSize={12}
                      className={styles.onBar}
                    >
                      {g.label}
                    </text>
                  )}
                </g>
              );
            })}
            <text x={cursor + 6} y={y + barH / 2} dy="0.35em" fontSize={12}>
              <tspan fontWeight={600}>{secs(lim.wall)}</tspan>
              {note && <tspan className={styles.muted}>{` · ${note}`}</tspan>}
            </text>
          </g>
        );
      })}
      <g transform={`translate(0,${H - axisH + 6})`}>
        {top.map((t, i) => (
          <text
            key={t}
            x={labelW + x(t)}
            y={13}
            textAnchor={i === 0 ? 'start' : 'middle'}
            className={styles.muted}
            fontSize={12}
          >
            {`${fmt(t)} s`}
          </text>
        ))}
      </g>
    </svg>
  );
};

const findLim = (
  limits,
  size,
  variant,
  parallel,
  target = DEFAULT_SHARD_TARGET
) =>
  limits.find(
    (l) =>
      l.size === size &&
      l.variant === variant &&
      l.parallel === parallel &&
      (variant !== 'sharded' || l.target === target)
  );
const findTargetRun = (
  runs,
  variant,
  parallel,
  target = DEFAULT_SHARD_TARGET
) =>
  runs.find(
    (r) =>
      r.variant === variant &&
      r.scenario === 'full' &&
      r.runner === 'all' &&
      r.parallel === parallel &&
      (variant !== 'sharded' ||
        (r.shard_target_s ?? DEFAULT_SHARD_TARGET) === target)
  );

/** Wall time = work divided by the parallelism + idle tail, per setup. */
export const WallBreakdown = ({
  limits: limitsData,
  runs: runsData,
  parallel: initial = 8,
  parallelSwitch = true,
}) => {
  const tooltip = useTooltip();
  const { workload, data: limits } = useWorkload(limitsData);
  const runs = useWorkload(runsData).data;
  const [parallel, setParallel] = useState(initial);
  const bySize = Object.fromEntries(
    SIZES.map((n) => [n, limits.some((l) => l.size === n) || null])
  );
  const { size, sizes } = useSize(bySize);
  const base = findLim(limits, size, 'baseline', parallel);
  const rows = VARIANTS.map((v) => ({
    key: v,
    label: SHORT[v],
    lim: findLim(limits, size, v, parallel),
    run: findTargetRun(runs[size] ?? [], v, parallel),
  })).filter((r) => r.lim);
  // With the switch, keep one axis for both settings so the bars compare across them.
  const shown = parallelSwitch ? [8, 16] : [parallel];
  const max = Math.max(
    ...shown.flatMap((p) =>
      VARIANTS.map((v) => findLim(limits, size, v, p)?.wall ?? 0)
    )
  );
  return (
    <Figure
      workload={workload}
      size={size}
      sizes={sizes}
      controls={
        parallelSwitch && (
          <Toggle
            label="Parallelism"
            options={[
              [8, '--parallel=8'],
              [16, '--parallel=16'],
            ]}
            value={parallel}
            onChange={setParallel}
          />
        )
      }
      title="Where the run time goes"
      caption="Work: the run time if 8 tasks always ran. Idle tail: the time lost when fewer ran."
      legend={BREAKDOWN_LEGEND}
      tooltip={tooltip}
    >
      <BreakdownBars
        rows={rows}
        base={base}
        max={max}
        parallel={parallel}
        tooltip={tooltip}
      />
    </Figure>
  );
};

/* ---------------------------------------------------------------- line charts */

const LineChart = ({
  series,
  xs,
  xLinear,
  xMax,
  xFmt,
  yFmt,
  tooltip,
  pointTip,
  height = 190,
  width = 330,
  crosshair,
  markers = [],
  hlines = [],
}) => {
  const svgRef = useRef(null);
  const [hoverX, setHoverX] = useState(null);
  const W = width;
  const H = height;
  const yMax = Math.max(
    ...series.flatMap((s) => s.points.map((p) => p.y)),
    ...hlines.map((h) => h.y)
  );
  const yTicks = ticksFor(yMax, 4);
  const yTop = yTicks[yTicks.length - 1];
  const left = Math.max(...yTicks.map((t) => textWidth(yFmt(t), 12))) + 14;
  const bottom = 24;
  const y = (v) => 8 + (1 - v / yTop) * (H - bottom - 8);
  const x = xLinear
    ? (v) => left + 4 + (v / xMax) * (W - left - 24)
    : (v) =>
        left +
        16 +
        (xs.indexOf(v) / Math.max(1, xs.length - 1)) * (W - left - 48);
  const xTicks = xLinear
    ? ticksFor(xMax, Math.max(2, Math.floor(W / 110))).filter((t) => t <= xMax)
    : xs;

  const onCrosshair = (event) => {
    const box = svgRef.current.getBoundingClientRect();
    const sx = ((event.clientX - box.left) / box.width) * W;
    const xv = Math.max(
      0,
      Math.min(xMax, ((sx - left - 4) / (W - left - 24)) * xMax)
    );
    const at = series.map((s) => {
      const p = s.points.reduce(
        (best, q) => (Math.abs(q.x - xv) < Math.abs(best.x - xv) ? q : best),
        s.points[0]
      );
      return { s, p };
    });
    setHoverX(at[0].p.x);
    const rows = crosshair.rows
      ? crosshair.rows(at[0].p)
      : at.map(({ s, p }) => ({
          label: s.label,
          value: crosshair.value(p.y),
          colorKey: s.key,
        }));
    tooltip.show(event, { title: crosshair.title(at[0].p.x), rows });
  };

  return (
    <svg
      ref={svgRef}
      {...svgProps(W, H, series.map((s) => s.label).join(', '))}
    >
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={left}
            x2={W - 2}
            y1={y(t)}
            y2={y(t)}
            stroke="var(--nx-grid)"
          />
          <text
            x={left - 7}
            y={y(t)}
            dy="0.35em"
            textAnchor="end"
            className={styles.muted}
            fontSize={12}
          >
            {yFmt(t)}
          </text>
        </g>
      ))}
      {xTicks.map((t, i) => (
        <text
          key={t}
          x={x(t)}
          y={H - 5}
          textAnchor={
            xLinear
              ? 'middle'
              : i === 0
                ? 'start'
                : i === xTicks.length - 1
                  ? 'end'
                  : 'middle'
          }
          className={styles.muted}
          fontSize={12}
        >
          {xFmt ? xFmt(t) : t}
        </text>
      ))}
      {hlines.map((h) => (
        <g key={h.label}>
          <line
            x1={left}
            x2={W - 2}
            y1={y(h.y)}
            y2={y(h.y)}
            stroke="var(--text-muted)"
            strokeWidth={1.2}
          />
          <text
            x={W - 4}
            y={y(h.y) - 5}
            textAnchor="end"
            fontSize={12}
            className={styles.muted}
          >
            {h.label}
          </text>
        </g>
      ))}
      {markers.map((m) => (
        <g key={m.label}>
          <line
            x1={x(m.x)}
            x2={x(m.x)}
            y1={8}
            y2={H - bottom}
            stroke="var(--text-muted)"
            strokeDasharray="4 4"
          />
          <text
            x={x(m.x) + (m.align === 'end' ? -6 : 6)}
            y={20}
            textAnchor={m.align === 'end' ? 'end' : 'start'}
            fontSize={12}
            fontWeight={m.strong ? 600 : 400}
            className={m.strong ? undefined : styles.muted}
          >
            {m.label}
          </text>
        </g>
      ))}
      {series.map((s) => (
        <polyline
          key={s.key}
          points={s.points.map((p) => `${x(p.x)},${y(p.y)}`).join(' ')}
          fill="none"
          stroke={color(s.key)}
          strokeWidth={crosshair ? 1.8 : 2.5}
          strokeDasharray={s.dash}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {crosshair && (
        <>
          {hoverX != null && (
            <line
              x1={x(hoverX)}
              x2={x(hoverX)}
              y1={8}
              y2={H - bottom}
              stroke="var(--text-muted)"
              strokeDasharray="3 3"
            />
          )}
          {hoverX != null &&
            series.map((s) => {
              const p = s.points.find((q) => q.x === hoverX);
              return p ? (
                <circle
                  key={s.key}
                  cx={x(p.x)}
                  cy={y(p.y)}
                  r={4}
                  fill={color(s.key)}
                  stroke="var(--bg-secondary)"
                  strokeWidth={1.5}
                />
              ) : null;
            })}
          <rect
            x={left}
            y={0}
            width={W - left}
            height={H - bottom}
            fill="transparent"
            onPointerMove={onCrosshair}
            onPointerDown={onCrosshair}
            onPointerLeave={() => {
              setHoverX(null);
              tooltip.hide();
            }}
          />
        </>
      )}
      {!crosshair &&
        series.map((s) =>
          s.points.map((p) => (
            <g
              key={`${s.key}-${p.x}`}
              className={styles.hit}
              {...tooltip.bind(pointTip(s, p))}
            >
              <circle cx={x(p.x)} cy={y(p.y)} r={12} fill="transparent" />
              <circle
                cx={x(p.x)}
                cy={y(p.y)}
                r={5}
                fill={color(p.colorKey ?? s.key)}
                stroke="var(--bg-secondary)"
                strokeWidth={1.5}
              />
            </g>
          ))
        )}
    </svg>
  );
};

/* ---------------------------------------------------------------- Nx Agents */

const AGENTS = [3, 5, 8];
const agentMin = (v) => `${fmt(v, v < 10 ? 1 : 0)} agent-min`;

const agentsBySize = (data) =>
  Object.fromEntries(
    SIZES.map((n) => [n, data.some((d) => d.size === n) || null])
  );

/** One Nx Agents run per setup, split into agent boot and tests. */
export const AgentsRunBars = ({ agents: data }) => {
  const tooltip = useTooltip();
  const pattern = useId().replace(/:/g, '');
  const { size, sizes } = useSize(agentsBySize(data));
  const counts = AGENTS.filter((a) =>
    data.some((d) => d.size === size && d.agents === a)
  );
  const [picked, setCount] = useState(8);
  const count = counts.includes(picked) ? picked : counts[counts.length - 1];
  const rows = VARIANTS.map((v) =>
    data.find((d) => d.size === size && d.variant === v && d.agents === count)
  ).filter(Boolean);
  const max = Math.max(
    ...data.filter((d) => d.size === size).map((d) => d.total_s)
  );
  const top = ticksFor(max, 6);
  const W = 680;
  const labelW = 84;
  const valueW = 56;
  const barH = 24;
  const gap = 16;
  const axisH = 22;
  const x = (v) => (v / top[top.length - 1]) * (W - labelW - valueW);
  const H = Math.max(1, rows.length) * (barH + gap) - gap + axisH;
  return (
    <Figure
      size={size}
      sizes={sizes}
      controls={
        counts.length > 1 && (
          <Toggle
            label="Agents"
            options={counts.map((a) => [a, `${a} agents`])}
            value={count}
            onChange={setCount}
          />
        )
      }
      title="Where an Nx Agents run goes"
      caption={`${size} projects, ${count} agents. Boot installs dependencies and browsers on each agent.`}
      legend={[
        ['Agent boot', 'startup'],
        ['Tests', 'work'],
      ]}
      tooltip={tooltip}
    >
      {rows.length ? (
        <svg {...svgProps(W, H, 'Agent boot and test time per setup')}>
          <defs>
            <pattern
              id={pattern}
              width="7"
              height="7"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect
                width="7"
                height="7"
                fill="var(--nx-startup)"
                opacity="0.35"
              />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="7"
                stroke="var(--nx-startup)"
                strokeWidth="3.5"
              />
            </pattern>
          </defs>
          {rows.map((r, i) => {
            const y = i * (barH + gap);
            const segs = [
              {
                key: 'boot',
                w: x(r.boot_s),
                fill: `url(#${pattern})`,
                label: `boot ${secs(r.boot_s)}`,
              },
              {
                key: 'tests',
                w: x(r.tests_s),
                fill: 'var(--nx-work)',
                label: `tests ${secs(r.tests_s)}`,
              },
            ];
            let cursor = labelW;
            const tip = {
              title: `${VARIANT_LABEL[r.variant]} · ${count} agents`,
              rows: [
                {
                  label: 'Agent boot',
                  value: secs(r.boot_s),
                  colorKey: 'startup',
                },
                { label: 'Tests', value: secs(r.tests_s), colorKey: 'work' },
                { label: 'Whole run', value: secs(r.total_s) },
                { label: 'Agent time', value: agentMin(r.agent_min) },
              ],
            };
            return (
              <g key={r.variant} className={styles.hit} {...tooltip.bind(tip)}>
                <rect
                  x={0}
                  y={y - 4}
                  width={W}
                  height={barH + 8}
                  fill="transparent"
                />
                <text y={y + barH / 2} dy="0.35em" fontWeight={600}>
                  {SHORT[r.variant]}
                </text>
                {segs.map((g) => {
                  const x0 = cursor;
                  cursor += g.w;
                  return (
                    <g key={g.key}>
                      <rect
                        x={x0}
                        y={y}
                        width={Math.max(1, g.w - 2)}
                        height={barH}
                        rx={3}
                        fill={g.fill}
                      />
                      {g.w > textWidth(g.label, 12) + 10 && (
                        <text
                          x={x0 + g.w / 2 - 1}
                          y={y + barH / 2}
                          dy="0.35em"
                          textAnchor="middle"
                          fontSize={12}
                          className={styles.onBar}
                        >
                          {g.label}
                        </text>
                      )}
                    </g>
                  );
                })}
                <text
                  x={cursor + 6}
                  y={y + barH / 2}
                  dy="0.35em"
                  fontSize={12}
                  fontWeight={600}
                >
                  {secs(r.total_s)}
                </text>
              </g>
            );
          })}
          <g transform={`translate(0,${H - axisH + 6})`}>
            {top.map((t, i) => (
              <text
                key={t}
                x={labelW + x(t)}
                y={13}
                textAnchor={i === 0 ? 'start' : 'middle'}
                className={styles.muted}
                fontSize={12}
              >
                {`${fmt(t)} s`}
              </text>
            ))}
          </g>
        </svg>
      ) : (
        <p className={styles.caption}>Still running.</p>
      )}
    </Figure>
  );
};

/** Agent time per setup: every agent's whole run added up, boot included. */
export const AgentTimeChart = ({ agents: data }) => {
  const tooltip = useTooltip();
  const { size, sizes } = useSize(agentsBySize(data));
  const runs = VARIANTS.map(
    (v) =>
      data
        .filter((d) => d.size === size && d.variant === v)
        .sort((a, b) => b.agents - a.agents)[0]
  ).filter(Boolean);
  const items = runs.map((r) => ({
    label: SHORT[r.variant],
    value: r.agent_min,
    colorKey: r.variant,
    tip: {
      title: `${VARIANT_LABEL[r.variant]} · ${r.agents} agents`,
      rows: [
        { label: 'Agent time', value: agentMin(r.agent_min) },
        { label: 'Whole run', value: secs(r.total_s) },
      ],
    },
  }));
  return (
    <Figure
      size={size}
      sizes={sizes}
      title="Total agent time per setup"
      caption={`${size} projects, ${runs[0]?.agents ?? ''} agents. Every agent's whole run, boot included, added up.`}
      tooltip={tooltip}
    >
      <Bars items={items} format={agentMin} tooltip={tooltip} />
    </Figure>
  );
};

/* ---------------------------------------------------------------- experiment setup */

/** The experiment at a glance: tiles of [label, value, detail]. */
export const TestSetup = ({ items }) => (
  <dl className={styles.setup}>
    {items.map(([label, value, detail]) => (
      <div key={label}>
        <dt>{label}</dt>
        <dd>
          <b>{value}</b>
          {detail && <span>{detail}</span>}
        </dd>
      </div>
    ))}
  </dl>
);

/** Code blocks (MDX children) behind tabs, with an optional note per tab. */
export const CodeTabs = ({ labels, notes = [], children }) => {
  const [active, setActive] = useState(0);
  const panels = React.Children.toArray(children).filter(React.isValidElement);
  return (
    <div className={styles.codeTabs}>
      <div className={styles.tabList} role="tablist">
        {labels.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
          >
            {label}
          </button>
        ))}
      </div>
      {panels.map((panel, i) => (
        <div key={labels[i] ?? i} role="tabpanel" hidden={i !== active}>
          {notes[i] && <p className={styles.tabNote}>{notes[i]}</p>}
          {panel}
        </div>
      ))}
    </div>
  );
};

/** A collapsible block for details most readers can skip. */
export const Details = ({ summary, children }) => (
  <details className={styles.details}>
    <summary>{summary}</summary>
    <div>{children}</div>
  </details>
);
