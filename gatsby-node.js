const path = require(`path`);
const { createFilePath } = require(`gatsby-source-filesystem`);

/**
 * @type {import('gatsby').GatsbyNode['createPages']}
 */
exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;

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

    // TODO: create redirect
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
      value,
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
    }
    `,
  ];
  createTypes(typeDefs);
};
