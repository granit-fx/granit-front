// ---------------------------------------------------------------------------
// @granit/react-reference-data/testing — generic MSW handler factory for
// reference-data style endpoints (`{basePath}` → list / get / children / CRUD,
// filter / search / sort / group-by / presets).
//
// The factory is data-agnostic: callers pass the resource `basePath`, seed,
// metadata and field config. Apps supply their own reference entities
// (countries, document-types, …) and full base URL.
// ---------------------------------------------------------------------------

import { applyStringFilter } from '@granit/testing/msw';
import { toEntityId } from '@granit/types';
import { http, HttpResponse } from 'msw';

import type { GroupedResult, PagedResult, QueryMetadata } from '@granit/query-engine';
import type { ReferenceDataEntry } from '@granit/reference-data';

type ParsedFilter = { field: string; operator: string; value: string };
type ParsedSort = { field: string; desc: boolean };

export interface ReferenceDataHandlersConfig<T extends ReferenceDataEntry> {
  /** Full base path for the resource, e.g. `/api/v1/reference-data/countries`. */
  readonly basePath: string;
  readonly meta: () => QueryMetadata;
  readonly seed: readonly T[];
  readonly searchFields: readonly (keyof T)[];
  readonly defaultSort: (a: T, b: T) => number;
  readonly conflictMessage: string;
  readonly createEntry: (body: Partial<T>) => T;
  readonly applyPresets?: (items: T[], url: URL) => T[];
  readonly hierarchical?: boolean;
}

function parseFilters(url: URL): ParsedFilter[] {
  const filters: ParsedFilter[] = [];
  const filterRegex = /^filter\[(.+)\.(\w+)\]$/;
  for (const [key, value] of url.searchParams.entries()) {
    const match = filterRegex.exec(key);
    if (match?.[1] !== undefined && match[2] !== undefined) {
      filters.push({ field: match[1], operator: match[2], value });
    }
  }
  return filters;
}

function parseSort(url: URL): ParsedSort[] {
  const sortStr = url.searchParams.get('sort');
  if (!sortStr) return [];
  return sortStr
    .split(',')
    .map((part) =>
      part.startsWith('-') ? { field: part.slice(1), desc: true } : { field: part, desc: false }
    );
}

function safeFieldString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function applyAdvancedFilters<T>(items: T[], filters: ParsedFilter[]): T[] {
  let result = items;
  for (const f of filters) {
    result = result.filter((item) => {
      const fieldValue = (item as Record<string, unknown>)[f.field];
      if (typeof fieldValue === 'boolean') return String(fieldValue) === f.value;
      return applyStringFilter(safeFieldString(fieldValue), f.operator, f.value);
    });
  }
  return result;
}

function applySearch<T>(items: T[], search: string, fields: readonly (keyof T)[]): T[] {
  if (!search) return items;
  const q = search.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => safeFieldString(item[field]).toLowerCase().includes(q))
  );
}

function applySort<T>(items: T[], sorts: ParsedSort[], fallback: (a: T, b: T) => number): void {
  const primary = sorts[0];
  if (primary) {
    const { field, desc } = primary;
    items.sort((a, b) => {
      const aVal = safeFieldString((a as Record<string, unknown>)[field]);
      const bVal = safeFieldString((b as Record<string, unknown>)[field]);
      const cmp = aVal.localeCompare(bVal);
      return desc ? -cmp : cmp;
    });
  } else {
    items.sort(fallback);
  }
}

function applyGroupBy<T>(items: T[], groupBy: string): GroupedResult<T> {
  const groupMap = new Map<string, T[]>();
  for (const item of items) {
    const key = safeFieldString((item as Record<string, unknown>)[groupBy]);
    const group = groupMap.get(key);
    if (group) group.push(item);
    else groupMap.set(key, [item]);
  }
  return {
    groups: Array.from(groupMap.entries()).map(([value, list]) => ({
      field: groupBy,
      value,
      label: value,
      count: list.length,
      items: list,
    })),
    totalCount: items.length,
  };
}

/** Reusable "active/inactive" preset filter — shared by every reference-data resource. */
export function applyStatusPreset<T extends { activated: boolean }>(items: T[], url: URL): T[] {
  const presetStatus = url.searchParams.get('presets[status]');
  if (!presetStatus) return items;
  const names = new Set(presetStatus.split(','));
  const hasActive = names.has('active');
  const hasInactive = names.has('inactive');
  if (hasActive && !hasInactive) return items.filter((i) => i.activated);
  if (hasInactive && !hasActive) return items.filter((i) => !i.activated);
  return items;
}

