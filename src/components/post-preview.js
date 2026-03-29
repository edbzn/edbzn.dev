import React from 'react';
import { Link } from 'gatsby';
import { rhythm } from '../utils/typography';
import { Tags } from './tags';
import { LanguageIndicator } from './language-indicator';

export const PostPreview = ({ node }) => {
  return (
    <article key={node.fields.slug}>
      <header>
        <h3
          style={{
            marginTop: 0,
            marginBottom: 0,
            fontFamily: '"Public Sans", sans-serif',
          }}
        >
          <Link style={{ color: 'var(--text-primary)' }} to={node.fields.slug}>
            {node.frontmatter.title}
          </Link>
        </h3>
      </header>
      <section
        style={{
          marginTop: rhythm(1 / 4),
          marginBottom: 0,
        }}
      >
        <p
          style={{ marginBottom: 0 }}
          dangerouslySetInnerHTML={{
            __html: node.frontmatter.description ?? node.excerpt,
          }}
        />
      </section>
      <footer
        style={{
          fontSize: '14px',
          fontWeight: '100',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: rhythm(1 / 4),
            marginBottom: rhythm(1 / 4),
          }}
        >
          <Tags tags={node.frontmatter.tags} />
          <LanguageIndicator lang={node.frontmatter.lang} />
        </div>
        <div style={{ fontSize: '14px' }}>
          {node.frontmatter.draft ? (
            <span>
              <span role="img" aria-label="emoji" alt="wip">
                🚧
              </span>{' '}
              Draft
            </span>
          ) : (
            node.frontmatter.date
          )}
        </div>
      </footer>
    </article>
  );
};
