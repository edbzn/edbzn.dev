import Typography from 'typography';
import wordpress2016 from 'typography-theme-wordpress-2016';

wordpress2016.overrideThemeStyles = ({ rhythm }) => {
  return {
    body: {
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    },
    h1: {
      fontFamily: "'Public Sans', sans-serif",
      color: 'var(--text-primary)',
    },
    'h2,h3,h4,h5,h6': {
      color: 'var(--text-primary)',
    },
    // Text colour; underline and hover come from "Text links" in main.css
    a: {
      color: 'var(--text-primary)',
      boxShadow: 'none',
    },
    'a.gatsby-resp-image-link': {
      boxShadow: `none`,
    },
    blockquote: {
      fontWeight: 100,
      color: 'var(--blockquote-color)',
      fontSize: 16,
      borderLeftColor: 'var(--blockquote-border)',
    },
    code: {
      fontSize: 'inherit',
    },
    table: {
      borderCollapse: 'collapse',
    },
    'th,td': {
      borderColor: 'var(--table-border)',
      color: 'var(--text-primary)',
    },
    th: {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
    },
    'ul,ol': {
      marginLeft: rhythm(1),
    },
    p: {
      color: 'var(--text-primary)',
    },
    li: {
      color: 'var(--text-primary)',
    },
  };
};

delete wordpress2016.googleFonts;

// The theme removes the link underline on hover; links instead keep their
// underline and turn to the accent colour (see "Text links" in main.css).
const themeOverrideStyles = wordpress2016.overrideStyles;
wordpress2016.overrideStyles = (...args) => {
  const styles = themeOverrideStyles(...args);
  delete styles['a:hover,a:active'];
  return styles;
};

const typography = new Typography({
  ...wordpress2016,
  baseLineHeight: 1.666,
  boldWeight: 900,
});

// Hot reload typography in development.
if (process.env.NODE_ENV !== `production`) {
  typography.injectStyles();
}

export default typography;
export const rhythm = typography.rhythm;
export const scale = typography.scale;
