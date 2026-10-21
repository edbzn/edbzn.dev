import React from 'react';
import { Link } from 'gatsby';
import PropTypes from 'prop-types';
import { rhythm } from '../utils/typography';

const style = {
  title: {
    fontSize: '1.1rem',
    marginBottom: rhythm(0.6),
    fontWeight: 'light',
  },
  ul: {
    listStyle: 'none',
    padding: '0',
    margin: 0,
  },
  nav: {
    margin: rhythm(2.4) + ' auto',
    fontFamily: 'var(--font-sans)',
  },
};

export const PostNav = ({ previous, next, relatedPosts }) => {
  // Use relatedPosts if available, otherwise fall back to previous/next
  const posts =
    relatedPosts && relatedPosts.length > 0
      ? relatedPosts
      : [next, previous].filter(Boolean);

  if (posts.length === 0) {
    return null;
  }

  return (
    <nav role="navigation" style={style.nav} className="post-nav">
      <div style={style.title}>Keep reading</div>
      <ul style={style.ul}>
        {posts.map((post, index) => (
          <li key={post.id || post.fields.slug}>
            <Link
              to={post.fields.slug}
              className="text-link text-link--underline"
              style={{
                fontWeight: '900',
                marginTop: index > 0 ? rhythm(0.6) : 0,
              }}
            >
              {post.frontmatter.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

PostNav.propTypes = {
  previous: PropTypes.object,
  next: PropTypes.object,
  relatedPosts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      fields: PropTypes.shape({
        slug: PropTypes.string.isRequired,
      }).isRequired,
      frontmatter: PropTypes.shape({
        title: PropTypes.string.isRequired,
      }).isRequired,
    })
  ),
};
