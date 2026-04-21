import React from 'react';
import * as styles from './bench-chart.module.css';

/**
 * Minimal dependency-free horizontal bar chart for benchmark results.
 *
 * Props:
 *   title         — chart title
 *   unit          — value unit appended to labels (e.g. "ms")
 *   data          — [{ label, value, highlight?: 'best' | 'regression' }]
 *   lowerIsBetter — when true (default), shorter bars = better
 *
 * Any bar after the "best" point (in display order) is automatically marked
 * as a regression (red). Explicit `highlight` on a data point overrides the
 * auto-detection.
 */
export const BenchChart = ({
  title,
  unit = 'ms',
  data = [],
  lowerIsBetter = true,
}) => {
  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const best = lowerIsBetter ? Math.min(...values) : Math.max(...values);
  // Prefer an explicit highlight="best" marker if provided; otherwise fall back
  // to the min/max of the dataset. This lets authors mark the intended sweet
  // spot even when later noisy data points technically beat it.
  const explicitBestIndex = data.findIndex((d) => d.highlight === 'best');
  const bestIndex =
    explicitBestIndex >= 0 ? explicitBestIndex : values.indexOf(best);

  return (
    <figure className={styles.figure}>
      {title && <figcaption className={styles.title}>{title}</figcaption>}
      <div className={styles.chart} role="table" aria-label={title}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          const isBest =
            d.highlight === 'best' ||
            (explicitBestIndex < 0 && !d.highlight && d.value === best);
          const isRegression =
            d.highlight === 'regression' || (!d.highlight && i > bestIndex);
          const barClass = [
            styles.bar,
            isBest ? styles.best : '',
            isRegression ? styles.regression : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div className={styles.row} key={d.label} role="row">
              <div className={styles.label} role="rowheader">
                {d.label}
              </div>
              <div className={styles.track} role="cell">
                <div className={barClass} style={{ width: `${pct}%` }} />
              </div>
              <div className={styles.value} role="cell">
                {d.value.toLocaleString()} {unit}
              </div>
            </div>
          );
        })}
      </div>
    </figure>
  );
};
