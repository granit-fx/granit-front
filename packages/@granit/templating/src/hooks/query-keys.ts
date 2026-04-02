import type { TemplateListParams } from '../types/index.js';

export const templateKeys = {
  all: (prefix: readonly string[]) => [...prefix] as const,
  lists: (prefix: readonly string[]) => [...prefix, 'list'] as const,
  list: (prefix: readonly string[], params: TemplateListParams) =>
    [...templateKeys.lists(prefix), params] as const,
  details: (prefix: readonly string[]) => [...prefix, 'detail'] as const,
  detail: (prefix: readonly string[], name: string) =>
    [...templateKeys.details(prefix), name] as const,
  history: (prefix: readonly string[], name: string) => [...prefix, 'history', name] as const,
  revision: (prefix: readonly string[], name: string, revisionId: string) =>
    [...prefix, 'revision', name, revisionId] as const,
  variables: (prefix: readonly string[], name: string) => [...prefix, 'variables', name] as const,
  lifecycle: (prefix: readonly string[], name: string) => [...prefix, 'lifecycle', name] as const,
  layouts: (prefix: readonly string[]) => [...prefix, 'layouts'] as const,
  categories: (prefix: readonly string[]) => [...prefix, 'categories'] as const,
} as const;
