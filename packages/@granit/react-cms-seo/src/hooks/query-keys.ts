import type { ListSeoMetadataParams, ListSeoSuggestionsParams } from '@granit/cms-seo';

export interface SeoContentKey {
  readonly siteId: string;
  readonly contentType: string;
  readonly contentId: string;
  readonly culture: string;
}

type SeoMetadataKey = SeoContentKey;

export const cmsSeoKeys = {
  metadata: {
    all: (prefix: readonly string[]) => [...prefix, 'metadata'] as const,
    detail: (prefix: readonly string[], key: SeoMetadataKey) =>
      [...prefix, 'metadata', key.siteId, key.contentType, key.contentId, key.culture] as const,
    effective: (prefix: readonly string[], key: SeoMetadataKey) =>
      [
        ...prefix,
        'metadata',
        key.siteId,
        key.contentType,
        key.contentId,
        key.culture,
        'effective',
      ] as const,
    serp: (prefix: readonly string[], key: SeoMetadataKey) =>
      [
        ...prefix,
        'metadata',
        key.siteId,
        key.contentType,
        key.contentId,
        key.culture,
        'serp',
      ] as const,
    og: (prefix: readonly string[], key: SeoMetadataKey) =>
      [
        ...prefix,
        'metadata',
        key.siteId,
        key.contentType,
        key.contentId,
        key.culture,
        'og',
      ] as const,
    jsonld: (prefix: readonly string[], key: SeoMetadataKey) =>
      [
        ...prefix,
        'metadata',
        key.siteId,
        key.contentType,
        key.contentId,
        key.culture,
        'jsonld',
      ] as const,
  },
  defaults: {
    detail: (prefix: readonly string[], siteId: string) => [...prefix, 'defaults', siteId] as const,
  },
  audit: {
    all: (prefix: readonly string[]) => [...prefix, 'audit'] as const,
    list: (prefix: readonly string[], params?: ListSeoMetadataParams) =>
      [...prefix, 'audit', params ?? {}] as const,
  },
  suggestions: {
    all: (prefix: readonly string[]) => [...prefix, 'suggestions'] as const,
    list: (prefix: readonly string[], params?: ListSeoSuggestionsParams) =>
      [...prefix, 'suggestions', 'list', params ?? {}] as const,
    detail: (prefix: readonly string[], id: string) => [...prefix, 'suggestions', id] as const,
    diff: (prefix: readonly string[], id: string) =>
      [...prefix, 'suggestions', id, 'diff'] as const,
  },
} as const;
