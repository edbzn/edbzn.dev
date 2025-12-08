import React, { useState } from 'react';
import * as css from './resume.module.css';

export const Resume = ({ experiences }) => {
  const [showAll, setShowAll] = useState(false);
  const displayedExperiences = showAll ? experiences : experiences.slice(0, 3);

  const downloadCV = () => {
    const link = document.createElement('a');
    link.href = '/cv-edouard-bozon.pdf';
    link.download = 'cv-edouard-bozon.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <button type="button" onClick={() => setShowAll(!showAll)}>
        {showAll ? 'Show Less' : 'Show more'}
      </button>
      <button type="button" onClick={() => downloadCV()}>
        Download CV
      </button>
    </>
  );
};
