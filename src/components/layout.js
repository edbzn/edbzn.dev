import { Link } from 'gatsby';
import React from 'react';
import rss from '../../static/icons/rss.svg';
import { rhythm } from '../utils/typography';
import { ThemeToggle } from './theme-toggle';
import { AsciiSphere } from './ascii-sphere';
import { LogoProximityTrigger } from './logo-proximity-trigger';

class Layout extends React.Component {
  render() {
    const { children, github, author } = this.props;
    return (
      <div
        style={{
          marginLeft: `auto`,
          marginRight: `auto`,
          marginTop: 0,
          marginBottom: rhythm(1.4),
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
            background: 'rgba(var(--bg-primary-rgb, 255, 255, 255), 0.4)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            paddingBottom: 14,
            paddingTop: 14,
            paddingLeft: 'max(1rem, calc((100vw - 698px) / 2 + 1rem))',
            paddingRight: 'max(1rem, calc((100vw - 698px) / 2 + 1rem))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
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
              fontFamily: "'Public Sans', sans-serif",
            }}
            to={`/`}
          >
            <div style={{ display: `flex`, alignItems: `center` }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                width="38px"
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
                  background: 'var(--text-primary)',
                  color: 'var(--bg-primary)',
                  padding: '2px 4px',
                }}
              >
                edbzn.dev
              </span>
            </div>
          </Link>
          <nav
            className="site-nav"
            style={{
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
            }}
          >
            <Link
              to="/"
              className="site-nav-link"
              style={{
                boxShadow: 'none',
                fontFamily: '"Public Sans", sans-serif',
                textTransform: 'uppercase',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-primary)',
                textDecoration: 'none',
              }}
              activeStyle={{
                fontWeight: '700',
              }}
            >
              About me
            </Link>
            <Link
              to="/blog"
              className="site-nav-link"
              style={{
                boxShadow: 'none',
                fontFamily: '"Public Sans", sans-serif',
                textTransform: 'uppercase',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-primary)',
                textDecoration: 'none',
              }}
              activeStyle={{
                fontWeight: '700',
              }}
            >
              Blog
            </Link>
            <ThemeToggle />
          </nav>
        </header>
        <main style={{ marginTop: rhythm(2) }}>{children}</main>
        <div style={{ marginTop: rhythm(2) }}>
          <AsciiSphere />
        </div>
        <footer
          role="contentinfo"
          style={{ marginTop: rhythm(2), fontSize: 14, fontWeight: 100 }}
        >
          <div
            style={{
              textAlign: 'center',
              fontFamily: '"Public Sans", sans-serif',
              fontSize: 14,
            }}
          >
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0"
              style={{ boxShadow: 'none', color: 'var(--text-color)' }}
            >
              CC BY-SA 4.0
            </a>
            &nbsp;
            {new Date().getFullYear()}&nbsp;&copy;&nbsp;{author} ·{' '}
            <a
              href="/rss.xml"
              style={{ boxShadow: 'none', color: 'var(--text-color)' }}
            >
              <img
                src={rss}
                alt="RSS feed icon"
                style={{
                  width: 14,
                  marginBottom: -2,
                  marginRight: 2,
                  marginLeft: 2,
                }}
              />{' '}
              RSS
            </a>{' '}
            ·{' '}
            <a
              href={github.repositoryUrl}
              style={{
                boxShadow: 'none',
                color: 'var(--text-color)',
                fontFamily: '"Fira Code", "Courier New", Courier, monospace;',
                fontWeight: 100,
              }}
              title="Source code on GitHub"
            >
              {github.commitSha ? github.commitSha.slice(0, 16) : 'source'}
            </a>{' '}
            ·{' '}
            <a
              href={github.sponsorUrl}
              style={{ boxShadow: 'none', color: 'var(--text-color)' }}
            >
              Become&nbsp;a&nbsp;GitHub&nbsp;Sponsor
            </a>
          </div>
        </footer>
      </div>
    );
  }
}

export default Layout;
