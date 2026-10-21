/**
 * Computes a deterministic slug used to name the generated social image
 * associated with a given page pathname.
 *
 * Examples:
 *   "/"                   -> "home"
 *   "/blog/"              -> "blog"
 *   "/blog/my-post/"      -> "blog-my-post"
 *   "/blog/tags/angular"  -> "blog-tags-angular"
 */
function ogImageSlug(pathname) {
  const cleaned = (pathname || '/').replace(/^\/+|\/+$/g, '');
  return cleaned ? cleaned.replace(/\//g, '-') : 'home';
}

function ogImagePath(pathname) {
  return `/og/${ogImageSlug(pathname)}.png`;
}

module.exports = { ogImageSlug, ogImagePath };
