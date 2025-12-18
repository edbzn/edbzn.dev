import React from 'react';
import { rhythm } from '../utils/typography';

export const Projects = ({ ossProjects }) => (
  <ul
    style={{
      margin: 0,
      listStyle: 'none',
      gap: rhythm(0.5),
      fontFamily: '"Public Sans", sans-serif',
    }}
  >
    {ossProjects.map((project) => (
      <li className="box" key={project.name}>
        <a
          href={project.url}
          style={{
            color: 'var(--text-primary)',
            fontWeight: 400,
            textDecoration: 'none',
            display: 'block',
            boxShadow: 'none',
          }}
        >
          <img
            style={{
              height: '34px',
              marginBottom: rhythm(0.3),
              display: 'block',
            }}
            alt="Project logo"
            src={project.img}
          />
          <div style={{ marginBottom: rhythm(0.2) }}>{project.name}</div>
          <p
            style={{ marginTop: rhythm(0.2), marginBottom: 0, fontWeight: 300 }}
          >
            {project.description}
          </p>
        </a>
      </li>
    ))}
  </ul>
);
