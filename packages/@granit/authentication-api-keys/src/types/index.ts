import type { PagedResult, QueryRequest } from '@granit/query-engine';
import type { EntityId, ISODateString } from '@granit/types';

/** API key type. Mirrors Granit.Authentication.ApiKeys.ApiKeyType .NET. */
export type ApiKeyType = 'Secret' | 'Publishable' | 'Webhook' | 'Ephemeral';

/** Cache behavior for API key lookups. */
export type CacheBehavior = 'Normal' | 'NoCache';

/** Branded API key identifier. */
export type ApiKeyId = EntityId<'ApiKey'>;

/**
 * Full API key response DTO — returned by `GET /api-keys/{id}` (detail).
 *
 * Includes the heavyweight `permissions` and `allowedCidrs` collections. Since
 * the listing endpoint migrated to the QueryEngine these are no longer part of
 * the list rows — see {@link ApiKeyListItemResponse}.
 */
export interface ApiKeyResponse {
  readonly id: ApiKeyId;
  readonly name: string;
  readonly type: ApiKeyType;
  readonly environment: string;
  readonly prefix: string;
  readonly lastFourChars: string;
  readonly permissions: readonly string[];
  readonly allowedCidrs: readonly string[];
  readonly expiresAt: ISODateString | null;
  readonly lastUsedAt: ISODateString | null;
  readonly revokedAt: ISODateString | null;
  readonly cacheBehavior: CacheBehavior;
  readonly createdAt: ISODateString;
  readonly modifiedAt: ISODateString | null;
}

/**
 * Summary API key row returned by the QueryEngine listing
 * (`GET /api-keys` → `PagedResult<ApiKeyListItemResponse>`).
 *
 * A lighter projection of {@link ApiKeyResponse}: it intentionally drops
 * `permissions` and `allowedCidrs`, which are only available on the detail
 * endpoint (`GET /api-keys/{id}`). Load the detail on demand when a grid row
 * needs them.
 */
export interface ApiKeyListItemResponse {
  readonly id: ApiKeyId;
  readonly name: string;
  readonly type: ApiKeyType;
  readonly environment: string;
  readonly prefix: string;
  readonly lastFourChars: string;
  readonly expiresAt: ISODateString | null;
  readonly lastUsedAt: ISODateString | null;
  readonly revokedAt: ISODateString | null;
  readonly cacheBehavior: CacheBehavior;
  readonly createdAt: ISODateString;
}

/** Request to create a new API key. */
export interface ApiKeyCreateRequest {
  readonly name: string;
  readonly type: ApiKeyType;
  readonly environment: string;
  readonly permissions?: readonly string[];
  readonly allowedCidrs?: readonly string[];
  readonly expiresAt?: ISODateString;
  readonly cacheBehavior?: CacheBehavior;
}

/** Response after creating a new API key (includes the raw secret). */
export interface ApiKeyCreateResponse {
  readonly id: ApiKeyId;
  readonly rawSecret: string;
  readonly prefix: string;
  readonly lastFourChars: string;
  readonly name: string;
  readonly type: ApiKeyType;
  readonly environment: string;
  readonly expiresAt: ISODateString | null;
}

/** Response after rotating an API key. */
export interface ApiKeyRotateResponse {
  readonly newKeyId: ApiKeyId;
  readonly rawSecret: string;
  readonly prefix: string;
  readonly lastFourChars: string;
  readonly oldKeyId: ApiKeyId;
}

/** Request to update API key scopes. */
export interface ApiKeyUpdateScopesRequest {
  readonly permissions: readonly string[];
  readonly allowedCidrs: readonly string[];
}

/**
 * Quick-filter names recognized by the api-keys listing endpoint.
 *
 * Quick-filters are independent, server-defined predicates combined with AND
 * semantics. When none is supplied the backend applies its default
 * ({@link ApiKeyQuickFilters.Active}), so only active keys are returned; pass
 * {@link ApiKeyQuickFilters.IncludeRevoked} to also surface revoked keys.
 */
export type ApiKeyQuickFilter = 'active' | 'includeRevoked';

export const ApiKeyQuickFilters = {
  /** Default — only active (non-revoked) keys. */
  Active: 'active',
  /** Include revoked keys in the results. */
  IncludeRevoked: 'includeRevoked',
} as const satisfies Record<string, ApiKeyQuickFilter>;

/**
 * Query parameters accepted by {@link listApiKeys} — the generic QueryEngine
 * grammar (`page`, `pageSize`, `sort`, `search`, `filters`, `quickFilters`).
 *
 * Mapping from the legacy bespoke filters:
 * - `type=Secret` → `{ filters: [{ field: 'type', operator: 'Eq', value: 'Secret' }] }`
 * - `environment=live` → `{ filters: [{ field: 'environment', operator: 'Eq', value: 'live' }] }`
 * - `search=foo` → `{ search: 'foo' }` (now matches the name only)
 * - `includeRevoked=true` → `{ quickFilters: [ApiKeyQuickFilters.IncludeRevoked] }`
 * - `includeRevoked=false` (default) → omit `quickFilters` entirely
 *
 * Filterable fields: `name`, `type`, `environment`, `prefix`, `tenantId`,
 * `createdAt`, `expiresAt`, `lastUsedAt`, `revokedAt`.
 * Sortable fields: `name`, `type`, `environment`, `expiresAt`, `lastUsedAt`,
 * `revokedAt`, `createdAt` (server default `-createdAt`).
 */
export type ListApiKeysParams = QueryRequest;

/** Page of summary rows returned by {@link listApiKeys}. */
export type ApiKeyListPage = PagedResult<ApiKeyListItemResponse>;
