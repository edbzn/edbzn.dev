/**
 * Build-time generator for dynamic social preview images (OpenGraph / Twitter).
 *
 * Renders a 1200×630 PNG for every page based on its title, description
 * and optional tags, styled to match the website's "abyss" theme so the
 * social cards feel consistent with the site's dark identity.
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

// Abyss palette — kept in sync with static/css/main.css `[data-theme='abyss']`.
const ABYSS = {
  bgTop: '#000c18',
  bgMid: '#050a30',
  bgBottom: '#060621',
  accent: '#ffffff',
  text: '#ffffff',
  textStrong: '#e6ecf8',
  textMuted: 'rgba(141, 166, 216, 0.75)',
  border: 'rgba(89, 111, 153, 0.35)',
  tagBg: 'rgba(102, 136, 204, 0.1)',
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
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function template({ title, description, tags, kind }) {
  const safeTitle = truncate(title, 120);
  const safeDescription = truncate(description, 200);
  const label = kind === 'article' ? 'Article' : 'edbzn.dev';

  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px',
        fontFamily: 'Merriweather',
        color: ABYSS.text,
        // Layered background mimicking the site's abyss body:
        // a radial accent wash over a vertical abyss gradient.
        backgroundColor: ABYSS.bgTop,
        backgroundImage: [
          'radial-gradient(120% 80% at 30% 20%, rgba(34, 119, 255, 0.18), transparent 70%)',
          `linear-gradient(180deg, ${ABYSS.bgTop} 0%, ${ABYSS.bgMid} 40%, ${ABYSS.bgBottom} 100%)`,
        ].join(', '),
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
                    color: ABYSS.accent,
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
                    fontSize: safeTitle.length > 70 ? 58 : 70,
                    fontWeight: 800,
                    lineHeight: 1.12,
                    letterSpacing: '-0.02em',
                    color: ABYSS.textStrong,
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
                        fontFamily: 'Merriweather',
                        fontSize: 28,
                        lineHeight: 1.5,
                        fontWeight: 400,
                        color: ABYSS.textMuted,
                      },
                      children: safeDescription,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        // Footer: tags + signature
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 24,
              borderTop: `1px solid ${ABYSS.border}`,
              fontFamily: 'Public Sans, sans-serif',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                    maxWidth: '65%',
                  },
                  children: (tags || []).slice(0, 4).map((tag) => ({
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        fontFamily: 'Public Sans',
                        fontSize: 22,
                        fontWeight: 600,
                        color: ABYSS.text,
                        backgroundColor: ABYSS.tagBg,
                        padding: '6px 16px',
                        border: `1px solid ${ABYSS.border}`,
                        borderRadius: 999,
                      },
                      children: `#${tag}`,
                    },
                  })),
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: 'Public Sans',
                    fontSize: 26,
                    fontWeight: 700,
                    color: ABYSS.text,
                  },
                  children: 'Edouard Bozon · edbzn.dev',
                },
              },
            ],
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
