export const cmsRedirectsKeys = {
  all: (prefix: readonly string[]) => [...prefix, 'redirects'] as const,
  list: (prefix: readonly string[], siteId?: string) =>
    [...prefix, 'redirects', 'list', siteId ?? ''] as const,
  detail: (prefix: readonly string[], id: string) => [...prefix, 'redirects', id] as const,
} as const;
