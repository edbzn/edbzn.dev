import React from 'react';
import nxBadge2025 from '../../static/images/nx-badge-2025.png';
import { rhythm } from '../utils/typography';

export const Service = () => {
  return (
    <section style={styles.section} className="box service-card">
      <img style={styles.img} src={nxBadge2025} alt="Nx Badge 2025" />
      <h2 style={styles.heading}>Interested in collaborating?</h2>
      <p style={styles.services}>
        I provide <span style={styles.underline}>web development</span> and{' '}
        <span style={styles.underline}>platform engineering</span> services to
        help you build scalable applications.
      </p>
      <a
        href="mailto:bozonedouard@gmail.com"
        style={styles.contactLink}
        title="Mail to Edouard Bozon"
      >
        Let's discuss
      </a>
    </section>
  );
};

const styles = {
  underline: {
    textDecoration: 'underline',
  },
  section: {
    margin: rhythm(2.4) + ' auto',
    backgroundColor: 'var(--highlight-bg)',
    color: 'var(--text-primary)',
    textAlign: 'center',
    fontFamily: '"Public Sans", sans-serif',
    padding: '20px',
    borderColor: 'var(--highlight-border)',
  },
  heading: {
    fontSize: '1.5rem',
    fontFamily: '"Public Sans", sans-serif',
    fontWeight: 'bold',
    color: 'var(--text-primary)',
    margin: '10px 0',
  },
  contactLink: {
    display: 'inline-block',
    color: 'var(--accent-color)',
    border: '1px solid var(--accent-color)',
    borderRadius: '4px',
    padding: '10px 20px',
    textDecoration: 'none',
    boxShadow: 'none',
    fontSize: '1.2rem',
    fontWeight: 400,
    marginBottom: '18px',
  },
  services: {
    maxWidth: '472px',
    margin: '0 auto',
    marginBottom: '22px',
    color: 'var(--text-secondary)',
  },
  img: {
    width: '100px',
    margin: '0 auto',
    filter: 'brightness(0.95)',
  },
};
