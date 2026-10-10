import { graphql } from 'gatsby';
import React from 'react';
import Layout from '../components/layout';
import { Seo } from '../components/seo';
import { GitHubRepo } from '../components/github-repo';
import { UsesTools } from '../components/uses-tools';
import { UsesAi } from '../components/uses-ai';
import { aiSurfaces, aiTools, usesCategories } from '../data/uses';
import { rhythm } from '../utils/typography';

const sectionHeadingStyle = {
  marginBottom: rhythm(1),
  fontFamily: '"Public Sans", sans-serif',
  textTransform: 'uppercase',
  fontWeight: '100',
};

const subheadingStyle = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.6rem',
  marginTop: 0,
  marginBottom: rhythm(0.6),
  fontFamily: '"Public Sans", sans-serif',
  fontWeight: '400',
  fontSize: '1.15rem',
  color: 'var(--text-primary)',
};

const subheadingNoteStyle = {
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
};

const dotfilesTextStyle = {
  fontFamily: '"Public Sans", sans-serif',
  fontSize: '0.95rem',
  color: 'var(--text-secondary)',
  marginBottom: rhythm(0.8),
};

class UsesPage extends React.Component {
  render() {
    const { data } = this.props;
    const { siteMetadata } = data.site;
    const { author, github } = siteMetadata;

    return (
      <Layout location={this.props.location} author={author} github={github}>
        <section>
          <div style={sectionHeadingStyle}>Uses</div>
          <p
            style={{
              fontFamily: '"Public Sans", sans-serif',
              marginBottom: rhythm(1.5),
              color: 'var(--text-secondary)',
            }}
          >
            Tools, software, and hardware I use daily for development.
          </p>

          <h2 style={subheadingStyle}>Toolbox</h2>
          <p style={dotfilesTextStyle}>
            My entire dev environment is automated with Ansible and GNU Stow.
          </p>
          <div style={{ marginBottom: rhythm(1) }}>
            <GitHubRepo
              name="edbzn/dotfiles"
              description="My dev environment provisioning scripts."
            />
          </div>
          <UsesTools categories={usesCategories} />

          <h2 style={subheadingStyle}>
            AI usage <span style={subheadingNoteStyle}>where it plugs in</span>
          </h2>
          <UsesAi
            categories={usesCategories}
            surfaces={aiSurfaces}
            tools={aiTools}
          />
        </section>
      </Layout>
    );
  }
}

export default UsesPage;

export const Head = ({ location }) => (
  <Seo
    title="Uses"
    description="Tools, software, and hardware I use daily for development."
    pathname={location.pathname}
  />
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
      }
    }
  }
`;
