import { graphql } from 'gatsby';
import React, { useState, useEffect } from 'react';
import Giscus from '@giscus/react';
import { MDXProvider } from '@mdx-js/react';
import Bio from '../components/bio';
import Layout from '../components/layout';
import { Note } from '../components/note';
import { PostNav } from '../components/post-nav';
import { Seo } from '../components/seo';
import { Tags } from '../components/tags';
import { TableOfContents } from '../components/table-of-contents';
import { rhythm } from '../utils/typography';

const shortcodes = { Note };

const BlogPostTemplate = (props) => {
  const [giscusTheme, setGiscusTheme] = useState('light');

  useEffect(() => {
    const getGiscusTheme = () => {
      if (typeof window === 'undefined') return 'light';

      const savedTheme = localStorage.getItem('theme');
      const root = document.documentElement;
      const currentTheme = root.getAttribute('data-theme');

      // If manual theme is set, use it
      if (currentTheme === 'dark' || currentTheme === 'light') {
        return currentTheme;
      }

      // Otherwise check system preference
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        return 'dark';
      }

      return 'light';
    };

    const updateTheme = () => {
      setGiscusTheme(getGiscusTheme());
    };

    // Set initial theme
    updateTheme();

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          updateTheme();
        }
      });
    });

    if (typeof window !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });

      // Also listen to system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateTheme();
      mediaQuery.addEventListener('change', handleChange);

      return () => {
        observer.disconnect();
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, []);

  const post = props.data.mdx;
  const { author, github } = props.data.site.siteMetadata;
  const { previous, next, relatedPosts } = props.pageContext;
  const { location, children } = props;

  return (
    <Layout location={location} author={author} github={github}>
      <Seo
        title={post.frontmatter.title}
        description={post.frontmatter.description ?? post.excerpt}
        article={true}
        canonical={post.frontmatter.canonical}
      />
      <article>
        <header>
          <h1
            style={{
              marginTop: rhythm(1),
              marginBottom: 0,
            }}
          >
            {post.frontmatter.title}
          </h1>
          <Tags
            tags={post.frontmatter.tags}
            style={{
              marginTop: rhythm(0.5),
              marginBottom: rhythm(0.5),
            }}
          />
          <p
            style={{
              marginBottom: rhythm(2),
              fontWeight: 'lighter',
            }}
          >
            {post.frontmatter.draft ? (
              <strong>
                <span role="img" aria-label="emoji" alt="wip">
                  🚧
                </span>{' '}
                Draft
              </strong>
            ) : (
              post.frontmatter.date
            )}
          </p>
        </header>
        <TableOfContents headings={post.tableOfContents?.items} />
        <MDXProvider components={shortcodes}>
          <section style={{ marginBottom: rhythm(2) }}>{children}</section>
        </MDXProvider>
        <Giscus
          id="comments"
          repo="edbzn/edbzn.dev"
          repoId="MDEwOlJlcG9zaXRvcnk5OTQ4MDU0Mw=="
          category="Comments"
          categoryId="DIC_kwDOBe3z384CkeQh"
          mapping="pathname"
          strict="0"
          reactionsEnabled="0"
          emitMetadata="0"
          inputPosition="bottom"
          theme={giscusTheme}
          loading="lazy"
          lang="en"
          crossorigin="anonymous"
          async
        />
        <PostNav previous={previous} next={next} relatedPosts={relatedPosts} />
        <footer>
          <Bio />
        </footer>
      </article>
    </Layout>
  );
};

export default BlogPostTemplate;

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        author
        github {
          repositoryUrl
          sponsorUrl
        }
      }
    }
    mdx(published: { eq: true }, fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      tableOfContents
      frontmatter {
        description
        title
        date(formatString: "MMMM DD, YYYY")
        canonical
        draft
        tags
      }
    }
  }
`;
