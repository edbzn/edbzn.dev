import React from 'react';
import { Link } from 'gatsby';
import { LanguageIndicator } from './language-indicator';
import { slugifyTag } from './tags';
import * as styles from './post-preview.module.css';

/** One post of a list: title, description, then date and tags. */
export const PostPreview = ({ node }) => {
  return (
    <article className={styles.article}>
      <header>
        <h3
          className={styles.title}
          style={{
            marginTop: 0,
            marginBottom: 0,
            fontFamily: 'var(--font-sans)',
          }}
        >
          <Link
            className={styles.titleLink}
            to={node.fields.slug}
            title={node.frontmatter.title}
          >
            {node.frontmatter.title}
          </Link>
        </h3>
      </header>
      <p
        className={styles.description}
        dangerouslySetInnerHTML={{
          __html: node.frontmatter.description ?? node.excerpt,
        }}
      />
      <footer className={styles.meta}>
        {node.frontmatter.draft ? (
          <span>
            <span role="img" aria-label="emoji" alt="wip">
              🚧
            </span>{' '}
            Draft
          </span>
        ) : (
          <span>{node.frontmatter.date}</span>
        )}
        {(node.frontmatter.tags ?? []).map((tag) => (
          <Link
            key={tag}
            className={styles.tagLink}
            to={`/blog/tags/${slugifyTag(tag)}`}
          >
            #{slugifyTag(tag)}
          </Link>
        ))}
        <LanguageIndicator lang={node.frontmatter.lang} plain />
      </footer>
    </article>
  );
};

/**
 * Posts grouped by year, newest first, with the year as a small label above
 * each group. Expects `frontmatter.year` and nodes sorted by date.
 */
export const PostList = ({ nodes }) => {
  const groups = [];
  for (const node of nodes) {
    const { year } = node.frontmatter;
    const last = groups[groups.length - 1];
    if (last?.year === year) {
      last.posts.push(node);
    } else {
      groups.push({ year, posts: [node] });
    }
  }
  return groups.map(({ year, posts }) => (
    <section key={year} className={styles.yearGroup}>
      <h2 className={styles.year}>{year}</h2>
      {posts.map((node) => (
        <PostPreview key={node.id} node={node} />
      ))}
    </section>
  ));
};
