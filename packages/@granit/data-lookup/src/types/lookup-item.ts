import type { LookupKind } from './lookup-descriptor';

/**
 * Canonical item returned by every lookup source. `label` is already localized
 * server-side in the caller's `Accept-Language` culture — the frontend renders
 * it verbatim.
 */
export interface LookupItemResponse {
  /** Opaque value to submit back (GUID, code, enum name). */
  readonly value: unknown;
  /** Already-localized human-readable label. */
  readonly label: string;
  /**
   * Secondary attributes (e.g. `{ active: true, email: "x@y.z" }`), or `null`
   * when the source exposes none. Shape is source-specific. The wire contract
   * (`LookupItemResponse.Extra`) always emits the key, hence required + nullable.
   */
  readonly extra: Readonly<Record<string, unknown>> | null;
}

/** Canonical paginated response for a lookup search. */
export interface LookupResultResponse {
  readonly items: readonly LookupItemResponse[];
  /** Total count across pages; `null` for cursor-based sources. Key always present on the wire. */
  readonly totalCount: number | null;
  /** Opaque token for the next page, or `null` when not supported. Key always present on the wire. */
  readonly continuationToken: string | null;
}

/**
 * Public metadata about a registered lookup source, returned by
 * `GET /lookups`.
 */
export interface LookupManifestEntryResponse {
  readonly name: string;
  readonly kind: LookupKind;
  /** Permission required to invoke the source, or `null` when public. Key always present on the wire. */
  readonly requiredPermission: string | null;
  readonly scopeKeys: readonly string[];
}

/** Response shape of `GET /lookups`. */
export interface LookupManifestResponse {
  readonly lookups: readonly LookupManifestEntryResponse[];
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
