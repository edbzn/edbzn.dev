import React from 'react';
import { Link } from 'gatsby';
import { GatsbyImage, getImage } from 'gatsby-plugin-image';
import { rhythm } from '../utils/typography';
import { LanguageIndicator } from './language-indicator';
import * as styles from './post-preview.module.css';

// `isCover`: the image was drawn as a banner, so it fills the frame. Images
// taken from the post body may be diagrams that must not be cropped.
const Banner = ({ image, slug, isCover }) => {
  const imageData = getImage(image);
  if (!imageData && !image?.publicURL) {
    return null;
  }
  // Decorative: the title already links to the post
  return (
    <Link className={styles.banner} to={slug} tabIndex={-1} aria-hidden>
      {imageData ? (
        <GatsbyImage image={imageData} alt="" />
      ) : (
        <img
          className={isCover ? styles.fill : styles.vector}
          src={image.publicURL}
          alt=""
          loading="lazy"
        />
      )}
    </Link>
  );
};

export const PostPreview = ({ node }) => {
  return (
    <article className={styles.article}>
      {node.previewImage && (
        <Banner
          image={node.previewImage}
          slug={node.fields.slug}
          isCover={Boolean(node.frontmatter.cover)}
        />
      )}
      <div className={styles.content}>
        <header>
          <h3
            className={styles.title}
            style={{
              marginTop: 0,
              marginBottom: 0,
              fontFamily: 'var(--font-sans)',
            }}
          >
            <Link
              className="text-link text-link--underline"
              to={node.fields.slug}
              title={node.frontmatter.title}
            >
              {node.frontmatter.title}
            </Link>
          </h3>
        </header>
        <section
          style={{
            marginTop: rhythm(1 / 4),
            marginBottom: 0,
          }}
        >
          <p
            className={styles.description}
            style={{ marginBottom: 0 }}
            dangerouslySetInnerHTML={{
              __html: node.frontmatter.description ?? node.excerpt,
            }}
          />
        </section>
        <footer
          style={{
            fontSize: '14px',
            fontWeight: '300',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: rhythm(1 / 4),
            }}
          >
            {node.frontmatter.draft ? (
              <span>
                <span role="img" aria-label="emoji" alt="wip">
                  🚧
                </span>{' '}
                Draft
              </span>
            ) : (
              node.frontmatter.date
            )}
            <LanguageIndicator lang={node.frontmatter.lang} />
          </div>
        </footer>
      </div>
    </article>
  );
};
