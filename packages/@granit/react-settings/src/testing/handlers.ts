import { noContent } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { mockAppSettings, mockSettingsStore } from './data.js';

import type { AdminAppSetting } from '@granit/settings';

/**
 * Create stateful MSW handlers for admin config and settings endpoints.
 * Mutations (PUT/DELETE) are reflected in subsequent GET calls.
 *
 * @param baseUrl - API base path (default: `/api/v1`)
 */
export function createSettingsHandlers(baseUrl = '/api/v1') {
  // Local mutable copy of the store per handler factory call
  const store: Record<string, Record<string, string | null>> = JSON.parse(
    JSON.stringify(mockSettingsStore)
  ) as Record<string, Record<string, string | null>>;

  return [
    // ---------------------------------------------------------------------------
    // Admin config — application settings
    // ---------------------------------------------------------------------------

    // GET admin app settings
    http.get(`${baseUrl}/admin/config/settings`, () => {
      return HttpResponse.json(mockAppSettings);
    }),

    // PUT batch-update admin app settings
    http.put(`${baseUrl}/admin/config/settings`, async ({ request }) => {
      const body = (await request.json()) as Array<Pick<AdminAppSetting, 'key' | 'value'>>;
      for (const update of body) {
        const setting = mockAppSettings.find((s) => s.key === update.key);
        if (setting) {
          setting.value = update.value;
        }
      }
      return HttpResponse.json(mockAppSettings);
    }),

    // ---------------------------------------------------------------------------
    // Scope-based settings
    // ---------------------------------------------------------------------------

    // GET all settings for a scope
    http.get(`${baseUrl}/settings/:scope`, ({ params }) => {
      const scope = params.scope as string;
      return HttpResponse.json(store[scope] ?? {});
    }),

    // GET single setting by scope + name
    http.get(`${baseUrl}/settings/:scope/:name`, ({ params }) => {
      const scope = params.scope as string;
      const name = decodeURIComponent(params.name as string);
      const value = store[scope]?.[name] ?? null;
      return HttpResponse.json({ name, value });
    }),

    // PUT update single setting
    http.put(`${baseUrl}/settings/:scope/:name`, async ({ params, request }) => {
      const scope = params.scope as string;
      const name = decodeURIComponent(params.name as string);
      const body = (await request.json()) as { value: string | null };
      if (!store[scope]) store[scope] = {};
      store[scope][name] = body.value;
      return noContent();
    }),

    // DELETE reset setting (cascade fallback)
    http.delete(`${baseUrl}/settings/:scope/:name`, ({ params }) => {
      const scope = params.scope as string;
      const name = decodeURIComponent(params.name as string);
      if (store[scope]) delete store[scope][name];
      return noContent();
    }),
  ];
}
