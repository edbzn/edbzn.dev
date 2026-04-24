const path = require(`path`);
const { createFilePath } = require(`gatsby-source-filesystem`);
const { generateOgImages } = require(`./scripts/generate-og-images`);

/**
 * @type {import('gatsby').GatsbyNode['createPages']}
 */
exports.createPages = async ({ graphql, actions }) => {
  const { createPage, createRedirect } = actions;

  const blogPost = path.resolve(`./src/templates/blog-post.js`);
  const blogList = path.resolve(`./src/pages/blog.js`);
  const result = await graphql(`
    {
      allMdx(sort: { frontmatter: { date: DESC } }, limit: 1000) {
        nodes {
          id
          published
          fields {
            slug
          }
          frontmatter {
            title
          }
          internal {
            contentFilePath
          }
        }
        group(field: { frontmatter: { tags: SELECT } }) {
          fieldValue
        }
      }
    }
  `);

  if (result.errors) {
    throw result.errors;
  }

  const posts = result.data.allMdx.nodes;
  const tags = result.data.allMdx.group;

  posts.forEach((post, index) => {
    if (!post.published) {
      return;
    }

    // Collect related posts to ensure at least 3 articles in navigation
    const relatedPosts = [];

    // Add next posts (newer)
    for (let i = index - 1; i >= 0 && relatedPosts.length < 3; i--) {
      if (posts[i].published) {
        relatedPosts.push({ ...posts[i], relation: 'next' });
      }
    }

    // Add previous posts (older) if we don't have 3 yet
    for (let i = index + 1; i < posts.length && relatedPosts.length < 3; i++) {
      if (posts[i].published) {
        relatedPosts.push({ ...posts[i], relation: 'previous' });
      }
    }

    // For compatibility, extract next and previous
    const next = relatedPosts.find((p) => p.relation === 'next') || null;
    const previous =
      relatedPosts.find((p) => p.relation === 'previous') || null;

    const oldPath = post.fields.slug.replace(/^\/blog/, '');
    createRedirect({
      fromPath: oldPath,
      toPath: post.fields.slug,
      isPermanent: true,
    });
    createPage({
      path: post.fields.slug,
      component: `${blogPost}?__contentFilePath=${post.internal.contentFilePath}`,
      context: {
        id: post.id,
        slug: post.fields.slug,
        previous,
        next,
        relatedPosts: relatedPosts.map((p) => ({
          id: p.id,
          fields: p.fields,
          frontmatter: p.frontmatter,
        })),
      },
    });
  });

  tags.forEach((tag) => {
    const slugifiedTag = tag.fieldValue.toLowerCase().replace(/\s+/g, '-');
    createPage({
      path: `/tags/${slugifiedTag}`,
      component: blogList,
      context: {
        tag: tag.fieldValue,
      },
    });
  });
};

/**
 * @type {import('gatsby').GatsbyNode['onCreateNode']}
 */
exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type === `Mdx`) {
    const value = createFilePath({ node, getNode });
    createNodeField({
      name: `slug`,
      node,
      value: `/blog${value}`,
    });
  }
};

/**
 * @type {import('gatsby').GatsbyNode['createSchemaCustomization']}
 */
exports.createSchemaCustomization = ({ actions, schema }) => {
  const { createTypes } = actions;
  const typeDefs = [
    schema.buildObjectType({
      name: 'Mdx',
      fields: {
        published: {
          type: 'Boolean!',
          resolve: ({ frontmatter }) => {
            if (process.env.NODE_ENV !== 'production') {
              return true;
            }

            return !frontmatter.draft;
          },
        },
      },
      interfaces: ['Node'],
    }),
    `
    type MdxFrontmatter implements Node {
      canonical: String
      description: String
      tags: [String]
      draft: Boolean
      lang: String
      cover: File @fileByRelativePath
    }
    `,
  ];
  createTypes(typeDefs);
};

/**
 * Generate dynamic social preview images (1200×630 PNG) for every published
 * page and blog post. Images are written to `public/og/<slug>.png` and
 * referenced from the SEO component via a pathname-derived URL.
 *
 * @type {import('gatsby').GatsbyNode['onPostBuild']}
 */
exports.onPostBuild = async ({ graphql, store, reporter }) => {
  const { program, config } = store.getState();
  const publicDir = path.join(program.directory, 'public');
  const siteMetadata = (config && config.siteMetadata) || {};

  const result = await graphql(`
    {
      allMdx(filter: { published: { eq: true } }) {
        nodes {
          fields {
            slug
          }
          excerpt(pruneLength: 160)
          frontmatter {
            title
            description
            tags
          }
        }
        group(field: { frontmatter: { tags: SELECT } }) {
          fieldValue
        }
      }
    }
  `);

  if (result.errors) {
    reporter.panicOnBuild(
      'Error querying MDX nodes for social preview generation',
      result.errors
    );
    return;
  }

  const posts = result.data.allMdx.nodes.map((node) => ({
    pathname: node.fields.slug,
    title: node.frontmatter.title,
    description: node.frontmatter.description || node.excerpt,
    tags: node.frontmatter.tags,
    kind: 'article',
  }));

  const tagPages = result.data.allMdx.group.map((g) => {
    const slugifiedTag = g.fieldValue.toLowerCase().replace(/\s+/g, '-');
    return {
      pathname: `/tags/${slugifiedTag}`,
      title: `${g.fieldValue} posts`,
      description: siteMetadata.description,
      tags: [g.fieldValue],
      kind: 'page',
    };
  });

  const staticPages = [
    {
      pathname: '/',
      title: 'About me',
      description: siteMetadata.description,
      kind: 'page',
    },
    {
      pathname: '/blog',
      title: 'All posts',
      description: siteMetadata.description,
      kind: 'page',
    },
    {
      pathname: '/404',
      title: 'Page Not Found',
      description: siteMetadata.description,
      kind: 'page',
    },
  ];

  await generateOgImages({
    publicDir,
    entries: [...staticPages, ...tagPages, ...posts],
    log: (msg) => reporter.info(msg),
  });
};
