import { DATE_OPERATORS, ENUM_OPERATORS, STRING_OPERATORS } from '@granit/query-engine';
import { noContent, notFound, pagedResponse } from '@granit/testing/msw';
import { toEntityId, toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import { buildMockLocalization, mockLanguages, mockLocalizationOverrides } from './data.js';

import type { LocalizationOverride } from '@granit/localization';
import type { QueryMetadata } from '@granit/query-engine';
import type { RequestHandler } from 'msw';

/** Mock /meta payload for the localization overrides resource. */
export const localizationOverrideQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'id',
      label: 'ID',
      type: 'Guid',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'resourceName',
      label: 'Resource',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'cultureName',
      label: 'Culture',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'key',
      label: 'Key',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'value',
      label: 'Value',
      type: 'String',
      order: 4,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'lastModifiedAt',
      label: 'Modified at',
      type: 'DateTime',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'lastModifiedBy',
      label: 'Modified by',
      type: 'String',
      order: 6,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'resourceName', type: 'String', operators: ENUM_OPERATORS },
    { name: 'cultureName', type: 'String', operators: ENUM_OPERATORS },
    { name: 'key', type: 'String', operators: STRING_OPERATORS },
    { name: 'value', type: 'String', operators: STRING_OPERATORS },
    { name: 'lastModifiedAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'lastModifiedBy', type: 'String', operators: STRING_OPERATORS },
  ],
  sortableFields: [
    { name: 'resourceName' },
    { name: 'cultureName' },
    { name: 'key' },
    { name: 'lastModifiedAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [
    { name: 'resourceName', type: 'String' },
    { name: 'cultureName', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: 'key',
};

/**
 * Create stateful MSW handlers for localization endpoints (languages,
 * translations, and localization overrides).
 *
 * @param baseUrl - API base path (default: `/api/v1/localization`)
 */
export function createLocalizationHandlers(baseUrl = DEFAULT_BASE_PATH): RequestHandler[] {
  const languages = [...mockLanguages];
  let overrides: LocalizationOverride[] = [...mockLocalizationOverrides];
  const overridesBase = `${baseUrl}/overrides`;

  return [
    // GET /overrides/meta — query metadata. Inlined (rather than reusing
    // `createQueryMetaHandler` from `@granit/react-query-engine/testing`)
    // to keep this package's emitted DTS independent of that other
    // package's MSW resolution — pnpm hoists two `msw` copies under
    // different TS variants and the cross-package `RequestHandler` then
    // breaks portable type emission (TS2883).
    http.get(`${overridesBase}/meta`, () => HttpResponse.json(localizationOverrideQueryMetadata)),

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
