import type { QueryRequest } from '@granit/cms-redirects';

export const cmsRedirectsKeys = {
  all: (prefix: readonly string[]) => [...prefix, 'redirects'] as const,
  /** Flat per-site list. */
  list: (prefix: readonly string[], siteId: string) =>
    [...prefix, 'redirects', 'list', siteId] as const,
  /** Paginated / filterable admin grid (QueryEngine). */
  grid: (prefix: readonly string[], request: QueryRequest) =>
    [...prefix, 'redirects', 'grid', request] as const,
  /** Admin grid column / filter / preset metadata (QueryEngine). */
  gridMeta: (prefix: readonly string[]) => [...prefix, 'redirects', 'grid', 'meta'] as const,
  detail: (prefix: readonly string[], id: string) =>
    [...prefix, 'redirects', 'detail', id] as const,
  settings: (prefix: readonly string[], siteId: string) =>
    [...prefix, 'redirects', 'settings', siteId] as const,
  preview: (prefix: readonly string[], siteId: string, path: string, culture?: string) =>
    [...prefix, 'redirects', 'preview', siteId, path, culture ?? ''] as const,
} as const;
