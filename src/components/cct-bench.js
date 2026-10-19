import React, { useRef, useState } from 'react';
import * as styles from './cct-bench.module.css';

/**
 * Dependency-free SVG charts for the "Five ways to compile Angular for Cypress Component
 * Testing" post. Every chart takes the post's data.json (medians of 3 cold runs, from
 * github.com/edbzn/cct-compiler-sandbox, results/runs.jsonl) and server-renders as static SVG;
 * hover (or tap) shows a tooltip once hydrated.
 */

// Display name and Angular compilation mode of each CCT_SETUP.
const SETUPS = {
  regular: { name: 'webpack', mode: 'JIT' },
  analog: { name: 'Analog', mode: 'JIT' },
  'analog-aot': { name: 'Analog', mode: 'AOT' },
  'angular-build': { name: '@angular/build', mode: 'AOT' },
  'angular-build-jit': { name: '@angular/build', mode: 'JIT' },
  oxc: { name: 'OXC', mode: 'AOT' },
  swc: { name: 'SWC', mode: 'JIT' },
};
const setupLabel = (key) => `${SETUPS[key].name} ${SETUPS[key].mode}`;

const PASSES = [
  ['all', 'App + stress'],
  ['scale', 'Stress, 300'],
  ['scale1000', 'Stress, 1000'],
];
const PASS_LABEL = Object.fromEntries(PASSES);

const color = (key) => `var(--cct-${key})`;

const niceStep = (raw) => {
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
};
const ticksFor = (max, count = 5) => {
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
const secs = (v) => `${fmt(v, 1)} s`;
const gb = (mb) => `${fmt(mb / 1000, 2)} GB`;
// Signed change from base, e.g. −60% or +17%.
const pct = (v, base) => {
  const p = Math.round((v / base - 1) * 100);
  return p === 0 ? '±0%' : `${p > 0 ? '+' : '−'}${Math.abs(p)}%`;
};
const range = ([, min, max], format) => `${format(min)} – ${format(max)}`;

// Setup keys sorted by a value, smallest first.
const sortedBy = (byKey, value) =>
  Object.keys(SETUPS)
    .filter((k) => byKey[k])
    .sort((a, b) => value(byKey[a]) - value(byKey[b]));

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
  return { ref, tip, hide, bind };
};

