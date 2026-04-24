import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import { Seo } from '../components/seo';
import notFoundVideo from '../../static/images/404.webp';

class NotFoundPage extends React.Component {
  render() {
    const { author, github } = this.props.data.site.siteMetadata;

    return (
      <Layout location={this.props.location} author={author} github={github}>
        <h1>Not Found</h1>
        <img
          style={{ diplay: 'block', width: '100%' }}
          src={notFoundVideo}
          alt="Not Found"
        />
        <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
      </Layout>
    );
  }
}

export default NotFoundPage;

export const Head = () => <Seo title="Page Not Found" />;

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        author
        github {
          repositoryUrl
          sponsorUrl
          commitSha
        }
        title
      }
    }
  }
`;
