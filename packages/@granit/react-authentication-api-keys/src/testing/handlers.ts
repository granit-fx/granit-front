import { notFound, pagedResponse } from '@granit/testing/msw';
import { toEntityId, toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { mockApiKeys } from './data.js';

import type {
  ApiKeyCreateRequest,
  ApiKeyResponse,
  ApiKeyUpdateScopesRequest,
} from '@granit/authentication-api-keys';

type MutableApiKey = { -readonly [K in keyof ApiKeyResponse]: ApiKeyResponse[K] };

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
 * @param baseUrl - API base path (default: `/api/v1/authentication/api-keys`)
 */
export function createApiKeyHandlers(baseUrl = '/api/v1/authentication/api-keys') {
  const apiKeys: MutableApiKey[] = mockApiKeys.map((k) => ({ ...k }));

  return [
    // GET list — paginated with filters
    http.get(baseUrl, ({ request }) => {
      const url = new URL(request.url);
      const search = url.searchParams.get('search');
      const type = url.searchParams.get('type');
      const environment = url.searchParams.get('environment');
      const includeRevoked = url.searchParams.get('includeRevoked') === 'true';
      const page = Number(url.searchParams.get('page') ?? '1');
      const pageSize = Number(url.searchParams.get('pageSize') ?? '20');

      let filtered = [...apiKeys];

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (k) => k.name.toLowerCase().includes(q) || k.prefix.toLowerCase().includes(q)
        );
      }

      if (type) {
        const types = new Set(type.split(','));
        filtered = filtered.filter((k) => types.has(k.type));
      }

      if (environment) {
        filtered = filtered.filter((k) => k.environment === environment);
      }

      if (!includeRevoked) {
        filtered = filtered.filter((k) => k.revokedAt === null);
      }

      const start = (page - 1) * pageSize;
      return pagedResponse<ApiKeyResponse>(
        filtered.slice(start, start + pageSize) as ApiKeyResponse[],
        filtered.length
      );
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

      return HttpResponse.json(
        {
          id: newKey.id,
          rawSecret,
          prefix,
          lastFourChars: lastFour,
          name: body.name,
          type: body.type,
          environment: body.environment,
          expiresAt: body.expiresAt ?? null,
        },
        { status: 201 }
      );
    }),

    // POST revoke
    http.post(`${baseUrl}/:id/revoke`, ({ params }) => {
      const key = apiKeys.find((k) => k.id === params.id);
      if (!key) return notFound();
      if (key.revokedAt) {
        return HttpResponse.json({ error: 'Key already revoked' }, { status: 409 });
      }
      key.revokedAt = toISODateString(new Date().toISOString());
      return HttpResponse.json(key);
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

    // PUT update scopes
    http.put(`${baseUrl}/:id/scopes`, async ({ params, request }) => {
      const body = (await request.json()) as ApiKeyUpdateScopesRequest;
      const key = apiKeys.find((k) => k.id === params.id);
      if (!key) return notFound();

      key.permissions = [...body.permissions];
      key.allowedCidrs = [...body.allowedCidrs];
      return HttpResponse.json(key);
    }),
  ];
}
