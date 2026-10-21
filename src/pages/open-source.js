import { graphql } from 'gatsby';
import React from 'react';
import Layout from '../components/layout';
import { Seo } from '../components/seo';
import { Projects } from '../components/oss-projects';
import { ContributionList } from '../components/contribution-list';
import { NpmDownloads } from '../components/npm-downloads';
import { NxChampion } from '../components/nx-champion';
import { SideProjectList } from '../components/repo-list';
import { rhythm } from '../utils/typography';

// "All …" link under a list
const moreLinkStyle = {
  display: 'inline-block',
  marginTop: rhythm(0.8),
  fontFamily: 'var(--font-sans)',
  fontSize: '0.85rem',
};

class OpenSourcePage extends React.Component {
  render() {
    const { data } = this.props;
    const { siteMetadata } = data.site;
    const { author, ossProjects, sideProjects, github, npm } = siteMetadata;

    return (
      <Layout location={this.props.location} author={author} github={github}>
        <section className="projects">
          <div
            style={{
              marginBottom: rhythm(1.4),
              fontFamily: 'var(--font-sans)',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                fontWeight: '300',
              }}
            >
              Open source
            </span>{' '}
          </div>
          <p
            style={{
              marginTop: rhythm(-0.9),
              marginBottom: rhythm(1),
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
            }}
          >
            Projects I've created or contributed to, as an external contributor
            or core maintainer.
          </p>

          <Projects ossProjects={ossProjects} sponsorUrl={github.sponsorUrl} />

          <NpmDownloads profileUrl={npm.profileUrl} />

          <NxChampion />

          <ContributionList />
          <a
            href={github.contributionsUrl}
            className="text-link text-link--muted"
            style={moreLinkStyle}
          >
            All contributions →
          </a>

          <SideProjectList projects={sideProjects} />
          <a
            href={github.reposUrl}
            className="text-link text-link--muted"
            style={moreLinkStyle}
          >
            All repositories →
          </a>
        </section>
      </Layout>
    );
  }
}

export default OpenSourcePage;

export const Head = ({ location }) => (
  <Seo
    title="Open source"
    description="Projects I've created or contributed to, as an external contributor or core maintainer."
    pathname={location.pathname}
  />
);

export const pageQuery = graphql`
  {
    site {
      siteMetadata {
        author
        npm {
          profileUrl
        }
        github {
          repositoryUrl
          sponsorUrl
          reposUrl
          contributionsUrl
          commitSha
        }
        ossProjects {
          name
          description
          img
          url
        }
        sideProjects
      }
    }
  }
`;
