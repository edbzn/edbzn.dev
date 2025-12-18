import { Link } from 'gatsby';
import React from 'react';
import rss from '../../static/icons/rss.svg';
import { rhythm } from '../utils/typography';
import { Service } from './service';
import { ThemeToggle } from './theme-toggle';

class Layout extends React.Component {
  render() {
    const { children, github, author } = this.props;
    return (
      <div
        style={{
          marginLeft: `auto`,
          marginRight: `auto`,
          marginTop: rhythm(0.4),
          marginBottom: rhythm(1.4),
          maxWidth: '698px',
          hyphens: 'auto',
          hyphenateLimitChars: '6 3 3',
          hyphenateLimitLines: 2,
          hyphenateLimitLast: 'always',
          hyphenateLimitZone: '8%',
        }}
      >
        <header
          style={{
            background: 'var(--bg-primary)',
            paddingBottom: 18,
            paddingTop: 18,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            aria-label="Home"
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
                viewBox="0 0 71 71"
                width="48px"
                shapeRendering="geometricprecision"
              >
                <g className="logo-inner">
                  <path
                    d=" M 7.011 27.866 C 11.224 12.143 27.41 2.798 43.134 7.011 C 58.857 11.224 68.202 27.41 63.989 43.134 C 59.776 58.857 43.59 68.202 27.866 63.989 C 12.143 59.776 2.798 43.59 7.011 27.866 Z "
                    fill="rgb(0,0,0)"
                  />
                  <path
                    d=" M 9.014 28.403 C 12.931 13.785 27.979 5.097 42.597 9.014 C 57.215 12.931 65.903 27.979 61.986 42.597 C 58.069 57.215 43.021 65.903 28.403 61.986 C 13.785 58.069 5.097 43.021 9.014 28.403 Z "
                    fill="rgb(255,255,255)"
                  />
                  <g>
                    <g>
                      <polygon
                        points="48.49,58,32.533,37.213,38.467,33.787"
                        fill="rgb(23,23,23)"
                      />
                      <path
                        d=" M 48.49 58 L 35.5 35.5 L 32.533 37.213 L 48.49 58 Z "
                        fill="rgb(0,0,0)"
                      />
                    </g>
                    <g>
                      <polygon
                        points="22.51,13,38.467,33.787,32.533,37.213"
                        fill="rgb(23,23,23)"
                      />
                      <path
                        d=" M 22.51 13 L 35.5 35.5 L 38.467 33.787 L 22.51 13 Z "
                        fill="rgb(0,0,0)"
                      />
                    </g>
                    <g>
                      <polygon
                        points="13,48.49,33.787,32.533,37.213,38.467"
                        fill="rgb(23,23,23)"
                      />
                      <path
                        d=" M 13 48.49 L 35.5 35.5 L 33.787 32.533 L 13 48.49 Z "
                        fill="rgb(0,0,0)"
                      />
                    </g>
                    <g>
                      <polygon
                        points="58,22.51,37.213,38.467,33.787,32.533"
                        fill="rgb(23,23,23)"
                      />
                      <path
                        d=" M 58 22.51 L 35.5 35.5 L 37.213 38.467 L 58 22.51 Z "
                        fill="rgb(0,0,0)"
                      />
                    </g>
                    <g>
                      <polygon
                        points="45.012,0,40.182,36.755,30.818,34.245"
                        fill="rgb(255,0,0)"
                      />
                      <path
                        d=" M 45.012 0 L 35.5 35.5 L 40.182 36.755 L 45.012 0 Z "
                        fill="rgb(210,0,0)"
                      />
                    </g>
                    <g>
                      <polygon
                        points="25.988,71,30.818,34.245,40.182,36.755"
                        fill="rgb(23,23,23)"
                      />
                      <path
                        d=" M 25.988 71 L 35.5 35.5 L 30.818 34.245 L 25.988 71 Z "
                        fill="rgb(0,0,0)"
                      />
                    </g>
                    <g>
                      <polygon
                        points="0,25.988,36.755,30.818,34.245,40.182"
                        fill="rgb(23,23,23)"
                      />
                      <path
                        d=" M 0 25.988 L 35.5 35.5 L 36.755 30.818 L 0 25.988 Z "
                        fill="rgb(0,0,0)"
                      />
                    </g>
                    <g>
                      <polygon
                        points="71,45.012,34.245,40.182,36.755,30.818"
                        fill="rgb(23,23,23)"
                      />
                      <path
                        d=" M 71 45.012 L 35.5 35.5 L 34.245 40.182 L 71 45.012 Z "
                        fill="rgb(0,0,0)"
                      />
                    </g>
                    <g>
                      <polygon
                        points="71,45.012,34.245,40.182,36.755,30.818"
                        fill="rgb(23,23,23)"
                      />
                      <path
                        d=" M 71 45.012 L 35.5 35.5 L 34.245 40.182 L 71 45.012 Z "
                        fill="rgb(0,0,0)"
                      />
                    </g>
                    <g>
                      <polygon
                        points="48.49,58,32.533,37.213,38.467,33.787"
                        fill="rgb(23,23,23)"
                      />
                      <path
                        d=" M 48.49 58 L 35.5 35.5 L 32.533 37.213 L 48.49 58 Z "
                        fill="rgb(0,0,0)"
                      />
                    </g>
                  </g>
                  <path
                    d=" M 26.837 33.179 C 28.118 28.398 33.04 25.556 37.821 26.837 C 42.602 28.118 45.444 33.04 44.163 37.821 C 42.882 42.602 37.96 45.444 33.179 44.163 C 28.398 42.882 25.556 37.96 26.837 33.179 Z "
                    fill="rgb(0,0,0)"
                  />
                  <path
                    d=" M 28.877 33.725 C 29.857 30.07 33.619 27.898 37.274 28.877 C 40.93 29.857 43.102 33.619 42.123 37.274 C 41.143 40.93 37.381 43.102 33.725 42.123 C 30.07 41.143 27.898 37.381 28.877 33.725 Z "
                    fill="rgb(255,255,255)"
                  />
                  <path
                    d=" M 31.856 34.524 C 32.395 32.513 34.465 31.317 36.476 31.856 C 38.487 32.395 39.683 34.465 39.144 36.476 C 38.605 38.487 36.535 39.683 34.524 39.144 C 32.513 38.605 31.317 36.535 31.856 34.524 Z "
                    fill="rgb(0,0,0)"
                  />
                </g>
              </svg>
              <span
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
            style={{
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
            }}
          >
            <Link
              to="/"
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
              About
            </Link>
            <Link
              to="/blog"
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
              Posts
            </Link>
            <ThemeToggle />
          </nav>
        </header>
        <main style={{ marginTop: rhythm(1) }}>{children}</main>
        <Service />
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
              style={{ boxShadow: 'none' }}
            >
              CC BY-SA 4.0
            </a>
            &nbsp;
            {new Date().getFullYear()}&nbsp;&copy;&nbsp;{author} ·{' '}
            <a href="/rss.xml" style={{ boxShadow: 'none' }}>
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
            <a href={github.repositoryUrl} style={{ boxShadow: 'none' }}>
              🔑&nbsp;Source&nbsp;code
            </a>{' '}
            ·{' '}
            <a href={github.sponsorUrl} style={{ boxShadow: 'none' }}>
              ❤️&nbsp;Become&nbsp;a&nbsp;GitHub&nbsp;Sponsor
            </a>
          </div>
        </footer>
      </div>
    );
  }
}

export default Layout;
