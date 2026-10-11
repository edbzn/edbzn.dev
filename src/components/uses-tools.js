import React from 'react';
import * as styles from './uses-tools.module.css';

/**
 * Grid of the tools listed on /uses, one block per category.
 *
 * Props:
 *   categories — [{ id, title, items: [{ name, url?, description? }] }]
 */
export const UsesTools = ({ categories = [] }) => (
  <div>
    {categories.map((category) => (
      <section key={category.id} className={styles.group}>
        <h3 className={styles.groupTitle}>{category.title}</h3>
        <ul className={styles.grid}>
          {category.items.map((item) => (
            <li key={item.name} className={styles.cell}>
              <ToolCard item={item} />
            </li>
          ))}
        </ul>
      </section>
    ))}
  </div>
);

const ToolCard = ({ item }) => {
  const content = (
    <>
      <span className={styles.name}>{item.name}</span>
      {item.description && (
        <span className={styles.description}>{item.description}</span>
      )}
    </>
  );

  return item.url ? (
    <a
      href={item.url}
      className={`${styles.card} ${styles.cardLink}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {content}
    </a>
  ) : (
    <div className={styles.card}>{content}</div>
  );
};

export default UsesTools;
