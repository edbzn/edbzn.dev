import React from 'react';

import github from '../../static/icons/github.svg';
import linkedin from '../../static/icons/linkedin.svg';
import twitter from '../../static/icons/twitter.svg';
import bluesky from '../../static/icons/bluesky.svg';

export const Social = ({ social }) => {
  return (
    <div className="socials">
      <a
        style={{ boxShadow: 'none' }}
        href={social.bluesky}
        title="@edbzn.bsky.social on Bluesky"
      >
        <img
          src={bluesky}
          alt="Bluesky profile"
          className="social-icon-bluesky"
        />
      </a>
      <a
        style={{ boxShadow: 'none' }}
        href={social.twitter}
        title="@edbzn on X (Twitter)"
      >
        <img src={twitter} alt="X profile" className="social-icon-twitter" />
      </a>
      <a
        style={{ boxShadow: 'none' }}
        href={social.github}
        title="@edbzn on GitHub"
      >
        <img src={github} alt="Github profile" className="social-icon-github" />
      </a>
      <a
        style={{ boxShadow: 'none' }}
        href={social.linkedin}
        title="@edouardbozon on LinkedIn"
      >
        <img
          src={linkedin}
          alt="Linkedin profile"
          className="social-icon-linkedin"
        />
      </a>
    </div>
  );
};
