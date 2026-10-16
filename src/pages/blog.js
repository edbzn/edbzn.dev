import { graphql, Link } from 'gatsby';
import React from 'react';
import Layout from '../components/layout';
import { Seo } from '../components/seo';
import { PostPreview } from '../components/post-preview';
import { TagIndex } from '../components/tag-index';
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
        <TagIndex posts={data.allMdx.nodes} activeTag={tag}>
          {!tag && (
            <section style={{ marginTop: rhythm(2) }}>
              <div
                style={{
                  marginBottom: rhythm(1.4),
                  fontFamily: 'var(--font-sans)',
                  textTransform: 'uppercase',
                  fontWeight: '300',
                }}
              >
                Blog ideas
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  marginBottom: rhythm(0.8),
                  color: 'var(--text-primary)',
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
                fontFamily: 'var(--font-sans)',
                textTransform: 'uppercase',
                fontWeight: '300',
              }}
            >
              {tag ? `#${tag}` : 'All posts'}
            </div>
            <div style={{ marginTop: rhythm(1.4) }}>
              {blogPosts.map((node) => (
                <PostPreview key={node.id} node={node} />
              ))}
            </div>
          </section>
        </TagIndex>
      </Layout>
    );
  }
}

export default BlogIndex;

export const Head = ({ pageContext: { tag }, location }) => (
  <Seo
    title={tag ? `${tag} posts` : 'All posts'}
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
        previewImage {
          publicURL
          childImageSharp {
            gatsbyImageData(
              width: 192
              aspectRatio: 1.6
              placeholder: BLURRED
              transformOptions: { cropFocus: CENTER }
            )
          }
        }
        frontmatter {
          cover {
            id
          }
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
