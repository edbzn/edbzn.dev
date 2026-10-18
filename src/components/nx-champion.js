import React from 'react';
import * as styles from './nx-champion.module.css';

// Expertise listed on my Nx Champion profile (https://nx.dev/community)
const expertise = [
  'Angular',
  'Architecture',
  'Automation',
  'Testing',
  'Devtools',
];

/**
 * Nx Champion sub-section: the badge, what the program is and my areas of
 * expertise, linking to the champions list on nx.dev.
 */
export const NxChampion = () => (
  <>
    <div className={styles.title}>Nx Champion</div>
    <a
      className={`box ${styles.card}`}
      href="https://nx.dev/community#champions"
    >
      <img
        className={styles.badge}
        src="/images/nx-badge-2025.png"
        alt="Nx Champion badge"
        width={55}
        height={64}
      />
      <span className={styles.body}>
        <span className={styles.text}>
          Recognized by the Nx team for promoting Nx in the community: I publish
          content, share my expertise and bring community feedback back to the
          team to help improve Nx.
        </span>
        <span className={styles.tags}>
          {expertise.map((area) => (
            <span key={area} className={styles.tag}>
              {area}
            </span>
          ))}
        </span>
      </span>
    </a>
  </>
);
