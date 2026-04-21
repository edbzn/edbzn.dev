import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';

export function Seo({
  title,
  description,
  article,
  canonical,
  pathname,
  image,
}) {
  const { site } = useStaticQuery(query);

  const {
    defaultTitle,
    titleTemplate,
    defaultDescription,
    siteUrl,
    twitterUsername,
  } = site.siteMetadata;

  // Normalize image: accept either a string URL or an object { url, width, height, alt }.
  const rawImage = typeof image === 'string' ? { url: image } : image;
  const toAbsolute = (url) =>
    url ? (url.startsWith('http') ? url : `${siteUrl}${url}`) : null;

  const seo = {
    title: title ? titleTemplate.replace('%s', title) : defaultTitle,
    description: description || defaultDescription,
    url: pathname ? `${siteUrl}${pathname}` : siteUrl,
    image: rawImage?.url
      ? {
          url: toAbsolute(rawImage.url),
          width: rawImage.width,
          height: rawImage.height,
          alt: rawImage.alt || title,
        }
      : null,
  };

  return (
    <>
      <title>{seo.title}</title>
      <meta name="color-scheme" content="light dark" />
      <meta name="description" content={seo.description} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:url" content={seo.url} />
      {article && <meta property="og:type" content="article" />}
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      {seo.image && (
        <>
          <meta property="og:image" content={seo.image.url} />
          <meta property="og:image:secure_url" content={seo.image.url} />
          {seo.image.alt && (
            <meta property="og:image:alt" content={seo.image.alt} />
          )}
          {seo.image.width && (
            <meta property="og:image:width" content={String(seo.image.width)} />
          )}
          {seo.image.height && (
            <meta
              property="og:image:height"
              content={String(seo.image.height)}
            />
          )}
        </>
      )}
      <meta
        name="twitter:card"
        content={seo.image ? 'summary_large_image' : 'summary'}
      />
      {twitterUsername && (
        <meta name="twitter:creator" content={twitterUsername} />
      )}
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      {seo.image && (
        <>
          <meta name="twitter:image" content={seo.image.url} />
          {seo.image.alt && (
            <meta name="twitter:image:alt" content={seo.image.alt} />
          )}
        </>
      )}
    </>
  );
}

const query = graphql`
  query SEO {
    site {
      siteMetadata {
        defaultTitle: title
        titleTemplate
        defaultDescription: description
        siteUrl: url
        twitterUsername
      }
    }
  }
`;
