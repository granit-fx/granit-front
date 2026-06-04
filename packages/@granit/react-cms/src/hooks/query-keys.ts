import type { ListPagesParams } from '@granit/cms';
import type { ListSitesParams } from '@granit/cms';

export const cmsKeys = {
  sites: {
    all: (prefix: readonly string[]) => [...prefix, 'sites'] as const,
    list: (prefix: readonly string[], params?: ListSitesParams) =>
      [...prefix, 'sites', 'list', params ?? {}] as const,
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
  },
  menus: {
    all: (prefix: readonly string[]) => [...prefix, 'menus'] as const,
    list: (prefix: readonly string[], siteId?: string) =>
      [...prefix, 'menus', 'list', siteId ?? ''] as const,
    detail: (prefix: readonly string[], id: string) => [...prefix, 'menus', id] as const,
  },
  releases: {
    all: (prefix: readonly string[]) => [...prefix, 'releases'] as const,
    list: (prefix: readonly string[], siteId?: string) =>
      [...prefix, 'releases', 'list', siteId ?? ''] as const,
    detail: (prefix: readonly string[], id: string) => [...prefix, 'releases', id] as const,
  },
} as const;
