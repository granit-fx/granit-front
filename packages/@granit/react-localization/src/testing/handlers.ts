import { noContent, notFound, pagedResponse } from '@granit/testing/msw';
import { toEntityId, toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import { buildMockLocalization, mockLanguages, mockLocalizationOverrides } from './data.js';

import type { LocalizationOverride } from '@granit/localization';

/**
 * Create stateful MSW handlers for localization endpoints (languages,
 * translations, and localization overrides).
 *
 * @param baseUrl - API base path (default: `/api/v1/localization`)
 */
export function createLocalizationHandlers(baseUrl = DEFAULT_BASE_PATH) {
  const languages = [...mockLanguages];
  let overrides: LocalizationOverride[] = [...mockLocalizationOverrides];
  const overridesBase = `${baseUrl}/overrides`;

  return [
    // GET /languages — list all languages
    http.get(`${baseUrl}/languages`, () => {
      return HttpResponse.json(languages);
    }),

    // PUT /languages/:cultureName — toggle language enabled state
    http.put(`${baseUrl}/languages/:cultureName`, async ({ params, request }) => {
      const cultureName = decodeURIComponent(params.cultureName as string);
      const body = (await request.json()) as { isEnabled: boolean };

      const lang = languages.find((l) => l.cultureName === cultureName);
      if (!lang) return notFound();

      if (lang.isDefault && !body.isEnabled) {
        return HttpResponse.json({ error: 'Cannot disable the default language' }, { status: 400 });
      }

      lang.isEnabled = body.isEnabled;
      return HttpResponse.json(lang);
    }),

    // GET / — get localization bundle for a culture
    http.get(baseUrl, ({ request }) => {
      const url = new URL(request.url);
      const cultureName = url.searchParams.get('cultureName') ?? 'en';
      return HttpResponse.json(buildMockLocalization(cultureName));
    }),

    // GET /overrides — list overrides with search and pagination
    http.get(overridesBase, ({ request }) => {
      const url = new URL(request.url);
      const search = url.searchParams.get('search') ?? '';
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
      const resourceName = url.searchParams.get('resourceName');
      const cultureName = url.searchParams.get('cultureName');

      let filtered = [...overrides];

      if (resourceName) {
        filtered = filtered.filter((o) => o.resourceName === resourceName);
      }
      if (cultureName) {
        filtered = filtered.filter((o) => o.cultureName === cultureName);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (o) => o.key.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
        );
      }

      filtered.sort((a, b) => a.key.localeCompare(b.key));

      const start = (page - 1) * pageSize;
      return pagedResponse<LocalizationOverride>(
        filtered.slice(start, start + pageSize),
        filtered.length
      );
    }),

    // PUT /overrides/:resourceName/:cultureName/* — upsert an override
    http.put(`${overridesBase}/:resourceName/:cultureName/*`, async ({ params, request }) => {
      const resourceName = params.resourceName as string;
      const cultureName = params.cultureName as string;
      const pathParts = new URL(request.url).pathname.split('/');
      const cultureIndex = pathParts.indexOf(cultureName);
      const key = pathParts.slice(cultureIndex + 1).join('/');

      const body = (await request.json()) as { value: string };

      const existing = overrides.find(
        (o) => o.resourceName === resourceName && o.cultureName === cultureName && o.key === key
      );

      if (existing) {
        const idx = overrides.indexOf(existing);
        overrides[idx] = {
          ...existing,
          value: body.value,
          lastModifiedAt: toISODateString(new Date().toISOString()),
          lastModifiedBy: 'admin@granit-showcase.local',
        };
      } else {
        overrides = [
          ...overrides,
          {
            id: toEntityId<'LocalizationOverride'>(String(overrides.length + 1)),
            resourceName,
            cultureName,
            key,
            value: body.value,
            createdAt: toISODateString(new Date().toISOString()),
            createdBy: 'admin@granit-showcase.local',
            lastModifiedAt: toISODateString(new Date().toISOString()),
            lastModifiedBy: 'admin@granit-showcase.local',
          },
        ];
      }

      return noContent();
    }),

    // DELETE /overrides/:resourceName/:cultureName/* — delete an override
    http.delete(`${overridesBase}/:resourceName/:cultureName/*`, ({ params, request }) => {
      const resourceName = params.resourceName as string;
      const cultureName = params.cultureName as string;
      const pathParts = new URL(request.url).pathname.split('/');
      const cultureIndex = pathParts.indexOf(cultureName);
      const key = pathParts.slice(cultureIndex + 1).join('/');

      overrides = overrides.filter(
        (o) => !(o.resourceName === resourceName && o.cultureName === cultureName && o.key === key)
      );

      return noContent();
    }),
  ];
}
