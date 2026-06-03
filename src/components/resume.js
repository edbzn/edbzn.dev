import React, { useState } from 'react';
import * as css from './resume.module.css';

export const Resume = ({ experiences }) => {
  const [showAll, setShowAll] = useState(false);
  const displayedExperiences = showAll ? experiences : experiences.slice(0, 3);

  const isCurrent = (period) => {
    return period && period.toLowerCase().includes('today');
  };

  return (
    <>
      <section>
        {displayedExperiences.map((experience, index) => (
          <div
            key={index}
            className={`${css.container} ${isCurrent(experience.period) ? css.current : ''}`}
          >
            {experience.url ? (
              <a
                href={experience.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${css.content} ${css.blockLink} ${index === 2 && !showAll ? css.partial : ''}`}
              >
                <p>{experience.period}</p>
                <div className={css.companyHeader}>
                  {experience.logo && (
                    <img
                      src={experience.logo}
                      alt={`${experience.company} logo`}
                      className={css.logo}
                    />
                  )}
                  <h3>{experience.company}</h3>
                </div>
                <p className={css.position}>{experience.position}</p>
              </a>
            ) : (
              <div
                className={`${css.content} ${index === 2 && !showAll ? css.partial : ''}`}
              >
                <p>{experience.period}</p>
                <div className={css.companyHeader}>
                  {experience.logo && (
                    <img
                      src={experience.logo}
                      alt={`${experience.company} logo`}
                      className={css.logo}
                    />
                  )}
                  <h3>{experience.company}</h3>
                </div>
                <p className={css.position}>{experience.position}</p>
              </div>
            )}
          </div>
        ))}
      </section>
      <div className={css.actions}>
        <button
          type="button"
          className={css.toggle}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show less' : 'Show more'}
          <svg
            className={`${css.chevron} ${showAll ? css.chevronOpen : ''}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    </>
  );
};
