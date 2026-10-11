import React from 'react';
import { Link } from 'gatsby';
import { slugifyTag } from './tags';
import * as styles from './tag-index.module.css';

/**
 * Every tag used by the given posts with its post count, most used first.
 * The tag of the current page (if any) is highlighted.
 *
 * Wraps the page content: below the wide breakpoint the tags render as pills
 * above the content; on wide screens they move into the right margin as a
 * sticky side block, like the post table of contents (pure CSS).
 */
export const TagIndex = ({ posts, activeTag, children }) => {
  const counts = new Map();
  for (const post of posts) {
    for (const tag of post.frontmatter.tags ?? []) {
      const slug = slugifyTag(tag);
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }

  const tags = [...counts].sort(
    ([a, countA], [b, countB]) => countB - countA || a.localeCompare(b)
  );
  if (tags.length === 0) return <>{children}</>;

  const activeSlug = activeTag ? slugifyTag(activeTag) : null;

  return (
    <div className={styles.layout}>
      <aside className={styles.rail}>
        <nav className={styles.wrapper} aria-label="Tags">
          <p className={styles.title}>Tags</p>
          <ul className={styles.list}>
            <li>
              <Link
                to="/blog"
                className={`${styles.tag} ${activeSlug ? '' : styles.active}`}
                aria-current={activeSlug ? undefined : 'page'}
              >
                All
                <span className={styles.count}>{posts.length}</span>
              </Link>
            </li>
            {tags.map(([slug, count]) => {
              const isActive = slug === activeSlug;
              return (
                <li key={slug}>
                  <Link
                    to={`/tags/${slug}`}
                    className={`${styles.tag} ${isActive ? styles.active : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    #{slug}
                    <span className={styles.count}>{count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      {children}
    </div>
  );
};
