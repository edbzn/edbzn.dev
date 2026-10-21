import { Link } from 'gatsby';
import React from 'react';
import { rhythm } from '../utils/typography';
import { ThemeToggle } from './theme-toggle';
import { NavLinks } from './nav-links';
import { LazyAscii } from './lazy-ascii';
import { LogoProximityTrigger } from './logo-proximity-trigger';

class Layout extends React.Component {
  render() {
    const { children, github, author, location, breadcrumb } = this.props;
    // The blog (index, tag pages and articles) gets the black hole, Open
    // source the galaxy, every other page the globe.
    const pathname = location?.pathname || '/';
    const onBlog = /^\/blog(\/|$)/.test(pathname);
    const onOpenSource = /^\/open-source(\/|$)/.test(pathname);
    return (
      <div
        style={{
          // A column filling the page height: on short pages the content
          // grows, which keeps the footer at the bottom of the window.
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          width: '100%',
          marginLeft: `auto`,
          marginRight: `auto`,
          marginTop: 0,
          marginBottom: 0,
          maxWidth: '698px',
          hyphens: 'auto',
          hyphenateLimitChars: '6 3 3',
          hyphenateLimitLines: 2,
          hyphenateLimitLast: 'always',
          hyphenateLimitZone: '8%',
        }}
      >
        <LogoProximityTrigger />
        <header
          className="site-header"
          style={{
            // See-through, blurring the page as it scrolls underneath
            backgroundColor:
              'color-mix(in srgb, var(--header-bg) 80%, transparent)',
            backdropFilter: 'saturate(180%) blur(12px)',
            WebkitBackdropFilter: 'saturate(180%) blur(12px)',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: 8,
            paddingTop: 8,
            paddingLeft: 'clamp(1.25rem, 3vw, 2rem)',
            paddingRight: 'clamp(1.25rem, 3vw, 2rem)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            marginLeft: 'calc(-50vw + 50%)',
            marginRight: 'calc(-50vw + 50%)',
            width: '100vw',
          }}
        >
          <Link
            aria-label="Home"
            className="site-logo-link"
            style={{
              display: 'block',
              width: 'fit-content',
              boxShadow: `none`,
              fontFamily: 'var(--font-sans)',
            }}
            to={`/`}
          >
            <div style={{ display: `flex`, alignItems: `center` }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                width="30px"
                shapeRendering="geometricPrecision"
              >
                <g className="logo-inner">
                  {/* Mask that punches a transparent circle through the
                      compass rose so the page background shows through the
                      center. */}
                  <defs>
                    <mask
                      id="compass-hole"
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width="100"
                      height="100"
                    >
                      <rect width="100" height="100" fill="white" />
                      <circle cx="50" cy="50" r="7" fill="black" />
                    </mask>
                  </defs>
                  {/* Outer ring (hollow donut via evenodd) */}
                  <path
                    d="M 50 8 A 42 42 0 1 0 50 92 A 42 42 0 1 0 50 8 Z M 50 12 A 38 38 0 1 1 50 88 A 38 38 0 1 1 50 12 Z"
                    fill="rgb(0,0,0)"
                    fillRule="evenodd"
                  />
                  {/* Cardinal ticks */}
                  <polygon points="49,2 51,2 51,8 49,8" fill="rgb(23,23,23)" />
                  <polygon
                    points="92,49 98,49 98,51 92,51"
                    fill="rgb(23,23,23)"
                  />
                  <polygon
                    points="49,92 51,92 51,98 49,98"
                    fill="rgb(23,23,23)"
                  />
                  <polygon points="2,49 8,49 8,51 2,51" fill="rgb(23,23,23)" />
                  {/* 8-ray compass rose — cardinal rays carry more visual
                      weight than the thinner diagonal rays. The central
                      circle is masked out so the background shows through. */}
                  <g mask="url(#compass-hole)">
                    {/* Diagonals */}
                    <polygon
                      points="68,32 55.2,49.2 50.8,44.8"
                      fill="rgb(23,23,23)"
                    />
                    <polygon
                      points="68,68 50.8,55.2 55.2,50.8"
                      fill="rgb(23,23,23)"
                    />
                    <polygon
                      points="32,68 44.8,50.8 49.2,55.2"
                      fill="rgb(23,23,23)"
                    />
                    <polygon
                      points="32,32 49.2,44.8 44.8,49.2"
                      fill="rgb(23,23,23)"
                    />
                    {/* Cardinals (bolder) */}
                    <polygon
                      points="90,50 55,54.5 55,45.5"
                      fill="rgb(23,23,23)"
                    />
                    <polygon
                      points="50,90 45.5,55 54.5,55"
                      fill="rgb(23,23,23)"
                    />
                    <polygon
                      points="10,50 45,45.5 45,54.5"
                      fill="rgb(23,23,23)"
                    />
                    {/* North — red in every theme */}
                    <polygon
                      points="50,10 54.5,45 45.5,45"
                      fill="rgb(255,0,0)"
                    />
                  </g>
                </g>
              </svg>
              <span
                className="site-logo-text"
                style={{
                  marginLeft: '12px',
                  color: 'var(--text-primary)',
                  fontWeight: 400,
                  fontSize: '0.90rem',
                  letterSpacing: '0',
                }}
              >
                edbzn.dev
              </span>
            </div>
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <NavLinks
              pathname={location?.pathname || '/'}
              breadcrumb={breadcrumb}
            />
          </nav>
          <div className="site-header-actions">
            <ThemeToggle />
          </div>
        </header>
        {/* Grows on short pages. `main` stays in block flow inside it, so its
            margins still collapse with its first and last children's as
            they did before, and the space above the animation is unchanged;
            a flex item of its own, it would add them up instead. */}
        <div style={{ flexGrow: 1 }}>
          <main style={{ marginTop: rhythm(2), marginBottom: rhythm(2) }}>
            {children}
          </main>
        </div>
        <LazyAscii
          scene={onBlog ? 'black-hole' : onOpenSource ? 'galaxy' : 'globe'}
        />
        {/* Full-bleed band mirroring the header, closing the page. */}
        <footer
          role="contentinfo"
          className="site-footer"
          style={{ marginTop: rhythm(2) }}
        >
          <div className="site-footer-inner">
            <p className="site-footer-meta">
              &copy;&nbsp;{new Date().getFullYear()} {author}
              <span aria-hidden="true"> · </span>
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0"
                className="text-link"
              >
                CC BY-SA 4.0
              </a>
            </p>
            <ul className="site-footer-links">
              <li>
                <a
                  href={github.sponsorUrl}
                  className="site-footer-link site-footer-link--sponsor"
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a7.152 7.152 0 0 1-.31-.17 22.055 22.055 0 0 1-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002ZM4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.58 20.58 0 0 0 8 13.393a20.58 20.58 0 0 0 3.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.749.749 0 0 1-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5Z" />
                  </svg>
                  Sponsor
                </a>
              </li>
              <li>
                <a href="/rss.xml" className="site-footer-link">
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <circle cx="2.5" cy="13.5" r="2" />
                    <path d="M1 6.5a.75.75 0 0 1 .75-.75 8.5 8.5 0 0 1 8.5 8.5.75.75 0 0 1-1.5 0 7 7 0 0 0-7-7A.75.75 0 0 1 1 6.5Z" />
                    <path d="M1 1.75A.75.75 0 0 1 1.75 1 13.25 13.25 0 0 1 15 14.25a.75.75 0 0 1-1.5 0A11.75 11.75 0 0 0 1.75 2.5.75.75 0 0 1 1 1.75Z" />
                  </svg>
                  RSS
                </a>
              </li>
              <li>
                <a
                  href={github.repositoryUrl}
                  className="site-footer-link"
                  title="Source code on GitHub"
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
                  </svg>
                  {github.commitSha ? (
                    <span className="site-footer-sha">
                      {github.commitSha.slice(0, 7)}
                    </span>
                  ) : (
                    'Source'
                  )}
                </a>
              </li>
            </ul>
          </div>
        </footer>
      </div>
    );
  }
}

export default Layout;
