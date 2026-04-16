import { graphql, useStaticQuery } from 'gatsby';
import { GatsbyImage } from 'gatsby-plugin-image';
import React from 'react';

import { rhythm } from '../utils/typography';
import { Social } from './social';

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
      <div
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
          {short && (
            <div style={{ marginTop: rhythm(0.4) }}>
              <Social social={social} />
            </div>
          )}
        </div>
      </div>
      {!short && (
        <div style={{ marginTop: rhythm(0.6) }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 'lighter',
            }}
          >
            I'm an active open source contributor, maintaining projects like{' '}
            <a
              href="https://github.com/jscutlery/semver"
              style={{ color: 'inherit' }}
            >
              @jscutlery/semver
            </a>{' '}
            for automated semantic versioning in Nx workspaces, and contributing
            to the broader <em>Nx</em> and <em>Angular</em> ecosystems through
            plugins, developer tooling, and build infrastructure like{' '}
            <em>Rspack</em> and <em>Module Federation</em>.
          </p>
          <p
            style={{
              margin: 0,
              marginTop: rhythm(0.4),
              fontSize: 14,
              fontWeight: 'lighter',
            }}
          >
            Beyond code, I enjoy benchmarking developer tools, crafting dev
            environment setups, and exploring ways to improve CI/CD pipelines
            and developer experience at scale.
          </p>
          <div style={{ marginTop: rhythm(0.8) }}>
            <Social social={social} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Bio;
