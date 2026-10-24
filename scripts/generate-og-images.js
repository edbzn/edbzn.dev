/**
 * Build-time generator for dynamic social preview images (OpenGraph / Twitter).
 *
 * Renders a 1200×630 PNG for every page based on its title, description
 * and optional tags, styled to match the website's dark theme.
 *
 * Invoked from `gatsby-node.js`'s `onPostBuild` hook.
 */

const fs = require('node:fs');
const path = require('node:path');
const satori = require('satori').default ?? require('satori');
const { Resvg } = require('@resvg/resvg-js');
const { ogImageSlug } = require('../src/utils/og-image-path');
const { LOGO_SVG } = require('./og-logo');

const WIDTH = 1200;
const HEIGHT = 630;
const PADDING = 72;

// Dark palette — kept in sync with static/css/main.css `:root[data-theme='dark']`.
const DARK = {
  bg: '#2d2d2d',
  bgBottom: '#1e1e1e',
  text: 'rgba(255, 255, 255, 0.9)',
  textStrong: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.58)',
  border: 'rgba(255, 255, 255, 0.085)',
  tagBg: 'rgba(255, 255, 255, 0.1)',
};

const FONTSOURCE_DIR = path.join(
  __dirname,
  '..',
  'node_modules',
  '@fontsource'
);

const FONT_SPECS = [
  // Body font — Merriweather (same as blog article body text).
  {
    name: 'Merriweather',
    weight: 400,
    style: 'normal',
    path: path.join(
      FONTSOURCE_DIR,
      'merriweather',
      'files',
      'merriweather-latin-400-normal.woff'
    ),
  },
  {
    name: 'Merriweather',
    weight: 700,
    style: 'normal',
    path: path.join(
      FONTSOURCE_DIR,
      'merriweather',
      'files',
      'merriweather-latin-700-normal.woff'
    ),
  },
  // Heading/label font — Public Sans (same as site headings & nav).
  {
    name: 'Public Sans',
    weight: 400,
    style: 'normal',
    path: path.join(
      FONTSOURCE_DIR,
      'public-sans',
      'files',
      'public-sans-latin-400-normal.woff'
    ),
  },
  {
    name: 'Public Sans',
    weight: 700,
    style: 'normal',
    path: path.join(
      FONTSOURCE_DIR,
      'public-sans',
      'files',
      'public-sans-latin-700-normal.woff'
    ),
  },
  {
    name: 'Public Sans',
    weight: 800,
    style: 'normal',
    path: path.join(
      FONTSOURCE_DIR,
      'public-sans',
      'files',
      'public-sans-latin-800-normal.woff'
    ),
  },
];

let cachedFonts = null;
function loadFonts() {
  if (cachedFonts) return cachedFonts;
  cachedFonts = FONT_SPECS.map((f) => ({
    name: f.name,
    weight: f.weight,
    style: f.style,
    data: fs.readFileSync(f.path),
  }));
  return cachedFonts;
}

const LOGO_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString('base64')}`;

function truncate(text, max) {
  if (!text) return '';
  if (text.length <= max) return text;
  // Cut at the last whole word, without a trailing comma or colon.
  const cut = text.slice(0, max - 1);
  const word = cut.slice(0, cut.lastIndexOf(' ')) || cut;
  return `${word.replace(/[\s,;:]+$/, '')}…`;
}

function template({ title, description, tags, kind }) {
  const safeTitle = truncate(title, 120);
  const safeDescription = truncate(description, 200);
  const label = kind === 'article' ? 'Article' : 'edbzn.dev';

  return {
    type: 'div',
    props: {
      style: {
        // Satori adds the padding to width and height (content-box), so size
        // the content box explicitly to keep the card at WIDTH × HEIGHT.
        width: WIDTH - 2 * PADDING,
        height: HEIGHT - 2 * PADDING,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: PADDING,
        fontFamily: 'Merriweather',
        color: DARK.text,
        // The site's dark page: its raised surface fading to the page background.
        backgroundColor: DARK.bg,
        backgroundImage: `linear-gradient(180deg, ${DARK.bg} 0%, ${DARK.bgBottom} 100%)`,
      },
      children: [
        // Header: logo + label
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 20,
            },
            children: [
              {
                type: 'img',
                props: {
                  src: LOGO_DATA_URL,
                  width: 72,
                  height: 72,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'Public Sans',
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: DARK.textMuted,
                  },
                  children: label,
                },
              },
            ],
          },
        },
        // Main: title + description
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              marginBottom: 6,
              gap: 28,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'Public Sans',
                    fontSize: safeTitle.length > 70 ? 50 : 60,
                    fontWeight: 800,
                    lineHeight: 1.12,
                    letterSpacing: '-0.02em',
                    color: DARK.textStrong,
                  },
                  children: safeTitle,
                },
              },
              safeDescription
                ? {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        fontFamily: 'Public Sans',
                        fontSize: 28,
                        lineHeight: 1.5,
                        fontWeight: 400,
                        color: DARK.textMuted,
                      },
                      children: safeDescription,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        // Footer: tags
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            },
            children: (tags || []).slice(0, 4).map((tag) => ({
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  fontFamily: 'Public Sans',
                  fontSize: 22,
                  fontWeight: 600,
                  color: DARK.text,
                  backgroundColor: DARK.tagBg,
                  padding: '6px 16px',
                  border: `1px solid ${DARK.border}`,
                  borderRadius: 999,
                },
                children: `#${tag}`,
              },
            })),
          },
        },
      ],
    },
  };
}

async function renderOgImage(entry) {
  const svg = await satori(template(entry), {
    width: WIDTH,
    height: HEIGHT,
    fonts: loadFonts(),
  });

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
  })
    .render()
    .asPng();

  return png;
}

/**
 * Generate OG images for a list of entries into `<publicDir>/og/`.
 *
 * @param {object} options
 * @param {string} options.publicDir absolute path to the Gatsby public dir
 * @param {Array<{pathname: string, title: string, description?: string,
 *   tags?: string[], kind?: 'article' | 'page'}>} options.entries
 * @param {(msg: string) => void} [options.log]
 */
async function generateOgImages({ publicDir, entries, log = () => {} }) {
  const outDir = path.join(publicDir, 'og');
  fs.mkdirSync(outDir, { recursive: true });

  const seen = new Set();
  let count = 0;

  for (const entry of entries) {
    const slug = ogImageSlug(entry.pathname);
    if (seen.has(slug)) continue;
    seen.add(slug);

    try {
      const png = await renderOgImage(entry);
      fs.writeFileSync(path.join(outDir, `${slug}.png`), png);
      count += 1;
    } catch (err) {
      log(`Failed to generate OG image for ${entry.pathname}: ${err.message}`);
    }
  }

  log(`Generated ${count} social preview image(s) in ${outDir}`);
}

module.exports = { generateOgImages };
