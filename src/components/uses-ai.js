import React, { useMemo, useState } from 'react';
import { UsesIcon, hostOf, monogramFor } from './uses-icons';
import * as styles from './uses-ai.module.css';

const surfaceIcons = { editor: 'editor', terminal: 'terminal', desktop: 'os' };

/**
 * Matrix of the AI tools on /uses × where they show up (editor, terminal,
 * desktop). Picking a surface highlights its column and the tools in it.
 *
 * Props:
 *   categories — same data as <UsesTools>, used to look tools up by name
 *   surfaces   — [{ id, label }]
 *   tools      — [{ name, surfaces: [surfaceId] }]
 */
export const UsesAi = ({ categories = [], surfaces = [], tools = [] }) => {
  const [focus, setFocus] = useState(null);

  const rows = useMemo(() => {
    const byName = new Map();
    categories.forEach((category) =>
      category.items.forEach((item) =>
        byName.set(item.name, { ...item, category })
      )
    );
    return tools
      .map((tool) => ({ ...byName.get(tool.name), surfaces: tool.surfaces }))
      .filter((row) => row.name);
  }, [categories, tools]);

  return (
    <div className={styles.root}>
      <div
        className={styles.surfaces}
        role="group"
        aria-label="Highlight where AI is used"
      >
        {surfaces.map((surface) => {
          const count = rows.filter((r) =>
            r.surfaces.includes(surface.id)
          ).length;
          const pressed = focus === surface.id;
          return (
            <button
              key={surface.id}
              type="button"
              className={styles.surface}
              aria-pressed={pressed}
              onClick={() => setFocus(pressed ? null : surface.id)}
            >
              <span className={styles.surfaceIcon}>
                <UsesIcon name={surfaceIcons[surface.id]} size={18} />
              </span>
              <span className={styles.surfaceLabel}>{surface.label}</span>
              <span className={styles.surfaceCount}>
                {count} {count === 1 ? 'tool' : 'tools'}
              </span>
            </button>
          );
        })}
      </div>

      <table className={styles.matrix}>
        <caption className={styles.srOnly}>
          AI tools and where they are used
        </caption>
        <thead>
          <tr>
            <th scope="col" className={styles.toolHead}>
              Tool
            </th>
            {surfaces.map((surface) => (
              <th
                key={surface.id}
                scope="col"
                className={`${styles.surfaceHead} ${
                  focus === surface.id ? styles.focused : ''
                }`}
              >
                {surface.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const lit = focus && row.surfaces.includes(focus);
            return (
              <tr
                key={row.name}
                className={lit ? styles.lit : focus ? styles.dim : ''}
                style={{ '--hue': row.category.hue }}
              >
                <th scope="row" className={styles.tool}>
                  <span className={styles.toolInner}>
                    <span className={styles.monogram} aria-hidden="true">
                      {monogramFor(row)}
                    </span>
                    <span className={styles.toolText}>
                      <span className={styles.toolName}>
                        {row.url ? (
                          <a
                            href={row.url}
                            className={styles.toolLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={hostOf(row.url)}
                          >
                            {row.name}
                            <span className={styles.srOnly}>
                              {' '}
                              (opens in a new tab)
                            </span>
                          </a>
                        ) : (
                          row.name
                        )}
                      </span>
                      {row.description && (
                        <span className={styles.toolDescription}>
                          {row.description}
                        </span>
                      )}
                    </span>
                  </span>
                </th>
                {surfaces.map((surface) => {
                  const used = row.surfaces.includes(surface.id);
                  return (
                    <td
                      key={surface.id}
                      className={`${styles.cell} ${
                        focus === surface.id ? styles.focused : ''
                      }`}
                    >
                      <span
                        className={used ? styles.dotOn : styles.dotOff}
                        aria-hidden="true"
                      />
                      <span className={styles.srOnly}>
                        {used ? 'Yes' : 'No'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UsesAi;
