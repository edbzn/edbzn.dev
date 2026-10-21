import { graphql, useStaticQuery } from 'gatsby';
import { GatsbyImage } from 'gatsby-plugin-image';
import React from 'react';

import { Social } from './social';
import * as styles from './bio.module.css';

const Bio = ({ short = true }) => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      avatar: file(absolutePath: { regex: "/images/me.jpg/" }) {
        childImageSharp {
          gatsbyImageData(layout: FIXED, width: 88, height: 88)
        }
      }
      site {
        siteMetadata {
          author
          social {
            twitter
            github
            linkedin
            bluesky
          }
        }
      }
    }
  `);

  const { author, social } = data.site.siteMetadata;

  return (
    <div className={`bio box ${styles.bio}`}>
      <GatsbyImage
        image={data.avatar.childImageSharp.gatsbyImageData}
        className={styles.avatar}
        alt={author}
        style={{ width: 88, height: 88 }}
        imgStyle={{ borderRadius: '50%' }}
      />
      <p className={styles.name}>
        {author}
        <span className={styles.role}>Software engineer · France</span>
      </p>
      <p className={styles.text}>
        I build tools and workflows that help engineering teams scale their
        codebases and ship faster, with confidence.
      </p>
      <div className={styles.social}>
        <Social social={social} />
      </div>
    </div>
  );
};

export default Bio;
