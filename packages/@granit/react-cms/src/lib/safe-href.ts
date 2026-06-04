import { LINK_URL_SCHEMES, NAV_URL_SCHEMES, isSafeUrl } from '@granit/utils';

/**
 * Returns `href` when it is a content-editor-safe link target — an `http(s)`,
 * `mailto:` or `tel:` URL, or a same-origin relative path — otherwise
 * `undefined`.
 *
 * CMS content is authored by lower-trust editors. A `javascript:` / `data:` /
 * `vbscript:` URL rendered straight into `<a href>` is stored XSS that runs in
 * every visitor's session on the public site. Callers render the label as inert
 * text (or drop the link) when this returns `undefined`. See security audit
 * VULN-100 / VULN-101.
 */
export function safeLinkHref(href: string | null | undefined): string | undefined {
  return typeof href === 'string' && isSafeUrl(href, LINK_URL_SCHEMES) ? href : undefined;
}

/**
 * Returns `src` when it is a safe media source — an `http(s)` URL or a
 * same-origin relative path — otherwise `undefined`. Rejects `data:`,
 * `javascript:`, `blob:` and protocol-relative URLs. See security audit
 * VULN-204.
 */
export function safeMediaSrc(src: string | null | undefined): string | undefined {
  return typeof src === 'string' && isSafeUrl(src, NAV_URL_SCHEMES) ? src : undefined;
}
