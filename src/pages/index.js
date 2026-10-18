import { graphql, Link } from 'gatsby';
import React from 'react';
import Bio from '../components/bio';
import Layout from '../components/layout';
import { Seo } from '../components/seo';
import { Projects } from '../components/oss-projects';
import { PostTitleList } from '../components/post-title-list';
import { Resume } from '../components/resume';
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

class AboutMe extends React.Component {
  render() {
    const { data } = this.props;
    const { siteMetadata } = data.site;
    const { author, ossProjects, sideProjects, experiences, github, npm } =
      siteMetadata;
    const blogPosts = data.allMdx.nodes;

    return (
      <Layout location={this.props.location} author={author} github={github}>
        <Bio short={false} />

        <section style={{ marginTop: rhythm(2) }}>
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
              Resume
            </span>
          </div>
          <Resume experiences={experiences} />
        </section>

        <section style={{ marginTop: rhythm(2) }}>
          <div
            style={{
              marginBottom: rhythm(1.4),
              fontFamily: 'var(--font-sans)',
              textTransform: 'uppercase',
              fontWeight: '300',
            }}
          >
            Latest posts
          </div>
          <PostTitleList nodes={blogPosts} />
          <Link
            to="/blog"
            className="text-link text-link--muted"
            style={{
              display: 'inline-block',
              marginTop: rhythm(0.8),
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
            }}
          >
            All posts →
          </Link>
        </section>

        <section className="projects" style={{ marginTop: rhythm(2) }}>
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

export default AboutMe;

export const Head = ({ location }) => (
  <Seo title="About me" pathname={location.pathname} />
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
        experiences {
          company
          position
          period
          url
          logo
        }
      }
    }
    allMdx(
      limit: 10
      filter: { published: { eq: true } }
      sort: { frontmatter: { date: DESC } }
    ) {
      nodes {
        id
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMM DD")
          year: date(formatString: "YYYY")
          title
          draft
        }
      }
    }
  }
`;
