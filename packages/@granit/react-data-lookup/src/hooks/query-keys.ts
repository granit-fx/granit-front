import { DEFAULT_LOOKUP_BASE_PATH } from '@granit/data-lookup';

import type { LookupDescriptor, LookupQueryParams } from '@granit/data-lookup';

/**
 * Returns a stable React-Query key for a lookup search. Page cursors (`page` /
 * `continuationToken`) are intentionally NOT part of the key — they are threaded
 * through `useInfiniteQuery`'s `pageParam` so every page of one search shares a
 * single cache entry. The key segments by `search`, `pageSize`, `scope` and
 * `culture` (so switching language invalidates stale labels).
 *
 * Exposed for advanced consumers that need to prefetch or invalidate cached lookups.
 */
export function buildLookupQueryKey(
  descriptor: LookupDescriptor,
  params: Pick<LookupQueryParams, 'search' | 'pageSize' | 'scope'>,
  culture?: string
): readonly unknown[] {
  return [
    'granit',
    'data-lookup',
    'search',
    descriptor.name ?? descriptor.endpoint ?? '(unknown)',
    {
      search: params.search ?? '',
      pageSize: params.pageSize ?? 25,
      scope: params.scope ?? null,
    },
    culture ?? null,
  ] as const;
}

/**
 * Returns a stable React-Query key for a lookup resolve invocation.
 */
export function buildLookupResolveQueryKey(
  descriptor: LookupDescriptor,
  value: unknown,
  culture?: string
): readonly unknown[] {
  return [
    'granit',
    'data-lookup',
    'resolve',
    descriptor.name ?? descriptor.endpoint ?? '(unknown)',
    value ?? null,
    culture ?? null,
  ] as const;
}

/** Returns a stable React-Query key for the discovery manifest. */
export function buildLookupManifestQueryKey(basePath?: string): readonly unknown[] {
  return ['granit', 'data-lookup', 'manifest', basePath ?? DEFAULT_LOOKUP_BASE_PATH] as const;
}