const Tooltip = ({ tip }) => {
  if (!tip) return null;
  const flip = tip.x > tip.width - 260;
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
      <div className={styles.tooltipTitle}>{tip.title}</div>
      {tip.rows.map((r) => (
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

const PassToggle = ({ pass, onChange }) => (
  <Toggle label="Specs" options={PASSES} value={pass} onChange={onChange} />
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

// The chart's numbers as a table, for screen readers. columns: [header, row => cell]
const DataTable = ({ caption, rows, columns }) => (
  <table className={styles.visuallyHidden}>
    <caption>{caption}</caption>
    <thead>
      <tr>
        <th scope="col">Setup</th>
        {columns.map(([header]) => (
          <th key={header} scope="col">
            {header}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((key) => (
        <tr key={key}>
          <th scope="row">{setupLabel(key)}</th>
          {columns.map(([header, cell]) => (
            <td key={header}>{cell(key)}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const Figure = ({ title, caption, controls, legend, tooltip, children }) => (
  <figure
    className={styles.figure}
    ref={tooltip?.ref}
    onPointerLeave={tooltip?.hide}
  >
    <div className={styles.head}>
      <div className={styles.title}>{title}</div>
      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
    {controls && <div className={styles.controls}>{controls}</div>}
    {legend && <Legend items={legend} />}
    <div className={styles.scroll}>{children}</div>
    {tooltip && <Tooltip tip={tooltip.tip} />}
  </figure>
);

/* ---------------------------------------------------------------- shared bar layout */

const W = 680;
const LABEL_W = 160;
const BAR_H = 22;
const GAP = 14;
const AXIS_H = 22;

const svgProps = (H, label) => ({
  className: styles.svg,
  viewBox: `0 0 ${W} ${H}`,
  role: 'img',
  'aria-label': label,
});

// Setup name, then its compilation mode right-aligned in the label column.
const RowLabel = ({ setup, y }) => (
  <>
    <text y={y} dy="0.35em" fontWeight={600}>
      {SETUPS[setup].name}
    </text>
    <text
      x={LABEL_W - 14}
      y={y}
      dy="0.35em"
      textAnchor="end"
      fontSize={11}
      className={styles.muted}
    >
      {SETUPS[setup].mode}
    </text>
  </>
);

// Hairline gridlines behind the bars and the tick labels under them, from x0 on.
const Axis = ({ ticks, x, plotH, format, x0 = LABEL_W }) => (
  <>
    {ticks.map((t) => (
      <line
        key={t}
        x1={x0 + x(t)}
        x2={x0 + x(t)}
        y1={-GAP / 2}
        y2={plotH}
        className={styles.gridline}
      />
    ))}
    <g transform={`translate(0,${plotH + 6})`}>
      {ticks.map((t, i) => (
        <text
          key={t}
          x={x0 + x(t)}
          y={13}
          textAnchor={i === 0 ? 'start' : 'middle'}
          className={styles.muted}
          fontSize={12}
        >
          {format(t)}
        </text>
      ))}
    </g>
  </>
);

/* ---------------------------------------------------------------- stacked bars */

/**
 * One stacked bar per setup, segments in order. segments: [key, label, colorKey];
 * parts(k): { key: seconds }; note(k): muted text after the total; tip(k): tooltip rows.
 */
const StackedRows = ({ rows, segments, parts, note, tip, tooltip, label }) => {
  const total = (k) => segments.reduce((sum, [key]) => sum + parts(k)[key], 0);
  const valueW =
    Math.max(
      ...rows.map((k) => textWidth(`${secs(total(k))} · ${note(k)}`, 12))
    ) + 14;
  const ticks = ticksFor(Math.max(...rows.map(total)));
  const top = ticks[ticks.length - 1];
  const x = (v) => (v / top) * (W - LABEL_W - valueW);
  const plotH = rows.length * (BAR_H + GAP) - GAP;
  return (
    <svg {...svgProps(plotH + AXIS_H, label)}>
      <Axis ticks={ticks} x={x} plotH={plotH} format={(t) => `${t} s`} />
      {rows.map((k, i) => {
        const y = i * (BAR_H + GAP);
        const p = parts(k);
        let cursor = LABEL_W;
        return (
          <g
            key={k}
            className={styles.hit}
            {...tooltip.bind({
              title: setupLabel(k),
              rows: [
                ...segments.map(([key, segLabel, colorKey]) => ({
                  label: segLabel,
                  value: secs(p[key]),
                  colorKey,
                })),
                ...tip(k),
              ],
            })}
          >
            <rect
              x={0}
              y={y - GAP / 2}
              width={W}
              height={BAR_H + GAP}
              fill="transparent"
            />
            <RowLabel setup={k} y={y + BAR_H / 2} />
            {segments.map(([key, , colorKey]) => {
              const x0 = cursor;
              const w = x(p[key]);
              cursor += w;
              return (
                <rect
                  key={key}
                  x={x0}
                  y={y}
                  width={Math.max(1, w - 2)}
                  height={BAR_H}
                  rx={3}
                  fill={color(colorKey)}
                />
              );
            })}
            <text x={cursor + 6} y={y + BAR_H / 2} dy="0.35em" fontSize={12}>
              <tspan fontWeight={600}>{secs(total(k))}</tspan>
              <tspan className={styles.muted}>{` · ${note(k)}`}</tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ---------------------------------------------------------------- wall time */

const SEGMENTS = [
  ['startup', 'Startup, until the first test runs', 'startup'],
  ['tests', 'Test bodies', 'tests'],
  ['rest', 'Loading the other specs, shutdown', 'rest'],
];

/** Wall time per setup, split into startup, test bodies and the rest. */
export const WallTimeChart = ({ data, pass: initial = 'all' }) => {
  const tooltip = useTooltip();
  const [pass, setPass] = useState(initial);
  const byKey = data[pass];
  const rows = sortedBy(byKey, (r) => r.wall[0]);
  const base = byKey.regular.wall[0];

  return (
    <Figure
      title="Total run time per setup"
      caption="From starting Cypress to its exit. Median of 3 cold runs, fastest first; the percentage compares with webpack."
      controls={<PassToggle pass={pass} onChange={setPass} />}
      legend={SEGMENTS.map(([, label, key]) => [label, key])}
      tooltip={tooltip}
    >
      <StackedRows
        rows={rows}
        segments={SEGMENTS}
        parts={(k) => {
          const r = byKey[k];
          return {
            startup: r.startup,
            tests: r.tests,
            rest: r.wall[0] - r.startup - r.tests,
          };
        }}
        note={(k) =>
          k === 'regular' ? 'baseline' : pct(byKey[k].wall[0], base)
        }
        tip={(k) => [
          { label: 'Wall time', value: secs(byKey[k].wall[0]) },
          { label: 'Range of the 3 runs', value: range(byKey[k].wall, secs) },
          {
            label: 'Compared with webpack',
            value: pct(byKey[k].wall[0], base),
          },
        ]}
        tooltip={tooltip}
        label={`Wall time per setup, ${PASS_LABEL[pass]}`}
      />
      <DataTable
        caption={`Wall time per setup, ${PASS_LABEL[pass]}, in seconds`}
        rows={rows}
        columns={[
          ['Wall time', (k) => secs(byKey[k].wall[0])],
          ['Startup', (k) => secs(byKey[k].startup)],
          ['Test bodies', (k) => secs(byKey[k].tests)],
          ['Compared with webpack', (k) => pct(byKey[k].wall[0], base)],
        ]}
      />
    </Figure>
  );
};

/* ---------------------------------------------------------------- startup phases */

// From spawning Cypress to the first test. The two Cypress phases share the neutral color.
const PHASES = [
  ['boot', 'Cypress boot', 'rest'],
  ['server', 'Dev server start', 'startup'],
  ['browser', 'Browser launch', 'rest'],
  ['spec', 'First spec: compile and load', 'tests'],
];

/** Startup per setup, split into its phases. */
export const StartupPhasesChart = ({ data, pass: initial = 'scale1000' }) => {
  const tooltip = useTooltip();
  const [pass, setPass] = useState(initial);
  const byKey = data[pass];
  const rows = sortedBy(byKey, (r) => r.startup);
  const fastest = byKey[rows[0]].startup;

  return (
    <Figure
      title="Time to the first test, by phase"
      caption="Phases between Cypress's own events, median of 3 cold runs. The percentage compares with the fastest."
      controls={<PassToggle pass={pass} onChange={setPass} />}
      legend={[
        ['Cypress boot and browser launch', 'rest'],
        ['Dev server start', 'startup'],
        ['First spec: compile and load', 'tests'],
      ]}
      tooltip={tooltip}
    >
      <StackedRows
        rows={rows}
        segments={PHASES}
        parts={(k) => byKey[k].phases}
        note={(k) =>
          k === rows[0] ? 'fastest' : pct(byKey[k].startup, fastest)
        }
        tip={(k) => [
          { label: 'Time to the first test', value: secs(byKey[k].startup) },
        ]}
        tooltip={tooltip}
        label={`Startup phases per setup, ${PASS_LABEL[pass]}`}
      />
      <DataTable
        caption={`Startup phases per setup, ${PASS_LABEL[pass]}, in seconds`}
        rows={rows}
        columns={PHASES.map(([key, label]) => [
          label,
          (k) => secs(byKey[k].phases[key]),
        ])}
      />
    </Figure>
  );
};

/* ---------------------------------------------------------------- startup */

/** Time to the first test with 300 and 1000 components: how startup grows with the project. */
export const StartupChart = ({ data }) => {
  const tooltip = useTooltip();
  const small = data.scale;
  const big = data.scale1000;
  const rows = sortedBy(big, (r) => r.startup);
  const growth = (k) => big[k].startup - small[k].startup;
  const valueW = 70;
  const ticks = ticksFor(Math.max(...rows.map((k) => big[k].startup)), 6);
  const top = ticks[ticks.length - 1];
  const x = (v) => (v / top) * (W - LABEL_W - valueW);
  const plotH = rows.length * (BAR_H + GAP) - GAP;
  const H = plotH + AXIS_H;

  return (
    <Figure
      title="Time to the first test, 300 vs 1000 components"
      caption="Cypress boot, dev server start, dependency pre-bundling and compiling the first spec. Median of 3 cold runs on the stress specs."
      legend={[
        ['300 components', 'small'],
        ['1000 components', 'big'],
      ]}
      tooltip={tooltip}
    >
      <svg
        {...svgProps(H, 'Time to the first test with 300 and 1000 components')}
      >
        <Axis ticks={ticks} x={x} plotH={plotH} format={(t) => `${t} s`} />
        {rows.map((k, i) => {
          const y = i * (BAR_H + GAP) + BAR_H / 2;
          const x0 = LABEL_W + x(small[k].startup);
          const x1 = LABEL_W + x(big[k].startup);
          const tip = {
            title: setupLabel(k),
            rows: [
              {
                label: '300 components',
                value: secs(small[k].startup),
                colorKey: 'small',
              },
              {
                label: '1000 components',
                value: secs(big[k].startup),
                colorKey: 'big',
              },
              { label: 'Growth', value: `+${secs(growth(k))}` },
            ],
          };
          return (
            <g key={k} className={styles.hit} {...tooltip.bind(tip)}>
              <rect
                x={0}
                y={y - (BAR_H + GAP) / 2}
                width={W}
                height={BAR_H + GAP}
                fill="transparent"
              />
              <RowLabel setup={k} y={y} />
              <line
                x1={x0}
                x2={x1}
                y1={y}
                y2={y}
                className={styles.connector}
              />
              <circle cx={x0} cy={y} r={5} fill={color('small')} />
              <circle cx={x1} cy={y} r={5} fill={color('big')} />
              <text
                x={x1 + 12}
                y={y}
                dy="0.35em"
                fontSize={12}
                className={styles.muted}
              >
                +{secs(growth(k))}
              </text>
            </g>
          );
        })}
      </svg>
      <DataTable
        caption="Time to the first test, in seconds"
        rows={rows}
        columns={[
          ['300 components', (k) => secs(small[k].startup)],
          ['1000 components', (k) => secs(big[k].startup)],
        ]}
      />
    </Figure>
  );
};

/* ---------------------------------------------------------------- memory */

/** Peak PSS of the whole Cypress process tree, per setup. */
export const MemoryChart = ({ data, pass: initial = 'scale1000' }) => {
  const tooltip = useTooltip();
  const [pass, setPass] = useState(initial);
  const byKey = data[pass];
  const rows = sortedBy(byKey, (r) => r.pss[0]);
  const base = byKey.regular.pss[0];
  const valueW = 70;
  const ticks = ticksFor(
    Math.max(...rows.map((k) => byKey[k].pss[0])) / 1000,
    4
  );
  const top = ticks[ticks.length - 1];
  const x = (gbValue) => (gbValue / top) * (W - LABEL_W - valueW);
  const plotH = rows.length * (BAR_H + GAP) - GAP;
  const H = plotH + AXIS_H;

  return (
    <Figure
      title="Peak memory per setup"
      caption="Peak PSS, sampled every second across the CLI, Electron and the dev server. Median of 3 cold runs."
      controls={<PassToggle pass={pass} onChange={setPass} />}
      tooltip={tooltip}
    >
      <svg {...svgProps(H, `Peak memory per setup, ${PASS_LABEL[pass]}`)}>
        <Axis ticks={ticks} x={x} plotH={plotH} format={(t) => `${t} GB`} />
        {rows.map((k, i) => {
          const r = byKey[k];
          const y = i * (BAR_H + GAP);
          const w = x(r.pss[0] / 1000);
          const tip = {
            title: `${setupLabel(k)} · ${PASS_LABEL[pass]}`,
            rows: [
              { label: 'Peak PSS', value: gb(r.pss[0]), colorKey: 'memory' },
              { label: 'Range of the 3 runs', value: range(r.pss, gb) },
              { label: 'Compared with webpack', value: pct(r.pss[0], base) },
            ],
          };
          return (
            <g key={k} className={styles.hit} {...tooltip.bind(tip)}>
              <rect
                x={0}
                y={y - GAP / 2}
                width={W}
                height={BAR_H + GAP}
                fill="transparent"
              />
              <RowLabel setup={k} y={y + BAR_H / 2} />
              <rect
                x={LABEL_W}
                y={y}
                width={w}
                height={BAR_H}
                rx={3}
                fill={color('memory')}
              />
              <text
                x={LABEL_W + w + 6}
                y={y + BAR_H / 2}
                dy="0.35em"
                fontSize={12}
                fontWeight={600}
              >
                {gb(r.pss[0])}
              </text>
            </g>
          );
        })}
      </svg>
      <DataTable
        caption={`Peak memory per setup, ${PASS_LABEL[pass]}`}
        rows={rows}
        columns={[['Peak PSS', (k) => gb(byKey[k].pss[0])]]}
      />
    </Figure>
  );
};

/* ---------------------------------------------------------------- known gaps */

const OXC_ISSUES =
  'https://github.com/voidzero-dev/oxc-angular-compiler/issues';
// The specs of src/known-gaps, one column each.
const GAPS = [
  ['override-component', <code>overrideComponent</code>],
  [
    'safe-navigation-event',
    <>
      OXC <a href={`${OXC_ISSUES}/585`}>#585</a>
    </>,
  ],
  [
    'library-safe-url',
    <>
      OXC <a href={`${OXC_ISSUES}/586`}>#586</a>
    </>,
  ],
];

const Status = ({ ok }) => (
  <span className={styles.status}>
    <svg
      className={styles.statusIcon}
      viewBox="0 0 16 16"
      aria-hidden="true"
      style={{ color: color(ok ? 'good' : 'critical') }}
    >
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path
        d={ok ? 'M4.5 8.2l2.3 2.3 4.7-4.9' : 'M5.3 5.3l5.4 5.4m0-5.4l-5.4 5.4'}
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
    <span className={styles.statusLabel}>{ok ? 'Works' : 'Fails'}</span>
  </span>
);

/** Which setup handles which known gap (src/known-gaps, run once per setup, never timed). */
export const GapMatrix = ({ data }) => {
  const failures = (k) =>
    GAPS.filter(([spec]) => data.gaps[k][spec].failed > 0).length;
  // Setups without a gap first; the sort keeps the order of SETUPS.
  const rows = Object.keys(SETUPS).sort((a, b) => failures(a) - failures(b));
  return (
    <Figure
      title="Known issues per setup"
      caption="One spec per known issue, run once per setup and never timed."
    >
      <table className={styles.matrix}>
        <thead>
          <tr>
            <th scope="col">Setup</th>
            <th scope="col">Mode</th>
            {GAPS.map(([spec, label]) => (
              <th key={spec} scope="col" className={styles.gap}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((k) => (
            <tr key={k}>
              <th scope="row">{SETUPS[k].name}</th>
              <td className={styles.mode}>{SETUPS[k].mode}</td>
              {GAPS.map(([spec]) => (
                <td key={spec}>
                  <Status ok={data.gaps[k][spec].failed === 0} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Figure>
  );
};

/* ---------------------------------------------------------------- in-browser JIT */

// Column labels: long names break after the slash.
const nameLines = (name) => name.replace('/', '/\n').split('\n');

/** Test bodies per setup as columns, AOT then JIT: JIT setups compile the templates here. */
export const JitCostChart = ({ data, pass: initial = 'scale1000' }) => {
  const tooltip = useTooltip();
  const [pass, setPass] = useState(initial);
  const byKey = data[pass];
  const group = (mode) =>
    sortedBy(byKey, (r) => r.tests).filter((k) => SETUPS[k].mode === mode);
  const groups = [
    ['AOT', group('AOT')],
    ['JIT', group('JIT')],
  ];
  const [left, topPad, labelH] = [48, 18, 58];
  const H = 300;
  const plotH = H - topPad - labelH;
  const ticks = ticksFor(
    Math.max(...Object.values(byKey).map((r) => r.tests)),
    3
  );
  const top = ticks[ticks.length - 1];
  const y = (v) => topPad + (1 - v / top) * plotH;
  const groupGap = 36;
  const count = groups.reduce((n, [, keys]) => n + keys.length, 0);
  const slot = (W - left - groupGap) / count;
  const barW = 24;
  let index = 0;
  const columns = groups.flatMap(([mode, keys], g) =>
    keys.map((k) => {
      const cx = left + slot * (index++ + 0.5) + g * groupGap;
      return { k, mode, cx };
    })
  );

  return (
    <Figure
      title="Time spent running the tests"
      caption="Time spent inside the tests of the 3 stress specs. Median of 3 cold runs."
      controls={
        <Toggle
          label="Specs"
          options={PASSES.slice(1)}
          value={pass}
          onChange={setPass}
        />
      }
      legend={[
        ['AOT: templates compiled by the dev server', 'aot'],
        ['JIT: templates compiled in the browser', 'jit'],
      ]}
      tooltip={tooltip}
    >
      <svg {...svgProps(H, `Test bodies per setup, ${PASS_LABEL[pass]}`)}>
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={left}
              x2={W}
              y1={y(t)}
              y2={y(t)}
              className={styles.gridline}
            />
            <text
              x={left - 8}
              y={y(t)}
              dy="0.35em"
              textAnchor="end"
              fontSize={12}
              className={styles.muted}
            >
              {t} s
            </text>
          </g>
        ))}
        {columns.map(({ k, mode, cx }) => {
          const r = byKey[k];
          const tip = {
            title: `${setupLabel(k)} · ${PASS_LABEL[pass]}`,
            rows: [
              {
                label: 'Test bodies',
                value: secs(r.tests),
                colorKey: mode.toLowerCase(),
              },
              { label: 'Time to the first test', value: secs(r.startup) },
            ],
          };
          return (
            <g key={k} className={styles.hit} {...tooltip.bind(tip)}>
              <rect
                x={cx - slot / 2}
                y={topPad}
                width={slot}
                height={plotH + labelH}
                fill="transparent"
              />
              <path
                d={`M${cx - barW / 2},${y(0)} V${y(r.tests) + 4} q0,-4 4,-4 h${barW - 8} q4,0 4,4 V${y(0)} Z`}
                fill={color(mode.toLowerCase())}
              />
              <text
                x={cx}
                y={y(r.tests) - 6}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
              >
                {secs(r.tests)}
              </text>
              <text
                x={cx}
                y={y(0) + 16}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
              >
                {nameLines(SETUPS[k].name).map((line, i) => (
                  <tspan key={line} x={cx} dy={i ? '1.15em' : 0}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
        {groups.map(([mode, keys]) => {
          const xs = columns.filter((c) => c.mode === mode).map((c) => c.cx);
          const [a, b] = [Math.min(...xs), Math.max(...xs)];
          return (
            <g key={mode}>
              <line
                x1={a - barW / 2}
                x2={b + barW / 2}
                y1={H - 14}
                y2={H - 14}
                className={styles.bracket}
              />
              <text
                x={(a + b) / 2}
                y={H - 2}
                textAnchor="middle"
                fontSize={11}
                className={styles.muted}
              >
                {mode}
              </text>
            </g>
          );
        })}
      </svg>
      <DataTable
        caption={`Test bodies per setup, ${PASS_LABEL[pass]}, in seconds`}
        rows={columns.map((c) => c.k)}
        columns={[['Test bodies', (k) => secs(byKey[k].tests)]]}
      />
    </Figure>
  );
};
