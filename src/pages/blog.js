import { graphql, Link } from 'gatsby';
import React from 'react';
import Bio from '../components/bio';
import Layout from '../components/layout';
import { Seo } from '../components/seo';
import { PostPreview } from '../components/post-preview';
import { BlogIdeas } from '../components/blog-ideas';
import { blogIdeas } from '../data/blog-ideas';
import { rhythm } from '../utils/typography';

class BlogIndex extends React.Component {
  render() {
    const {
      data,
      pageContext: { tag },
    } = this.props;
    const { siteMetadata } = data.site;
    const { author, github } = siteMetadata;

    let blogPosts = data.allMdx.nodes;
    if (tag) {
      blogPosts = blogPosts.filter((post) =>
        (post.frontmatter.tags ?? []).includes(tag)
      );
    }

    return (
      <Layout location={this.props.location} author={author} github={github}>
        <Bio />
        {!tag && (
          <section style={{ marginTop: rhythm(2) }}>
            <div
              style={{
                marginBottom: rhythm(1.4),
                fontFamily: '"Public Sans", sans-serif',
                textTransform: 'uppercase',
                fontWeight: '100',
              }}
            >
              Blog ideas
            </div>
            <p
              style={{
                fontFamily: '"Public Sans", sans-serif',
                marginBottom: rhythm(0.8),
                color: 'var(--text-secondary, var(--text-primary))',
              }}
            >
              Upvote what you'd like me to write about next.
            </p>
            <BlogIdeas ideas={blogIdeas} />
          </section>
        )}
        <section role="main" style={{ marginTop: rhythm(2) }}>
          <div
            style={{
              marginBottom: rhythm(1.4),
              fontFamily: '"Public Sans", sans-serif',
              textTransform: 'uppercase',
              fontWeight: '100',
            }}
          >
            {tag ? `#${tag}` : 'All posts'}
          </div>
          {blogPosts.map((node) => (
            <div
              key={node.frontmatter.title}
              style={{ marginTop: rhythm(1.4) }}
            >
              <PostPreview node={node} />
            </div>
          ))}
        </section>
      </Layout>
    );
  }
}

export default BlogIndex;

export const Head = ({ pageContext: { tag } }) => (
  <Seo title={tag ? `${tag} posts` : 'All posts'} />
);

export const pageQuery = graphql`
  {
    site {
      siteMetadata {
        author
        github {
          repositoryUrl
          sponsorUrl
        }
      }
    }
    allMdx(
      filter: { published: { eq: true } }
      sort: { frontmatter: { date: DESC } }
    ) {
      nodes {
        id
        excerpt(pruneLength: 160)
        fields {
          slug
        }
        frontmatter {
          description
          date(formatString: "MMMM DD, YYYY")
          title
          draft
          tags
          lang
        }
      }
    }
  }
`;
