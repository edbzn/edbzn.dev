import * as React from 'react';

export const onRenderBody = ({ setHeadComponents, setPreBodyComponents }) => {
  setHeadComponents(
    [
      'FiraCode-Regular',
      'FiraCode-Bold',
      'FiraCode-Medium',
      'FiraCode-Light',
    ].map((font) => (
      <link
        rel="preload"
        href={`/fonts/FiraCode/woff2/${font}.woff2`}
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
        key={font}
      />
    ))
  );

  // Prevent flash of wrong theme on page load
  setPreBodyComponents([
    <script
      key="theme-init"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const savedTheme = localStorage.getItem('theme');
              if (savedTheme && savedTheme !== 'system') {
                document.documentElement.setAttribute('data-theme', savedTheme);
              }
            } catch (e) {
              console.error('Error loading theme:', e);
            }
          })();
        `,
      }}
    />,
  ]);
};
