import { noContent } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { mockAppSettings, mockSettingsStore } from './data.js';

import type {
  BulkSettingOutcome,
  BulkSettingResult,
  BulkUpdateSettingsRequest,
  BulkUpdateSettingsResponse,
} from '@granit/settings';

/**
 * Create stateful MSW handlers for admin config and settings endpoints.
 * Mutations (PUT/DELETE) are reflected in subsequent GET calls.
 *
 * @param baseUrl - API base path (default: `/api/v1`)
 */
export function createSettingsHandlers(baseUrl = '/api/v1') {
  // Local mutable copy of the store per handler factory call
  const store: Record<string, Record<string, string | null>> = structuredClone(mockSettingsStore);

  // Local mutable admin catalog per handler factory call (so tests starting
  // from a known state are not polluted by earlier PUT /bulk calls).
  const catalog = mockAppSettings.map((s) => ({ ...s, allowedValues: s.allowedValues }));

  function evaluateEntry(
    scope: string,
    key: string,
    value: string | null
  ): { outcome: BulkSettingOutcome; errorCode: string | null } {
    const def = catalog.find((s) => s.key === key);
    if (!def) {
      return { outcome: 'NotFound', errorCode: 'Granit:Settings:NotFound' };
    }
    if (scope === 'tenant' && def.key === 'system.maintenance_mode') {
      // Example host-only setting — rejected at tenant scope.
      return { outcome: 'ProviderNotAllowed', errorCode: 'Granit:Settings:ProviderNotAllowed' };
    }
    if (value !== null && def.allowedValues?.length && !def.allowedValues.includes(value)) {
      return { outcome: 'ValidationFailed', errorCode: 'Granit:Settings:ValidationFailed' };
    }
    return { outcome: 'Updated', errorCode: null };
  }

  return [
    // ---------------------------------------------------------------------------
    // Admin bulk — definitions catalog + batch update
    // ---------------------------------------------------------------------------

    http.get(`${baseUrl}/settings/:scope/definitions`, ({ params }) => {
      const scope = params.scope as string;
      if (scope !== 'global' && scope !== 'tenant') {
        return HttpResponse.json({ error: 'scope not bulk-editable' }, { status: 404 });
      }
      // Reflect the current store values so PUTs are visible on the next GET.
      const body = catalog.map((def) => ({
        ...def,
        value: def.isEncrypted ? '***' : (store[scope]?.[def.key] ?? def.value),
      }));
      return HttpResponse.json(body);
    }),

    http.put(`${baseUrl}/settings/:scope/bulk`, async ({ params, request }) => {
      const scope = params.scope as string;
      const { settings } = (await request.json()) as BulkUpdateSettingsRequest;
      const results: BulkSettingResult[] = settings.map((entry) => {
        const result = evaluateEntry(scope, entry.key, entry.value);
        if (result.outcome === 'Updated') {
          store[scope] ??= {};
          store[scope][entry.key] = entry.value;
          const def = catalog.find((s) => s.key === entry.key);
          if (def && !def.isEncrypted) def.value = entry.value;
        }
        return { key: entry.key, ...result };
      });
      return HttpResponse.json<BulkUpdateSettingsResponse>({ results });
    }),

    // ---------------------------------------------------------------------------
    // Scope-based settings (unchanged)
    // ---------------------------------------------------------------------------

    http.get(`${baseUrl}/settings/:scope`, ({ params }) => {
      const scope = params.scope as string;
      return HttpResponse.json(store[scope] ?? {});
    }),

    http.get(`${baseUrl}/settings/:scope/:name`, ({ params }) => {
      const scope = params.scope as string;
      const name = decodeURIComponent(params.name as string);
      const value = store[scope]?.[name] ?? null;
      return HttpResponse.json({ name, value });
    }),

    http.put(`${baseUrl}/settings/:scope/:name`, async ({ params, request }) => {
      const scope = params.scope as string;
      const name = decodeURIComponent(params.name as string);
      const body = (await request.json()) as { value: string | null };
      store[scope] ??= {};
      store[scope][name] = body.value;
      return noContent();
    }),

    http.delete(`${baseUrl}/settings/:scope/:name`, ({ params }) => {
      const scope = params.scope as string;
      const name = decodeURIComponent(params.name as string);
      if (store[scope]) delete store[scope][name];
      return noContent();
    }),
  ];
}
