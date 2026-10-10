import { graphql, Link } from 'gatsby';
import React from 'react';
import Bio from '../components/bio';
import Layout from '../components/layout';
import { Seo } from '../components/seo';
import { Projects } from '../components/oss-projects';
import { PostTitleList } from '../components/post-title-list';
import { Resume } from '../components/resume';
import { rhythm } from '../utils/typography';

class AboutMe extends React.Component {
  render() {
    const { data } = this.props;
    const { siteMetadata } = data.site;
    const { author, ossProjects, experiences, github } = siteMetadata;
    const blogPosts = data.allMdx.nodes;

    return (
      <Layout location={this.props.location} author={author} github={github}>
        <Bio short={false} />

        <section style={{ marginTop: rhythm(2) }}>
          <div
            style={{
              marginBottom: rhythm(1.4),
              fontFamily: '"Public Sans", sans-serif',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                fontWeight: '100',
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
              fontFamily: '"Public Sans", sans-serif',
              textTransform: 'uppercase',
              fontWeight: '100',
            }}
          >
            Latest posts
          </div>
          <PostTitleList nodes={blogPosts} />
          <Link
            to="/blog"
            style={{
              display: 'inline-block',
              marginTop: rhythm(0.8),
              fontFamily: '"Public Sans", sans-serif',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              boxShadow: 'none',
            }}
          >
            All posts →
          </Link>
        </section>

        <section className="projects" style={{ marginTop: rhythm(2) }}>
          <div
            style={{
              marginBottom: rhythm(1.4),
              fontFamily: '"Public Sans", sans-serif',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                fontWeight: '100',
              }}
            >
              Open source projects
            </span>{' '}
          </div>

          <Projects ossProjects={ossProjects} sponsorUrl={github.sponsorUrl} />
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
        github {
          repositoryUrl
          sponsorUrl
          commitSha
        }
        ossProjects {
          name
          description
          img
          url
        }
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
