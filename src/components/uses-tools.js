import React from 'react';
import * as styles from './uses-tools.module.css';

/** 1–3 letter badge for a tool: explicit override, else initials. */
const monogramFor = (item) => {
  if (item.monogram) return item.monogram;
  const words = item.name.split(/[\s+/.-]+/).filter(Boolean);
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  const word = words[0];
  return word[0].toUpperCase() + (word[1] || '').toLowerCase();
};

/** Host name shown as the link text, e.g. "vuejs.org". */
const hostOf = (url) =>
  url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');

/**
 * Grid of the tools listed on /uses, one block per category.
 *
 * Props:
 *   categories — [{ id, title, hue, items: [{ name, url?, description?, monogram? }] }]
 */
export const UsesTools = ({ categories = [] }) => (
  <div className={styles.root}>
    {categories.map((category) => (
      <section
        key={category.id}
        className={styles.group}
        style={{ '--hue': category.hue }}
      >
        <h3 className={styles.groupTitle}>{category.title}</h3>
        <ul className={styles.grid}>
          {category.items.map((item) => (
            <li key={item.name} className={styles.card}>
              <span className={styles.monogram} aria-hidden="true">
                {monogramFor(item)}
              </span>
              <span className={styles.text}>
                <span className={styles.name}>{item.name}</span>
                {item.description && (
                  <span className={styles.description}>{item.description}</span>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className={styles.host}>{hostOf(item.url)}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>
    ))}
  </div>
);

export default UsesTools;
