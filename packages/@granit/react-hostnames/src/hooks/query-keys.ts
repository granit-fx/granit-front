import type { ListHostnamesParams } from '@granit/hostnames';

/** Query key factory for hostnames queries. */
export const hostnamesKeys = {
  all: ['hostnames'] as const,
  lists: () => [...hostnamesKeys.all, 'list'] as const,
  list: (params?: ListHostnamesParams) => [...hostnamesKeys.lists(), params] as const,
  hostname: (id: string) => [...hostnamesKeys.all, id] as const,
  availability: (host: string) => [...hostnamesKeys.all, 'availability', host] as const,
};
