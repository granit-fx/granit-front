export const cmsHostnamesKeys = {
  all: (prefix: readonly string[]) => [...prefix, 'hostnames'] as const,
  list: (prefix: readonly string[], siteId: string) =>
    [...prefix, 'hostnames', siteId, 'list'] as const,
  detail: (prefix: readonly string[], siteId: string, hostnameId: string) =>
    [...prefix, 'hostnames', siteId, hostnameId] as const,
  availability: (prefix: readonly string[], siteId: string, host: string) =>
    [...prefix, 'hostnames', siteId, 'availability', host] as const,
} as const;
