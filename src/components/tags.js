import React from 'react';
import { Link } from 'gatsby';
import { rhythm } from '../utils/typography';
import * as styles from './tags.module.css';

const slugifyTag = (tag) => tag.toLowerCase().replace(/\s+/g, '-');

export const Tags = ({ tags, style }) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.tagsContainer}
      style={{
        ...style,
      }}
    >
      {tags.map((tag) => (
        <Link
          key={slugifyTag(tag)}
          to={`/tags/${slugifyTag(tag)}`}
          className={styles.tag}
        >
          #{slugifyTag(tag)}
        </Link>
      ))}
    </div>
  );
};
