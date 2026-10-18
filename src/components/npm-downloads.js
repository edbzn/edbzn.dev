import React, { useState } from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import * as styles from './npm-downloads.module.css';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// Fixed locale so the server and browser render the same text
const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const full = new Intl.NumberFormat('en-US');

/** `2026-09` → `Sep 2026` */
const monthLabel = (month) =>
  `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;

/** Round step for about four gridlines: 1, 2 or 5 times a power of ten. */
function niceStep(max) {
  const rough = max / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].find((m) => m * power >= rough);
  return step * power;
}

/**
 * Total downloads of my npm packages, with a monthly area chart. Data is
 * the committed history plus the days since, fetched at build time (see
 * `sourceNpmDownloads` in gatsby-node.js). Hover, or focus and use the
 * arrow keys, to read a month.
 */
export const NpmDownloads = ({ profileUrl }) => {
  const { npmDownloads } = useStaticQuery(graphql`
    {
      npmDownloads {
        packageCount
        total
        months {
          month
          downloads
        }
      }
    }
  `);
  const [active, setActive] = useState(null);

  if (!npmDownloads || npmDownloads.months.length < 2) {
    return null;
  }

  // Leading months before the first download add nothing
  const firstActive = npmDownloads.months.findIndex((m) => m.downloads > 0);
  const months = npmDownloads.months.slice(Math.max(firstActive, 0));
  const last = months.length - 1;
  const step = niceStep(Math.max(...months.map((m) => m.downloads)));
  const yMax =
    step * Math.ceil(Math.max(...months.map((m) => m.downloads)) / step);
  const ticks = Array.from({ length: yMax / step + 1 }, (_, i) => i * step);

  // Percent coordinates; the SVG stretches to the plot (non-scaling strokes)
  const x = (i) => (i / last) * 100;
  const y = (value) => 100 - (value / yMax) * 100;
  const line = months
    .map((m, i) => `${i ? 'L' : 'M'}${x(i)},${y(m.downloads)}`)
    .join(' ');
  const area = `${line} L100,100 L0,100 Z`;

  const years = months
    .map((m, i) => ({ year: m.month.slice(0, 4), i }))
    .filter(
      ({ year, i }) => i === 0 || months[i - 1].month.slice(0, 4) !== year
    )
    // A partial first year sits too close to the next label
    .filter(({ i }, index, all) => !(index === 0 && all[1] && all[1].i < 4));

  const point = active === null ? null : months[active];
  const indexAt = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    return Math.min(last, Math.max(0, Math.round(ratio * last)));
  };
  const onKeyDown = (event) => {
    const delta = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (delta) {
      event.preventDefault();
      setActive((i) => Math.min(last, Math.max(0, (i ?? last) + delta)));
    }
  };

  return (
    <>
      <div className={styles.title}>npm downloads</div>
      <div className={`box ${styles.card}`}>
        <div className={styles.header}>
          <div>
            <div className={styles.figure}>
              {compact.format(npmDownloads.total)}
            </div>
            <div className={styles.caption}>
              Total downloads of my {npmDownloads.packageCount} npm packages
              since {monthLabel(months[0].month)}
            </div>
          </div>
          <a
            href={profileUrl}
            className={`text-link text-link--muted ${styles.profile}`}
          >
            npm profile →
          </a>
        </div>

        <div className={styles.chartLabel}>Monthly downloads</div>
        <div
          className={styles.plot}
          role="img"
          aria-label={
            `Monthly npm downloads from ${monthLabel(months[0].month)} to ` +
            `${monthLabel(months[last].month)}, ` +
            `${full.format(months[last].downloads)} in the last month`
          }
          tabIndex={0}
          onPointerMove={(event) => setActive(indexAt(event))}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(last)}
          onBlur={() => setActive(null)}
          onKeyDown={onKeyDown}
        >
          {ticks.map((tick) => (
            <div
              key={tick}
              className={styles.gridline}
              style={{ top: `${y(tick)}%` }}
            >
              <span className={styles.tick}>{compact.format(tick)}</span>
            </div>
          ))}
          <svg
            className={styles.svg}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className={styles.area} d={area} />
            <path
              className={styles.line}
              d={line}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span
            className={styles.dot}
            style={{ left: '100%', top: `${y(months[last].downloads)}%` }}
          />
          {point && (
            <>
              <span
                className={styles.crosshair}
                style={{ left: `${x(active)}%` }}
              />
              <span
                className={styles.dot}
                style={{ left: `${x(active)}%`, top: `${y(point.downloads)}%` }}
              />
              <span
                className={styles.tooltip}
                style={
                  x(active) > 60
                    ? { right: `${100 - x(active)}%` }
                    : { left: `${x(active)}%` }
                }
              >
                <strong>{full.format(point.downloads)}</strong>
                <span>{monthLabel(point.month)}</span>
              </span>
            </>
          )}
        </div>
        <div className={styles.xAxis} aria-hidden="true">
          {years.map(({ year, i }) => (
            <span key={year} style={{ left: `${x(i)}%` }}>
              {year}
            </span>
          ))}
        </div>

        <table className={styles.visuallyHidden}>
          <caption>Monthly npm downloads</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Downloads</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month}>
                <td>{monthLabel(m.month)}</td>
                <td>{full.format(m.downloads)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
