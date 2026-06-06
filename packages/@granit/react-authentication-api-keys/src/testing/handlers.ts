import { parseQueryRequest } from '@granit/query-engine';
import { created, notFound } from '@granit/testing/msw';
import { toEntityId, toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockApiKeys } from './data';

import type {
  ApiKeyCreateRequest,
  ApiKeyListItemResponse,
  ApiKeyResponse,
  ApiKeyUpdateScopesRequest,
} from '@granit/authentication-api-keys';
import type { FilterEntry, QueryMetadata } from '@granit/query-engine';
import type { Mutable } from '@granit/testing';

type MutableApiKey = Mutable<ApiKeyResponse>;

/**
 * QueryEngine metadata describing the api-keys grid — returned by
 * `GET {baseUrl}/meta`. Mirrors the columns, filterable/sortable fields, quick
 * filters and defaults exposed by `Granit.Authentication.ApiKeys`.
 */
const API_KEY_QUERY_META: QueryMetadata = {
  columns: [
    {
      name: 'name',
      label: 'Name',
      type: 'String',
      order: 0,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'type',
      label: 'Type',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'environment',
      label: 'Environment',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'prefix',
      label: 'Prefix',
      type: 'String',
      order: 3,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'lastFourChars',
      label: 'Last 4',
      type: 'String',
      order: 4,
      isSortable: false,
      isFilterable: false,
      isVisible: true,
    },
    {
      name: 'expiresAt',
      label: 'Expires',
      type: 'DateTime',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'lastUsedAt',
      label: 'Last used',
      type: 'DateTime',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'revokedAt',
      label: 'Revoked',
      type: 'DateTime',
      order: 7,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'createdAt',
      label: 'Created',
      type: 'DateTime',
      order: 8,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'name', type: 'String', operators: ['Eq', 'Contains', 'StartsWith', 'EndsWith', 'In'] },
    {
      name: 'type',
      type: 'String',
      operators: ['Eq', 'In'],
      enumValues: ['Secret', 'Publishable', 'Webhook', 'Ephemeral'],
    },
    { name: 'environment', type: 'String', operators: ['Eq', 'In'] },
    { name: 'prefix', type: 'String', operators: ['Eq', 'StartsWith'] },
    { name: 'tenantId', type: 'String', operators: ['Eq', 'In'] },
    { name: 'createdAt', type: 'DateTime', operators: ['Eq', 'Gt', 'Gte', 'Lt', 'Lte', 'Between'] },
    { name: 'expiresAt', type: 'DateTime', operators: ['Eq', 'Gt', 'Gte', 'Lt', 'Lte', 'Between'] },
    {
      name: 'lastUsedAt',
      type: 'DateTime',
      operators: ['Eq', 'Gt', 'Gte', 'Lt', 'Lte', 'Between'],
    },
    { name: 'revokedAt', type: 'DateTime', operators: ['Eq', 'Gt', 'Gte', 'Lt', 'Lte', 'Between'] },
  ],
  sortableFields: [
    { name: 'name' },
    { name: 'type' },
    { name: 'environment' },
    { name: 'expiresAt' },
    { name: 'lastUsedAt' },
    { name: 'revokedAt' },
    { name: 'createdAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'active', label: 'Active only', isDefault: true },
    { name: 'includeRevoked', label: 'Include revoked', isDefault: false },
  ],
  dateFilters: [],
  groupByFields: [],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: '-createdAt',
};

/** Read a filterable/sortable column off a key as a comparable string (or null). */
function fieldValue(key: MutableApiKey, field: string): string | null {
  switch (field.toLowerCase()) {
    case 'name':
      return key.name;
    case 'type':
      return key.type;
    case 'environment':
      return key.environment;
    case 'prefix':
      return key.prefix;
    case 'createdat':
      return key.createdAt;
    case 'expiresat':
      return key.expiresAt;
    case 'lastusedat':
      return key.lastUsedAt;
    case 'revokedat':
      return key.revokedAt;
    default:
      return null;
  }
}

/** Apply a single `filter[field.op]=value` predicate (operator names case-insensitive). */
function matchesFilter(key: MutableApiKey, filter: FilterEntry): boolean {
  const actual = fieldValue(key, filter.field);
  if (actual === null) return false;
  const value = filter.value;
  switch (filter.operator.toLowerCase()) {
    case 'eq':
      return actual === value;
    case 'ne':
      return actual !== value;
    case 'contains':
      return actual.toLowerCase().includes(value.toLowerCase());
    case 'startswith':
      return actual.toLowerCase().startsWith(value.toLowerCase());
    case 'endswith':
      return actual.toLowerCase().endsWith(value.toLowerCase());
    case 'in':
      return value.split(',').includes(actual);
    case 'gt':
      return actual > value;
    case 'gte':
      return actual >= value;
    case 'lt':
      return actual < value;
    case 'lte':
      return actual <= value;
    default:
      return true;
  }
}

/** Project a full key down to the summary row shape returned by the listing. */
function toListItem(key: MutableApiKey): ApiKeyListItemResponse {
  return {
    id: key.id,
    name: key.name,
    type: key.type,
    environment: key.environment,
    prefix: key.prefix,
    lastFourChars: key.lastFourChars,
    expiresAt: key.expiresAt,
    lastUsedAt: key.lastUsedAt,
    revokedAt: key.revokedAt,
    cacheBehavior: key.cacheBehavior,
    createdAt: key.createdAt,
  };
}

function generateSecret(type: string, environment: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const typePrefix: Record<string, string> = {
    Secret: 'sk',
    Publishable: 'pk',
    Webhook: 'wh',
    Ephemeral: 'eph',
  };
  let result = `gk_${environment}_${typePrefix[type] ?? 'sk'}_`;
  for (let i = 0; i < 40; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Create stateful MSW handlers for API key endpoints.
 *
 * Mirrors `Granit.Authentication.ApiKeys.Endpoints`: the list endpoint is backed
 * by the generic QueryEngine — it returns a `PagedResult<ApiKeyListItemResponse>`
 * (summary rows without `permissions`/`allowedCidrs`) and understands the
 * QueryEngine grammar (`page`, `pageSize`, `sort`, `search` on the name,
 * `filter[field.op]=value`, `quickFilters`). A companion `GET /meta` endpoint
 * exposes the grid metadata. Revoked keys are hidden unless
 * `quickFilters=includeRevoked` is supplied.
 *
 * @param baseUrl - API base path (default: `/api/v1/authentication/api-keys`)
 */
export function createApiKeyHandlers(baseUrl = `${DEFAULT_BASE_PATH}/api-keys`) {
  const apiKeys: MutableApiKey[] = mockApiKeys.map((k) => ({ ...k }));

  return [
    // GET meta — QueryEngine grid metadata
    http.get(`${baseUrl}/meta`, () => HttpResponse.json(API_KEY_QUERY_META)),

    // GET list — QueryEngine-backed (paginated, filterable, sortable)
    http.get(baseUrl, ({ request }) => {
      const url = new URL(request.url);
      const query = parseQueryRequest(url.search);

      let filtered = [...apiKeys];

      // Full-text search now matches the name only.
      if (query.search) {
        const q = query.search.toLowerCase();
        filtered = filtered.filter((k) => k.name.toLowerCase().includes(q));
      }

      // Column filters: filter[field.op]=value (AND semantics).
      for (const filter of query.filters ?? []) {
        filtered = filtered.filter((k) => matchesFilter(k, filter));
      }

      // Quick filters: hide revoked keys unless `includeRevoked` is active.
      const includeRevoked = (query.quickFilters ?? []).some(
        (name) => name.toLowerCase() === 'includerevoked'
      );
      if (!includeRevoked) {
        filtered = filtered.filter((k) => k.revokedAt === null);
      }

      // Sort — explicit `sort` entries, else the server default `-createdAt`.
      const sort = query.sort?.length
        ? query.sort
        : [{ field: 'createdAt', direction: 'desc' as const }];
      for (const entry of [...sort].reverse()) {
        filtered.sort((a, b) => {
          const av = fieldValue(a, entry.field) ?? '';
          const bv = fieldValue(b, entry.field) ?? '';
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return entry.direction === 'desc' ? -cmp : cmp;
        });
      }

      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize).map(toListItem);

      return HttpResponse.json({
        items,
        totalCount: filtered.length,
        hasMore: start + pageSize < filtered.length,
        nextCursor: null,
      });
    }),

    // GET single
    http.get(`${baseUrl}/:id`, ({ params }) => {
      const key = apiKeys.find((k) => k.id === params.id);
      if (!key) return notFound();
      return HttpResponse.json(key);
    }),

    // POST create
    http.post(baseUrl, async ({ request }) => {
      const body = (await request.json()) as ApiKeyCreateRequest;
      const now = new Date().toISOString();
      const rawSecret = generateSecret(body.type, body.environment);
      const lastFour = rawSecret.slice(-4);
      const typePrefix: Record<string, string> = {
        Secret: 'sk',
        Publishable: 'pk',
        Webhook: 'wh',
        Ephemeral: 'eph',
      };
      const prefix = `gk_${body.environment}_${typePrefix[body.type] ?? 'sk'}_`;

      const newKey: MutableApiKey = {
        id: toEntityId<'ApiKey'>(`ak-${Date.now()}`),
        name: body.name,
        type: body.type,
        environment: body.environment,
        prefix,
        lastFourChars: lastFour,
        permissions: body.permissions ? [...body.permissions] : [],
        allowedCidrs: body.allowedCidrs ? [...body.allowedCidrs] : [],
        expiresAt: body.expiresAt ?? null,
        lastUsedAt: null,
        revokedAt: null,
        cacheBehavior: body.cacheBehavior ?? 'Normal',
        createdAt: toISODateString(now),
      };
      apiKeys.push(newKey);

      return created({
        id: newKey.id,
        rawSecret,
        prefix,
        lastFourChars: lastFour,
        name: body.name,
        type: body.type,
        environment: body.environment,
        expiresAt: body.expiresAt ?? null,
      });
    }),

    // POST revoke — backend returns 204 No Content
    http.post(`${baseUrl}/:id/revoke`, ({ params }) => {
      const key = apiKeys.find((k) => k.id === params.id);
      if (!key) return notFound();
      if (key.revokedAt) {
        return HttpResponse.json({ error: 'Key already revoked' }, { status: 409 });
      }
      key.revokedAt = toISODateString(new Date().toISOString());
      return new HttpResponse(null, { status: 204 });
    }),

    // POST rotate
    http.post(`${baseUrl}/:id/rotate`, ({ params }) => {
      const oldKey = apiKeys.find((k) => k.id === params.id);
      if (!oldKey) return notFound();

      oldKey.revokedAt = toISODateString(new Date().toISOString());

      const rawSecret = generateSecret(oldKey.type, oldKey.environment);
      const lastFour = rawSecret.slice(-4);
      const newKey: MutableApiKey = {
        ...oldKey,
        id: toEntityId<'ApiKey'>(`ak-${Date.now()}`),
        lastFourChars: lastFour,
        revokedAt: null,
        lastUsedAt: null,
        createdAt: toISODateString(new Date().toISOString()),
      };
      apiKeys.push(newKey);

      return HttpResponse.json({
        newKeyId: newKey.id,
        rawSecret,
        prefix: newKey.prefix,
        lastFourChars: lastFour,
        oldKeyId: params.id,
      });
    }),

    // PUT update scopes — backend returns 204 No Content
    http.put(`${baseUrl}/:id/scopes`, async ({ params, request }) => {
      const body = (await request.json()) as ApiKeyUpdateScopesRequest;
      const key = apiKeys.find((k) => k.id === params.id);
      if (!key) return notFound();

      key.permissions = [...body.permissions];
      key.allowedCidrs = [...body.allowedCidrs];
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
