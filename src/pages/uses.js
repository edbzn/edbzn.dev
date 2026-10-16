import { graphql } from 'gatsby';
import React from 'react';
import Layout from '../components/layout';
import { Seo } from '../components/seo';
import { GitHubRepo } from '../components/github-repo';
import { UsesTools } from '../components/uses-tools';
import { usesCategories } from '../data/uses';
import { rhythm } from '../utils/typography';

const sectionHeadingStyle = {
  marginBottom: rhythm(1),
  fontFamily: 'var(--font-sans)',
  textTransform: 'uppercase',
  fontWeight: '300',
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
              fontFamily: 'var(--font-sans)',
              marginBottom: rhythm(1),
              color: 'var(--text-secondary)',
            }}
          >
            Tools, software, and hardware I use daily for development. My entire
            dev environment is automated with Ansible and GNU Stow.
          </p>
          <div style={{ marginBottom: '2rem' }}>
            <GitHubRepo
              name="edbzn/dotfiles"
              description="My dev environment provisioning scripts."
            />
          </div>
          <UsesTools categories={usesCategories} />
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
