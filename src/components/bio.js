import { graphql, useStaticQuery } from 'gatsby';
import { GatsbyImage } from 'gatsby-plugin-image';
import React from 'react';

import { rhythm } from '../utils/typography';
import { Social } from './social';

const Bio = () => {
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
    <div
      className="bio box"
      style={{
        display: `flex`,
      }}
    >
      <div className="avatar" style={{ paddingRight: rhythm(0.7) }}>
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
        <p style={{ margin: 0, fontSize: 14, fontWeight: 'lighter' }}>
          I’m <span style={{ textDecoration: 'underline' }}>{author}</span>, a{' '}
          <strong>software engineer</strong> focusing on
          <em>web development</em> and <em>platform engineering</em>. I work
          extensively with Angular, Node.js, and Nx to build scalable
          applications. As an open source contributor, I love collaborating with
          people and enjoy solving problems with clean solutions.
        </p>
        <div style={{ marginTop: rhythm(0.4) }}>
          <Social social={social} />
        </div>
      </div>
    </div>
  );
};

export default Bio;
