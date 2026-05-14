import { graphql, useStaticQuery } from 'gatsby';
import { GatsbyImage } from 'gatsby-plugin-image';
import React from 'react';

import { rhythm } from '../utils/typography';
import { Social } from './social';
import * as styles from './bio.module.css';

const Bio = ({ short = true }) => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      avatar: file(absolutePath: { regex: "/images/me.jpg/" }) {
        childImageSharp {
          gatsbyImageData(layout: FIXED)
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
    <div className="bio box">
      <div className={styles.container}>
        <div className={`avatar ${styles.avatar}`}>
          <GatsbyImage
            image={data.avatar.childImageSharp.gatsbyImageData}
            layout="fixed"
            placeholder="none"
            width={84}
            height={84}
            alt={author}
            style={{
              marginTop: rhythm(0.4),
              marginBottom: 0,
              width: 84,
              height: 84,
              borderRadius: `50%`,
              margin: 0,
            }}
          />
        </div>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 'lighter',
            }}
          >
            I'm <span style={{ textDecoration: 'underline' }}>{author}</span>, a
            passionate <strong>software engineer</strong> based in France,
            specializing in <em>monorepo architectures</em>,{' '}
            <em>platform engineering</em>, <em>DevOps</em>, and{' '}
            <em>infrastructure</em>. I build tools and workflows that help
            engineering teams scale their codebases and ship software with
            confidence.
          </p>

          <div style={{ marginTop: rhythm(0.4) }}>
            <Social social={social} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bio;
