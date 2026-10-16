const fs = require(`fs/promises`);
const path = require(`path`);
const { createFilePath } = require(`gatsby-source-filesystem`);
const { generateOgImages } = require(`./scripts/generate-og-images`);

// Former tag slugs and the category each one was merged into.
const retiredTags = {
  ai: 'open-source',
  benchmark: 'performance',
  capacitor: 'mobile',
  dns: 'infrastructure',
  firmware: 'linux',
  'google-domains': 'infrastructure',
  heroku: 'infrastructure',
  http: 'javascript',
  i18n: 'angular',
  ionic: 'mobile',
  'lit-html': 'javascript',
  nixos: 'linux',
  nx: 'monorepo',
  react: 'javascript',
  rspack: 'tooling',
  rxjs: 'javascript',
  'service-worker': 'javascript',
  'software-development': 'open-source',
  'souveraineté-numérique': 'open-source',
  ssd: 'linux',
  'state-management': 'javascript',
  troubleshooting: 'linux',
  typescript: 'tooling',
  vite: 'tooling',
  vuejs: 'javascript',
  'web-components': 'javascript',
};

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

  // Tags merged into broader categories: keep the old tag pages working.
  Object.entries(retiredTags).forEach(([oldTag, category]) => {
    createRedirect({
      fromPath: `/tags/${oldTag}`,
      toPath: `/tags/${category}`,
      isPermanent: true,
    });
  });
};

const GITHUB_REPO_TTL = 24 * 60 * 60 * 1000;

/**
 * Collects every repository rendered with `<GitHubRepo>`: the OSS projects
 * from the site metadata, plus literal `name="owner/repo"` props found in
 * posts and pages.
 */
async function collectGitHubRepoNames(rootDir, siteMetadata) {
  const names = new Set(
    (siteMetadata.ossProjects || []).map((project) => project.name)
  );
  const pattern = /<GitHubRepo\b[^>]*?\bname=["']([^"']+)["']/g;

  for (const dir of ['content', 'src']) {
    const files = await fs.readdir(path.join(rootDir, dir), {
      recursive: true,
    });
    for (const file of files.filter((f) => /\.(md|mdx|js|jsx)$/.test(f))) {
      const source = await fs.readFile(path.join(rootDir, dir, file), 'utf8');
      for (const match of source.matchAll(pattern)) {
        names.add(match[1]);
      }
    }
  }

  return [...names];
}

async function fetchGitHubRepo(name) {
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(`https://api.github.com/repos/${name}`, {
    headers,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const repo = await res.json();
  const license = repo.license?.spdx_id;
  return {
    description: repo.description,
    language: repo.language,
    stargazersCount: repo.stargazers_count,
    forksCount: repo.forks_count,
    licenseSpdxId: license && license !== 'NOASSERTION' ? license : null,
    url: repo.html_url,
  };
}

/**
 * Fetches the GitHub stats shown on repo cards at build time, so they ship in
 * the HTML instead of being requested by every visitor. Responses are cached
 * for a day; when GitHub is unreachable or rate-limited the stale copy is
 * used, and a repo with no data at all is skipped (the card shows
 * placeholders). Set `GITHUB_TOKEN` to raise the rate limit.
 *
 * @type {import('gatsby').GatsbyNode['sourceNodes']}
 */
exports.sourceNodes = async ({
  actions,
  cache,
  store,
  reporter,
  createNodeId,
  createContentDigest,
}) => {
  const { program, config } = store.getState();
  const names = await collectGitHubRepoNames(
    program.directory,
    (config && config.siteMetadata) || {}
  );

  await Promise.all(
    names.map(async (name) => {
      const cacheKey = `github-repo-${name}`;
      const cached = await cache.get(cacheKey);
      let data = cached?.data;

      if (!cached || Date.now() - cached.fetchedAt > GITHUB_REPO_TTL) {
        try {
          data = await fetchGitHubRepo(name);
          await cache.set(cacheKey, { fetchedAt: Date.now(), data });
        } catch (error) {
          reporter.warn(
            `Could not fetch GitHub repo ${name} (${error.message}), ` +
              (data ? 'using cached data' : 'showing placeholders')
          );
        }
      }

      if (!data) {
        return;
      }

      const node = { name, ...data };
      actions.createNode({
        ...node,
        id: createNodeId(`GitHubRepo-${name}`),
        internal: {
          type: 'GitHubRepo',
          contentDigest: createContentDigest(node),
        },
      });
    })
  );
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

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

/**
 * Returns the path of the first image in a Markdown/MDX body that points to a
 * file next to the post (remote URLs are ignored), or null.
 */
function findFirstLocalImage(body = '') {
  const pattern =
    /!\[[^\]]*\]\(\s*<?([^)\s>]+)>?[^)]*\)|<img[^>]*\bsrc=["']([^"']+)["']/g;
  for (const match of body.matchAll(pattern)) {
    const src = match[1] ?? match[2];
    if (!/^([a-z]+:)?\/\//i.test(src) && IMAGE_EXTENSIONS.test(src)) {
      return src;
    }
  }
  return null;
}

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
        // Thumbnail for post lists: the `cover` frontmatter if set, otherwise
        // the first local image referenced in the post body.
        previewImage: {
          type: 'File',
          resolve: async (source, args, context) => {
            const src =
              source.frontmatter?.cover ?? findFirstLocalImage(source.body);
            if (!src) {
              return null;
            }
            const absolutePath = path.resolve(
              path.dirname(source.internal.contentFilePath),
              src
            );
            return context.nodeModel.findOne({
              type: 'File',
              query: { filter: { absolutePath: { eq: absolutePath } } },
            });
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
    // Declared up front so the query still works when every fetch failed.
    `
    type GitHubRepo implements Node @dontInfer {
      name: String!
      description: String
      language: String
      stargazersCount: Int
      forksCount: Int
      licenseSpdxId: String
      url: String
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