/**
 * Create stateful MSW handlers for a reference-data resource. The store mutates
 * per invocation, so each call yields an isolated mock backend.
 */
export function createReferenceDataHandlers<T extends ReferenceDataEntry>(
  config: ReferenceDataHandlersConfig<T>
) {
  const BASE = config.basePath;
  let store: T[] = [...config.seed];

  return [
    http.get(`${BASE}/meta`, () => HttpResponse.json(config.meta())),

    http.get(BASE, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 20);

      let items = [...store];
      items = config.applyPresets ? config.applyPresets(items, url) : applyStatusPreset(items, url);
      items = applyAdvancedFilters(items, parseFilters(url));
      items = applySearch(items, url.searchParams.get('search') ?? '', config.searchFields);
      applySort(items, parseSort(url), config.defaultSort);

      const groupBy = url.searchParams.get('groupBy');
      if (groupBy) return HttpResponse.json(applyGroupBy(items, groupBy));

      const start = (page - 1) * pageSize;
      const response: PagedResult<T> = {
        items: items.slice(start, start + pageSize),
        totalCount: items.length,
      };
      return HttpResponse.json(response);
    }),

    http.get(`${BASE}/:code/children`, ({ params }) => {
      if (!config.hierarchical) return HttpResponse.json([]);
      const parentCode = (params.code as string).toUpperCase();
      const parent = store.find((c) => c.code === parentCode);
      if (!parent) return new HttpResponse(null, { status: 404 });
      const children = store
        .filter((c) => c.parentCode === parentCode && c.activated)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
      return HttpResponse.json(children);
    }),

    http.get(`${BASE}/:code`, ({ params }) => {
      const entry = store.find((c) => c.code === (params.code as string).toUpperCase());
      if (!entry) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(entry);
    }),

    http.post(BASE, async ({ request }) => {
      const body = (await request.json()) as Partial<T>;
      if (store.some((c) => c.code === body.code)) {
        return HttpResponse.json(
          { title: 'Conflict', status: 409, detail: config.conflictMessage },
          { status: 409 }
        );
      }
      const newEntry = config.createEntry(body);
      store = [...store, newEntry];
      return HttpResponse.json(newEntry, { status: 201 });
    }),

    http.put(`${BASE}/:code`, async ({ params, request }) => {
      const code = (params.code as string).toUpperCase();
      const body = (await request.json()) as Partial<T>;
      const existing = store.find((c) => c.code === code);
      if (!existing) return new HttpResponse(null, { status: 404 });
      const updated = { ...existing, ...body, code } as T;
      store = store.map((c) => (c.code === code ? updated : c));
      return HttpResponse.json(updated);
    }),

    http.delete(`${BASE}/:code`, ({ params }) => {
      const code = (params.code as string).toUpperCase();
      const index = store.findIndex((c) => c.code === code);
      if (index === -1) return new HttpResponse(null, { status: 404 });
      store = store.map((c) => (c.code === code ? { ...c, activated: false } : c));
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

/** Defaults for the 14 localized label fields on a `ReferenceDataEntry`. */
export const emptyLabels = {
  labelEn: '',
  labelFr: '',
  labelNl: '',
  labelDe: '',
  labelEs: '',
  labelIt: '',
  labelPt: '',
  labelZh: '',
  labelJa: '',
  labelPl: '',
  labelTr: '',
  labelKo: '',
  labelSv: '',
  labelCs: '',
} as const;

/** Build a `ReferenceDataEntry` from a `Partial<T>` body (for POST handlers). */
export function buildBaseEntry(body: Partial<ReferenceDataEntry>): ReferenceDataEntry {
  return {
    id: toEntityId<'ReferenceDataEntry'>(crypto.randomUUID()),
    code: body.code ?? '',
    label: body.labelEn ?? '',
    ...emptyLabels,
    labelEn: body.labelEn ?? '',
    labelFr: body.labelFr ?? '',
    labelNl: body.labelNl ?? '',
    labelDe: body.labelDe ?? '',
    labelEs: body.labelEs ?? '',
    labelIt: body.labelIt ?? '',
    labelPt: body.labelPt ?? '',
    labelZh: body.labelZh ?? '',
    labelJa: body.labelJa ?? '',
    labelPl: body.labelPl ?? '',
    labelTr: body.labelTr ?? '',
    labelKo: body.labelKo ?? '',
    labelSv: body.labelSv ?? '',
    labelCs: body.labelCs ?? '',
    sortOrder: body.sortOrder ?? 0,
    activated: body.activated ?? true,
    validFrom: body.validFrom ?? null,
    validTo: body.validTo ?? null,
    parentCode: body.parentCode ?? null,
    metadata: body.metadata ?? null,
  };
}
