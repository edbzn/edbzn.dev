import React from 'react';
import { graphql, Link, useStaticQuery } from 'gatsby';
import * as styles from './open-source-summary.module.css';

// Fixed locale so the server and browser render the same text
const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/**
 * Home page teaser for /open-source: the project logos, their names and a
 * line of figures, the whole card linking to the page. Uses the same data as
 * the page (projects from the site metadata, npm downloads from
 * gatsby-node.js).
 */
export const OpenSourceSummary = () => {
  const { npmDownloads, site } = useStaticQuery(graphql`
    {
      npmDownloads {
        packageCount
        total
      }
      site {
        siteMetadata {
          ossProjects {
            name
            img
          }
        }
      }
    }
  `);

  const projects = site.siteMetadata.ossProjects;
  // One logo per organisation: several projects share theirs
  const logos = [...new Set(projects.map((p) => p.img).filter(Boolean))];
  const facts = [
    npmDownloads && `${compact.format(npmDownloads.total)} npm downloads`,
    npmDownloads && `${npmDownloads.packageCount} packages`,
    'Nx Champion',
  ].filter(Boolean);

  return (
    <Link className={`box ${styles.card}`} to="/open-source">
      <span className={styles.logos} aria-hidden="true">
        {logos.map((src) => (
          <img key={src} className={styles.logo} src={src} alt="" />
        ))}
      </span>
      <span className={styles.text}>
        <span className={styles.names}>
          {projects.map((p, index) => (
            <React.Fragment key={p.name}>
              {index > 0 && ' · '}
              <span className={styles.name}>{p.name.split('/')[1]}</span>
            </React.Fragment>
          ))}
        </span>
        <span className={styles.facts}>{facts.join(' · ')}</span>
      </span>
      <span className={styles.arrow} aria-hidden="true">
        →
      </span>
    </Link>
  );
};
