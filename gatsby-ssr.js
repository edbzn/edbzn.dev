import * as React from 'react';
// The same webpack loader as the client bundle, so these resolve to the hashed
// URLs the @fontsource stylesheets point at.
import merriweather400 from '@fontsource/merriweather/files/merriweather-latin-400-normal.woff2';
import publicSans400 from '@fontsource/public-sans/files/public-sans-latin-400-normal.woff2';

// Body text and the header/nav, on screen on every page. The other weights
// load on demand behind metric-matched fallbacks (static/css/fonts.css), and
// so does Fira Code: code blocks don't wrap, so its swap doesn't move them.
const preloadedFonts = [merriweather400, publicSans400].filter(
  // Files under the url-loader size limit are inlined as data URIs.
  (href) => !href.startsWith('data:')
);

export const onRenderBody = ({
  setHeadComponents,
  setPreBodyComponents,
  setHtmlAttributes,
}) => {
  setHtmlAttributes({ lang: 'en' });

  setHeadComponents([
    <title key="default-title">edbzn.dev</title>,
    ...preloadedFonts.map((href) => (
      <link
        rel="preload"
        href={href}
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
        key={href}
      />
    )),
  ]);

  // Prevent flash of wrong theme on page load
  setPreBodyComponents([
    <script
      key="theme-init"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const savedTheme = localStorage.getItem('theme') || 'abyss';
              document.documentElement.setAttribute('data-theme', savedTheme);
            } catch (e) {
              console.error('Error loading theme:', e);
            }
          })();
        `,
      }}
    />,
  ]);
};
