import type {
  LookupClientOptions,
  LookupDescriptor,
  LookupItem,
  LookupManifest,
  LookupQueryParams,
  LookupResult,
} from '../types/index';

export type { LookupClientOptions };

/** Default route prefix used by the backend `MapGranitDataLookups()` extension. */
export const DEFAULT_LOOKUP_BASE_PATH = '/lookups';

/**
 * Fetches the discovery manifest of every registered lookup source.
 *
 * `GET {basePath}` → {@link LookupManifest}.
 */
export async function getLookupManifest(options: LookupClientOptions): Promise<LookupManifest> {
  const { client, basePath = DEFAULT_LOOKUP_BASE_PATH, signal } = options;
  const { data } = await client.get<LookupManifest>(basePath, { signal });
  return data;
}

/**
 * Searches a lookup source.
 *
 * - When `descriptor.name` is set → `GET {basePath}/{name}` (registry).
 * - When `descriptor.endpoint` is set → `GET {endpoint}` (custom source).
 *
 * Scope values are serialized as `scope.{key}=<value>` query parameters.
 */
export async function searchLookup(
  descriptor: LookupDescriptor,
  params: LookupQueryParams,
  options: LookupClientOptions
): Promise<LookupResult> {
  const { client, signal } = options;
  const url = resolveLookupUrl(descriptor, options.basePath);
  const query = buildSearchQuery(descriptor, params);
  const { data } = await client.get<LookupResult>(url, { params: query, signal });
  return data;
}

/**
 * Resolves a single item by its value. Used to rehydrate a previously selected
 * identifier into a human-readable label (e.g., when loading a form that was
 * saved with a foreign-key value).
 *
 * `GET {basePath}/{name}/resolve?value=…` → {@link LookupItem} | `null`.
 *
 * Returns `null` when the value is not present in the source (HTTP 404).
 */
export async function resolveLookup(
  descriptor: LookupDescriptor,
  value: unknown,
  options: LookupClientOptions
): Promise<LookupItem | null> {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const { client, signal } = options;
  const baseUrl = resolveLookupUrl(descriptor, options.basePath);
  const resolveUrl = `${baseUrl}/resolve`;

  try {
    const { data } = await client.get<LookupItem>(resolveUrl, {
      params: { value: stringifyLookupValue(value) },
      signal,
    });
    return data;
  } catch (err) {
    if (isAxiosNotFound(err)) {
      return null;
    }
    throw err;
  }
}

/**
 * Serializes {@link LookupQueryParams} into an axios-compatible params object.
 * Exported for use by test doubles and advanced callers.
 */
export function buildSearchQuery(
  descriptor: LookupDescriptor,
  params: LookupQueryParams
): Record<string, string | number> {
  const result: Record<string, string | number> = {};

  if (params.search !== undefined && params.search !== '') {
    const searchParamKey = descriptor.searchParam ?? 'search';
    result[searchParamKey] = params.search;
  }

  if (params.page !== undefined) {
    result.page = params.page;
  }

  if (params.pageSize !== undefined) {
    result.pageSize = params.pageSize;
  }

  if (params.continuationToken !== undefined && params.continuationToken !== '') {
    result.continuationToken = params.continuationToken;
  }

  if (params.scope) {
    for (const [key, value] of Object.entries(params.scope)) {
      if (value !== null && value !== undefined && value !== '') {
        result[`scope.${key}`] = value;
      }
    }
  }

  return result;
}

/**
 * Stringifies a lookup value for use as an HTTP query parameter. Object values
 * are serialized as JSON to avoid the default `[object Object]` representation.
 */
export function stringifyLookupValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value.toString();
  }
  return JSON.stringify(value);
}

/** Resolves the URL for a lookup descriptor (registry name or custom endpoint). */
function resolveLookupUrl(descriptor: LookupDescriptor, basePath?: string): string {
  if (descriptor.endpoint) {
    return descriptor.endpoint;
  }

  if (!descriptor.name) {
    throw new Error(
      'LookupDescriptor requires either a "name" (registry key) or an "endpoint" (custom URL).'
    );
  }

  const prefix = basePath ?? DEFAULT_LOOKUP_BASE_PATH;
  return `${prefix}/${encodeURIComponent(descriptor.name)}`;
}

interface AxiosErrorLike {
  readonly response?: { readonly status?: number };
}

function isAxiosNotFound(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) {
    return false;
  }
  const response = (err as AxiosErrorLike).response;
  return response?.status === 404;
}
