import type { LookupDescriptor, LookupQueryParams } from '@granit/data-lookup';

/**
 * Returns a stable React-Query key for a lookup search invocation. Exposed for
 * advanced consumers that need to prefetch or invalidate cached lookups.
 */
export function buildLookupQueryKey(
  descriptor: LookupDescriptor,
  params: LookupQueryParams,
  culture?: string
): readonly unknown[] {
  return [
    'granit',
    'data-lookup',
    'search',
    descriptor.name ?? descriptor.endpoint ?? '(unknown)',
    {
      search: params.search ?? '',
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 25,
      continuationToken: params.continuationToken ?? null,
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
