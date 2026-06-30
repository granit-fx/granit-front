import type {
  ListMenusParams,
  ListPagesParams,
  ListReleasesParams,
  ListSitesParams,
  PageSearchParams,
} from '@granit/cms';

export const cmsKeys = {
  sites: {
    all: (prefix: readonly string[]) => [...prefix, 'sites'] as const,
    list: (prefix: readonly string[], params?: ListSitesParams) =>
      [...prefix, 'sites', 'list', params ?? {}] as const,
    meta: (prefix: readonly string[]) => [...prefix, 'sites', 'meta'] as const,
    detail: (prefix: readonly string[], id: string) => [...prefix, 'sites', id] as const,
  },
  pages: {
    all: (prefix: readonly string[]) => [...prefix, 'pages'] as const,
    tree: (prefix: readonly string[], siteId: string) =>
      [...prefix, 'pages', 'tree', siteId] as const,
    list: (prefix: readonly string[], params?: ListPagesParams) =>
      [...prefix, 'pages', 'list', params ?? {}] as const,
    detail: (prefix: readonly string[], id: string) => [...prefix, 'pages', id] as const,
    versions: (prefix: readonly string[], id: string) =>
      [...prefix, 'pages', id, 'versions'] as const,
    editing: (prefix: readonly string[], id: string) =>
      [...prefix, 'pages', id, 'editing'] as const,
    search: (prefix: readonly string[], params: PageSearchParams) =>
      [...prefix, 'pages', 'search', params] as const,
  },
  search: {
    public: (prefix: readonly string[], siteId: string, params: PageSearchParams) =>
      [...prefix, 'search', siteId, params] as const,
  },
  menus: {
    all: (prefix: readonly string[]) => [...prefix, 'menus'] as const,
    list: (prefix: readonly string[], params?: ListMenusParams) =>
      [...prefix, 'menus', 'list', params ?? {}] as const,
    meta: (prefix: readonly string[]) => [...prefix, 'menus', 'meta'] as const,
    detail: (prefix: readonly string[], id: string) => [...prefix, 'menus', id] as const,
  },
  releases: {
    all: (prefix: readonly string[]) => [...prefix, 'releases'] as const,
    list: (prefix: readonly string[], params?: ListReleasesParams) =>
      [...prefix, 'releases', 'list', params ?? {}] as const,
    meta: (prefix: readonly string[]) => [...prefix, 'releases', 'meta'] as const,
    detail: (prefix: readonly string[], id: string) => [...prefix, 'releases', id] as const,
  },
} as const;
