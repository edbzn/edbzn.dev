import React from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import * as styles from './contribution-list.module.css';

/**
 * Latest commit on each of the public repositories I most recently
 * contributed to, as a table: short SHA, message, repository and date,
 * newest first. Commits are fetched at build time (see `sourceNodes` in
 * gatsby-node.js); renders nothing when there are none.
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
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Commit</th>
            <th>Message</th>
            <th>Project</th>
            <th className={styles.date}>Date</th>
          </tr>
        </thead>
        <tbody>
          {commits.map((commit) => (
            <tr key={commit.sha}>
              <td>
                <a className={styles.sha} href={commit.url}>
                  {commit.sha.slice(0, 7)}
                </a>
              </td>
              <td className={styles.message} title={commit.message}>
                <a className={styles.link} href={commit.url}>
                  {commit.message}
                </a>
              </td>
              <td>
                <a
                  className={styles.repo}
                  href={`https://github.com/${commit.repo}`}
                >
                  {commit.repo}
                </a>
              </td>
              <td className={styles.date}>{commit.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
