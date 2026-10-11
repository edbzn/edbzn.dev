import React, { useMemo } from 'react';
import * as styles from './uses-ai.module.css';

/**
 * Table of the AI tools on /uses × where they show up (editor, terminal,
 * desktop).
 *
 * Props:
 *   categories — same data as <UsesTools>, used to look tools up by name
 *   surfaces   — [{ id, label }]
 *   tools      — [{ name, surfaces: [surfaceId] }]
 */
export const UsesAi = ({ categories = [], surfaces = [], tools = [] }) => {
  const rows = useMemo(() => {
    const byName = new Map();
    categories.forEach((category) =>
      category.items.forEach((item) => byName.set(item.name, item))
    );
    return tools
      .map((tool) => ({ ...byName.get(tool.name), surfaces: tool.surfaces }))
      .filter((row) => row.name);
  }, [categories, tools]);

  return (
    <table className={styles.matrix}>
      <caption className={styles.srOnly}>
        AI tools and where they are used
      </caption>
      <thead>
        <tr>
          <th scope="col">Tool</th>
          {surfaces.map((surface) => (
            <th key={surface.id} scope="col" className={styles.surface}>
              {surface.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <th scope="row" className={styles.tool}>
              {row.url ? (
                <a
                  href={row.url}
                  className={styles.toolLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {row.name}
                </a>
              ) : (
                row.name
              )}
            </th>
            {surfaces.map((surface) => {
              const used = row.surfaces.includes(surface.id);
              return (
                <td key={surface.id} className={styles.cell}>
                  <span
                    className={used ? styles.dotOn : styles.dotOff}
                    aria-hidden="true"
                  />
                  <span className={styles.srOnly}>{used ? 'Yes' : 'No'}</span>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UsesAi;
