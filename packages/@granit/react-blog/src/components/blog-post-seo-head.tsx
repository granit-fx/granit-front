import type { EffectiveSeoResponse, RobotsDirective } from '@granit/cms-seo';

export interface BlogPostSeoHeadProps {
  /** Cascade-resolved SEO for the post (see `useEffectiveSeo` in `@granit/react-cms-seo`). */
  readonly seo: EffectiveSeoResponse;
  /**
   * Raw `application/ld+json` `@graph` document (BlogPosting). The backend builds
   * it; pass the string from the SEO JSON-LD endpoint. When omitted, no JSON-LD
   * is emitted.
   */
  readonly jsonLd?: string | null;
}

function robotsContent(robots: RobotsDirective): string {
  const parts = [robots.index ? 'index' : 'noindex', robots.follow ? 'follow' : 'nofollow'];
  if (robots.noArchive) parts.push('noarchive');
  if (robots.noSnippet) parts.push('nosnippet');
  if (robots.maxSnippet != null) parts.push(`max-snippet:${robots.maxSnippet}`);
  if (robots.maxImagePreview) parts.push(`max-image-preview:${robots.maxImagePreview}`);
  return parts.join(', ');
}

/**
 * Emits the `<head>` metadata + JSON-LD for a blog post from the resolved SEO,
 * the same way the CMS page renderer does — reuse rather than reinvent. React 19
 * hoists `<title>`/`<meta>`/`<link>` from anywhere in the tree, so this can be
 * rendered inline on the post page.
 */
export function BlogPostSeoHead({ seo, jsonLd }: BlogPostSeoHeadProps) {
  const { openGraph: og, twitterCard: tw } = seo;
  return (
    <>
      <title>{seo.title}</title>
      {seo.description ? <meta name="description" content={seo.description} /> : null}
      {seo.keywords.length > 0 ? <meta name="keywords" content={seo.keywords.join(', ')} /> : null}
      <meta name="robots" content={robotsContent(seo.robots)} />
      {seo.canonicalUrl ? <link rel="canonical" href={seo.canonicalUrl} /> : null}

      {seo.alternates.map((alt) => (
        <link key={alt.culture} rel="alternate" hrefLang={alt.culture} href={alt.href} />
      ))}

      <meta property="og:type" content={og.type} />
      {og.title ? <meta property="og:title" content={og.title} /> : null}
      {og.description ? <meta property="og:description" content={og.description} /> : null}
      {og.url ? <meta property="og:url" content={og.url} /> : null}
      {og.siteName ? <meta property="og:site_name" content={og.siteName} /> : null}
      {og.locale ? <meta property="og:locale" content={og.locale} /> : null}
      {og.image?.url ? <meta property="og:image" content={og.image.url} /> : null}
      {og.image?.altText ? <meta property="og:image:alt" content={og.image.altText} /> : null}
      {og.article?.publishedTime ? (
        <meta property="article:published_time" content={og.article.publishedTime} />
      ) : null}
      {og.article?.modifiedTime ? (
        <meta property="article:modified_time" content={og.article.modifiedTime} />
      ) : null}
      {og.article?.author ? <meta property="article:author" content={og.article.author} /> : null}

      <meta name="twitter:card" content={tw.card} />
      {tw.title ? <meta name="twitter:title" content={tw.title} /> : null}
      {tw.description ? <meta name="twitter:description" content={tw.description} /> : null}
      {tw.image?.url ? <meta name="twitter:image" content={tw.image.url} /> : null}
      {tw.creator ? <meta name="twitter:creator" content={tw.creator} /> : null}

      {jsonLd ? (
        <script
          type="application/ld+json"
          // eslint-disable-next-line no-restricted-syntax -- server-generated JSON-LD string (BlogPosting @graph)
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      ) : null}
    </>
  );
}
