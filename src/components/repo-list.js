import React from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import { StarIcon } from './github-repo';
import * as styles from './repo-list.module.css';

/**
 * Grid of small cards under a small heading, a lighter version of the
 * project cards: a name, a two-line text and a meta row (stars). The whole
 * card is the link. Renders nothing when there are no items.
 */
const RepoCards = ({ title, items }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div className={styles.title}>{title}</div>
      <ul className={styles.grid}>
        {items.map((item) => (
          <li key={item.key}>
            <a className={`box ${styles.card}`} href={item.url}>
              <span className={styles.name} title={item.name}>
                {item.name}
              </span>
              {item.text && (
                <span className={styles.text} title={item.text}>
                  {item.text}
                </span>
              )}
              <span className={styles.meta} title={item.metaTitle}>
                {item.meta}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
};

/**
 * Smaller personal projects, most starred first. `projects` are
 * `owner/repo` names; stats are fetched at build time (see `sourceNodes` in
 * gatsby-node.js).
 */
export const SideProjectList = ({ projects }) => {
  const { allGitHubRepo } = useStaticQuery(graphql`
    {
      allGitHubRepo {
        nodes {
          name
          description
          stargazersCount
        }
      }
    }
  `);
  const items = projects
    .map((name) => ({
      name,
      ...allGitHubRepo.nodes.find((node) => node.name === name),
    }))
    .sort((a, b) => (b.stargazersCount ?? 0) - (a.stargazersCount ?? 0))
    .map((repo) => ({
      key: repo.name,
      name: repo.name.split('/')[1],
      url: `https://github.com/${repo.name}`,
      text: repo.description,
      meta: (
        <>
          <StarIcon />
          {repo.stargazersCount?.toLocaleString('en-US') ?? '—'}
        </>
      ),
      metaTitle:
        repo.stargazersCount == null ? 'GitHub stats unavailable' : 'Stars',
    }));

  return <RepoCards title="Side projects" items={items} />;
};
