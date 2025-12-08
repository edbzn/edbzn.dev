import path from 'node:path';
import { fileURLToPath } from 'node:url';
import remarkGfm from 'remark-gfm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteUrl = `https://edbzn.dev`;

export default {
  siteMetadata: {
    siteUrl,
    url: siteUrl,
    titleTemplate: '%s · edbzn.dev',
    author: `Edouard Bozon`,
    description:
      'Edouard Bozon · A software engineer focusing on web development and platform engineering. I work extensively with Angular, Node.js, and Nx to build scalable applications. As an open source contributor, I focus on collaboration—whether improving code, sharing knowledge, or helping others learn. I enjoy solving problems with clean solutions and love working with teams and communities that innovate in web technology.',
    twitterUsername: '@edbzn',
    github: {
      sponsorUrl: 'https://github.com/sponsors/edbzn',
      repositoryUrl: 'https://github.com/edbzn/edbzn.github.io',
    },
    social: {
      twitter: `https://twitter.com/edbzn`,
      github: `https://github.com/edbzn`,
      linkedin: `https://www.linkedin.com/in/edouardbozon`,
      bluesky: `https://bsky.app/profile/edbzn.bsky.social`,
    },
    ossProjects: [
      {
        name: 'rx-angular/rx-angular',
        description: 'Reactive Extensions for Angular.',
        img: 'https://avatars.githubusercontent.com/u/70377545?s=200&v=4',
        url: 'https://github.com/rx-angular/rx-angular',
      },
      {
        name: 'nxext/nx-extensions',
        description:
          'Nx Extensions for Stencil, Svelte, SolidJS, Preact, Ionic, and Capacitor.',
        url: 'https://github.com/nxext/nx-extensions',
        img: 'https://avatars.githubusercontent.com/u/67255711?s=200&v=4',
      },
      {
        name: 'jscutlery/semver',
        description:
          'Nx plugin to automate semantic versioning and CHANGELOG generation.',
        url: 'https://github.com/jscutlery/semver',
        img: 'https://avatars.githubusercontent.com/u/55789006?s=200&v=4',
      },
      {
        name: 'jscutlery/devkit',
        description: 'Cutleries to help you cook better apps.',
        url: 'https://github.com/jscutlery/devkit',
        img: 'https://avatars.githubusercontent.com/u/55789006?s=200&v=4',
      },
      {
        name: 'jscutlery/nx-completion',
        description: 'Nx workspace completion plugin for Zsh.',
        url: 'https://github.com/jscutlery/nx-completion',
        img: 'https://avatars.githubusercontent.com/u/55789006?s=200&v=4',
      },
    ],
    experiences: [
      {
        company: 'Rosa',
        position: 'Software Engineer',
        period: '2025 - today',
        url: 'https://rosa.be',
      },
      {
        company: 'Push-Based',
        position: 'Software Engineer & Consultant',
        period: '2021 - 2024',
        url: 'https://push-based.io',
      },
      {
        company: 'Notilo Plus',
        position: 'Front-end Engineer',
        period: '2021 - 2021',
        url: 'https://www.notiloplus.com',
      },
      {
        company: 'Groupama',
        position: 'Full-stack Engineer',
        period: '2020 - 2021',
        url: 'https://www.groupama.com',
      },
      {
        company: 'Geolid',
        position: 'Front-end Engineer',
        period: '2019 - 2020',
        url: 'https://geolid.com',
      },
      {
        company: 'CoSpirit MediaTrack',
        position: 'Full-stack Engineer',
        period: '2016 - 2019',
        url: 'https://www.cospirit.com',
      },
      {
        company: 'Cybergraph',
        position: 'Web Developer',
        period: ' 2014 - 2015',
        url: 'https://www.cybergraph.fr',
      },
    ],
  },
  plugins: [
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        extensions: [`.md`, `.mdx`],
        gatsbyRemarkPlugins: [
          {
            resolve: `@raae/gatsby-remark-oembed`,
            options: {
              usePrefix: true,
              providers: {
                include: ['Twitter', 'YouTube'],
              },
            },
          },
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 698, // 698 is the width of the container
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          {
            resolve: `gatsby-remark-mermaid`,
            options: /** @type {import('gatsby-remark-mermaid').Options} */ ({
              mermaidConfig: {
                theme: 'neutral',
                look: 'handDrawn',
              },
            }),
          },
          `gatsby-plugin-remark-shiki`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
          `gatsby-remark-autolink-headers`,
        ],
        mdxOptions: {
          remarkPlugins: [remarkGfm],
        },
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/static/images`,
        name: `images`,
      },
    },
    `gatsby-plugin-meta-redirect`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-image`,
    `gatsby-plugin-preload-fonts`,
    {
      resolve: `gatsby-plugin-feed-mdx`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { site, allMdx } }) => {
              return allMdx.edges.map((edge) => {
                return Object.assign({}, edge.node.frontmatter, {
                  description: edge.node.excerpt,
                  date: edge.node.frontmatter.date,
                  url: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  guid: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  custom_elements: [{ 'content:encoded': edge.node.excerpt }],
                });
              });
            },
            query: `{
  allMdx(
    filter: {published: {eq: true}}
    sort: {frontmatter: {date: DESC}}
  ) {
    edges {
      node {
        excerpt
        fields {
          slug
        }
        frontmatter {
          title
          date
        }
      }
    }
  }
}`,
            output: '/rss.xml',
            title: "edbzn.dev's RSS Feed",
          },
        ],
      },
    },
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `src/utils/typography`,
      },
    },
    `gatsby-plugin-sitemap`,
    {
      resolve: 'gatsby-plugin-robots-txt',
      options: {
        host: siteUrl,
        sitemap: siteUrl + '/sitemap-index.xml',
        policy: [{ userAgent: '*', allow: '/' }],
      },
    },
    {
      resolve: `gatsby-plugin-google-gtag`,
      options: {
        trackingIds: ['G-37Y43LZTLM'],
      },
    },
    {
      resolve: `gatsby-plugin-nprogress`,
      options: {
        color: `#000000`,
        showSpinner: true,
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        icon: `static/images/me.jpg`,
      },
    },
  ],
};
