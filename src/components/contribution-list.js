import React from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import * as styles from './contribution-list.module.css';

/**
 * Latest commit on each of the public repositories I most recently
 * contributed to: message, repository and date, newest first. Commits are
 * fetched at build time (see `sourceNodes` in gatsby-node.js); renders
 * nothing when there are none.
 */
export const ContributionList = () => {
  const { allGitHubCommit } = useStaticQuery(graphql`
    {
      allGitHubCommit(sort: { date: DESC }) {
        nodes {
          sha
          repo
          message
          date(formatString: "MMM D, YYYY")
          url
        }
      }
    }
  `);
  const commits = allGitHubCommit.nodes;

  if (commits.length === 0) {
    return null;
  }

  return (
    <>
      <div className={styles.title}>Latest contributions</div>
      <ul className={styles.list}>
        {commits.map((commit) => (
          <li key={commit.sha} className={styles.item}>
            <a
              className={styles.message}
              href={commit.url}
              title={commit.message}
            >
              {commit.message}
            </a>
            <a
              className={styles.repo}
              href={`https://github.com/${commit.repo}`}
            >
              {commit.repo}
            </a>
            <span className={styles.date}>{commit.date}</span>
          </li>
        ))}
      </ul>
    </>
  );
};
