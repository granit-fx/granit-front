/**
 * Integration with the `granit-cms-renderer` app (Next.js), which hosts the
 * Puck visual content editor.
 *
 * Page *content* (blocks/layout) is authored in the renderer; this admin only
 * manages page *structure* (tree, slug, parent). The renderer's base URL is
 * configured via `VITE_CMS_RENDERER_URL` and gates the "Edit content" link-out.
 *
 * Consumed source-direct by the host's Vite build, so `import.meta.env` resolves
 * against the host app's environment; it falls back to an empty string (link-out
 * disabled) when the var is unset.
 */
// `import.meta.env` is supplied by the host's Vite/Vitest build at runtime; cast
// rather than depend on `vite/client` ambient types in this library package
// (mirrors the @granit/logger DEV-flag read).
const viteEnv = (import.meta as unknown as { env?: { VITE_CMS_RENDERER_URL?: string } }).env;
const RAW_RENDERER_URL: string = viteEnv?.VITE_CMS_RENDERER_URL ?? '';

// endsWith loop avoids a quantified regex on `$` (ReDoS false-positive, Sonar S5852)
let _cmsRendererUrl = RAW_RENDERER_URL;
while (_cmsRendererUrl.endsWith('/')) _cmsRendererUrl = _cmsRendererUrl.slice(0, -1);
/** Renderer base URL without a trailing slash; empty string when unconfigured. */
export const CMS_RENDERER_URL = _cmsRendererUrl;

/** Whether a renderer URL is configured (gates the "Edit content" link-out). */
export const isCmsRendererConfigured = CMS_RENDERER_URL.length > 0;

/**
 * Build the renderer's Puck content-editor URL for a given page and locale,
 * or `null` when no renderer URL is configured.
 *
 * Mirrors the renderer route `app/admin/[pageId]/[locale]/edit/page.tsx`.
 */
export function buildPageEditorUrl(pageId: string, locale: string): string | null {
  if (!isCmsRendererConfigured) {
    return null;
  }
  return `${CMS_RENDERER_URL}/admin/${encodeURIComponent(pageId)}/${encodeURIComponent(locale)}/edit`;
}
