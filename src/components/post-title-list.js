import React from 'react';
import { Link } from 'gatsby';
import * as styles from './post-title-list.module.css';

/**
 * Compact list of posts: title and date only. Used on the home page, where
 * the full previews (description, tags) would compete with the rest.
 * Expects `frontmatter.year` and a year-less `frontmatter.date`; the year is
 * shown once, on the first post of each year.
 */
export const PostTitleList = ({ nodes }) => (
  <ul className={styles.list}>
    {nodes.map((node, index) => {
      const { title, date, year, draft } = node.frontmatter;
      const isFirstOfYear =
        index === 0 || nodes[index - 1].frontmatter.year !== year;
      return (
        <li key={node.id} className={styles.item}>
          <span className={styles.year} aria-hidden={!isFirstOfYear}>
            {isFirstOfYear ? year : ''}
          </span>
          <div className={styles.row}>
            <span className={styles.date}>
              {draft ? (
                'Draft'
              ) : (
                <>
                  {date}
                  <span className={styles.dateYear}>, {year}</span>
                </>
              )}
            </span>
            <Link className={styles.link} to={node.fields.slug} title={title}>
              {title}
            </Link>
          </div>
        </li>
      );
    })}
  </ul>
);
