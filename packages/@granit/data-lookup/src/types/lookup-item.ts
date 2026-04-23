import type { LookupKind } from './lookup-descriptor.js';

/**
 * Canonical item returned by every lookup source. `label` is already localized
 * server-side in the caller's `Accept-Language` culture — the frontend renders
 * it verbatim.
 */
export interface LookupItem {
  /** Opaque value to submit back (GUID, code, enum name). */
  readonly value: unknown;
  /** Already-localized human-readable label. */
  readonly label: string;
  /**
   * Optional secondary attributes (e.g. `{ active: true, email: "x@y.z" }`).
   * Shape is source-specific.
   */
  readonly extra?: Readonly<Record<string, unknown>>;
}

/** Canonical paginated response for a lookup search. */
export interface LookupResult {
  readonly items: readonly LookupItem[];
  /** Total count across pages; `null` for cursor-based sources. */
  readonly totalCount?: number | null;
  /** Opaque token for the next page, when supported. */
  readonly continuationToken?: string | null;
}

/**
 * Public metadata about a registered lookup source, returned by
 * `GET /api/granit/lookups`.
 */
export interface LookupManifestEntry {
  readonly name: string;
  readonly kind: LookupKind;
  readonly requiredPermission?: string | null;
  readonly scopeKeys: readonly string[];
}

/** Response shape of `GET /api/granit/lookups`. */
export interface LookupManifest {
  readonly lookups: readonly LookupManifestEntry[];
}

/** Query parameters passed to the lookup client. */
export interface LookupQueryParams {
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly continuationToken?: string;
  /** Fully-resolved scope values. Keys must match `scopeKeys` declared by the source. */
  readonly scope?: Readonly<Record<string, string | null | undefined>>;
}
