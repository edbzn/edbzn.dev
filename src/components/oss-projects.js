import React from 'react';
import { rhythm } from '../utils/typography';
import { GitHubRepo } from './github-repo';

export const Projects = ({ ossProjects }) => (
  <ul
    style={{
      margin: 0,
      padding: 0,
      listStyle: 'none',
      display: 'grid',
      gap: rhythm(0.5),
      fontFamily: '"Public Sans", sans-serif',
    }}
  >
    {ossProjects.map((project) => (
      <li key={project.name}>
        <GitHubRepo
          name={project.name}
          description={project.description}
          url={project.url}
          img={project.img}
        />
      </li>
    ))}
  </ul>
);
