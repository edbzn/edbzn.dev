import React, { useState } from 'react';
import * as styles from './uses-tools.module.css';

const ALL = 'all';

/**
 * Category-filterable list of the tools listed on /uses.
 *
 * Props:
 *   categories — [{ id, title, items: [{ name, url?, description? }] }]
 *
 * Everything is rendered on the server with no filter applied, so the static
 * HTML holds the full list; filtering only hides categories once hydrated.
 */
export const UsesTools = ({ categories = [] }) => {
  const [active, setActive] = useState(ALL);

  const total = categories.reduce((sum, c) => sum + c.items.length, 0);
  const visible =
    active === ALL ? categories : categories.filter((c) => c.id === active);

  return (
    <div>
      <ul
        className={styles.filters}
        aria-label="Filter by category"
        data-uses-controls=""
      >
        <Filter
          label="All"
          count={total}
          pressed={active === ALL}
          onClick={() => setActive(ALL)}
        />
        {categories.map((category) => (
          <Filter
            key={category.id}
            label={category.title}
            count={category.items.length}
            pressed={active === category.id}
            onClick={() => setActive(category.id)}
          />
        ))}
      </ul>

      {visible.map((category) => (
        <section key={category.id} className={styles.group}>
          <h3 className={styles.groupTitle}>{category.title}</h3>
          <ul className={styles.list}>
            {category.items.map((item) => (
              <li key={item.name} className={styles.item}>
                {item.url ? (
                  <a
                    href={item.url}
                    className={styles.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.name}
                  </a>
                ) : (
                  <span className={styles.name}>{item.name}</span>
                )}
                {item.description && (
                  <span className={styles.description}>{item.description}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Without JS the filters do nothing, so hide them. */}
      <noscript>
        <style>{'[data-uses-controls]{display:none!important}'}</style>
      </noscript>
    </div>
  );
};

const Filter = ({ label, count, pressed, onClick }) => (
  <li>
    <button
      type="button"
      className={`${styles.filter} ${pressed ? styles.active : ''}`}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {label}
      <span className={styles.count}>{count}</span>
    </button>
  </li>
);

export default UsesTools;
