import { http, HttpResponse } from 'msw';

import { mockBlobs, S } from './data.js';

import type { BlobDescriptorResponse, BlobStatusValue } from '@granit/blob-storage';
import type { GroupedResult, PagedResult } from '@granit/query-engine';

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

function parseFilters(url: URL): { field: string; operator: string; value: string }[] {
  const filters: { field: string; operator: string; value: string }[] = [];
  const filterRegex = /^filter\[(.+)\.(\w+)\]$/;
  for (const [key, value] of url.searchParams.entries()) {
    const match = filterRegex.exec(key);
    if (match?.[1] && match[2]) {
      filters.push({ field: match[1], operator: match[2], value });
    }
  }
  return filters;
}

function parseSort(url: URL): { field: string; desc: boolean }[] {
  const sortStr = url.searchParams.get('sort');
  if (!sortStr) return [];
  return sortStr.split(',').map((part) => {
    if (part.startsWith('-')) return { field: part.slice(1), desc: true };
    return { field: part, desc: false };
  });
}

function applyStringFilter(value: string, operator: string, filterValue: string): boolean {
  const v = value.toLowerCase();
  const f = filterValue.toLowerCase();
  switch (operator) {
    case 'Eq':
      return v === f;
    case 'Contains':
      return v.includes(f);
    case 'StartsWith':
      return v.startsWith(f);
    default:
      return true;
  }
}

const STATUS_LABELS: Record<BlobStatusValue, string> = {
  0: 'Pending',
  1: 'Uploading',
  2: 'Valid',
  3: 'Rejected',
  4: 'Deleted',
};

/**
 * Create MSW handlers for blob storage endpoints.
 * The mock data is read-only — the handlers simulate a read-only admin view.
 *
 * @param baseUrl - API base path (default: `/api/v1/blob-storage`)
 */
export function createBlobStorageHandlers(baseUrl = '/api/v1/blob-storage') {
  return [
    http.get(`${baseUrl}/meta`, () => {
      return HttpResponse.json({
        columns: [
          {
            name: 'originalFileName',
            label: 'File name',
            type: 'String',
            order: 1,
            isSortable: true,
            isFilterable: true,
            isVisible: true,
          },
          {
            name: 'containerName',
            label: 'Container',
            type: 'String',
            order: 2,
            isSortable: true,
            isFilterable: true,
            isVisible: true,
          },
          {
            name: 'declaredContentType',
            label: 'Content type',
            type: 'String',
            order: 3,
            isSortable: false,
            isFilterable: true,
            isVisible: true,
          },
          {
            name: 'declaredSizeBytes',
            label: 'Size',
            type: 'Int64',
            order: 4,
            isSortable: true,
            isFilterable: false,
            isVisible: true,
          },
          {
            name: 'status',
            label: 'Status',
            type: 'Int32',
            order: 5,
            isSortable: true,
            isFilterable: false,
            isVisible: true,
          },
          {
            name: 'createdAt',
            label: 'Created at',
            type: 'DateTime',
            order: 6,
            isSortable: true,
            isFilterable: false,
            isVisible: true,
          },
        ],
        filterableFields: [
          { name: 'originalFileName', type: 'String', operators: ['Eq', 'Contains', 'StartsWith'] },
          { name: 'containerName', type: 'String', operators: ['Eq'] },
          { name: 'declaredContentType', type: 'String', operators: ['Eq', 'Contains'] },
        ],
        sortableFields: [
          { name: 'originalFileName' },
          { name: 'containerName' },
          { name: 'declaredSizeBytes' },
          { name: 'createdAt' },
          { name: 'status' },
        ],
        presetFilterGroups: [
          {
            name: 'status',
            label: 'Status',
            presets: [
              { name: 'valid', label: 'Valid', isDefault: false },
              { name: 'pending', label: 'Pending', isDefault: false },
              { name: 'rejected', label: 'Rejected', isDefault: false },
              { name: 'deleted', label: 'Deleted', isDefault: false },
            ],
          },
        ],
        quickFilters: [],
        dateFilters: [],
        groupByFields: [
          { name: 'containerName', type: 'String' },
          { name: 'status', type: 'Int32' },
        ],
        pagination: {
          defaultPageSize: 20,
          maxPageSize: 50,
          maxStreamSize: 1000,
          supportsCursor: false,
        },
      });
    }),

    http.get(baseUrl, ({ request }) => {
      const url = new URL(request.url);
      const search = url.searchParams.get('search') ?? '';
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
      const filters = parseFilters(url);
      const sortEntries = parseSort(url);
      const presetStatus = url.searchParams.get('presets[status]');

      let filtered = [...mockBlobs];

      // Preset filters
      if (presetStatus) {
        const presetNames = new Set(presetStatus.split(','));
        filtered = filtered.filter((b) => {
          if (presetNames.has('valid') && b.status === S.Valid) return true;
          if (presetNames.has('pending') && (b.status === S.Pending || b.status === S.Uploading))
            return true;
          if (presetNames.has('rejected') && b.status === S.Rejected) return true;
          if (presetNames.has('deleted') && b.status === S.Deleted) return true;
          return false;
        });
      }

      // Advanced filters
      for (const f of filters) {
        filtered = filtered.filter((b) => {
          const fieldValue = b[f.field as keyof BlobDescriptorResponse];
          return applyStringFilter(String(fieldValue ?? ''), f.operator, f.value);
        });
      }

      // Full-text search
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (b) =>
            b.originalFileName.toLowerCase().includes(q) ||
            b.containerName.toLowerCase().includes(q)
        );
      }

      // Sort
      const firstSort = sortEntries[0];
      if (firstSort) {
        const { field, desc } = firstSort;
        filtered.sort((a, b) => {
          const aVal = a[field as keyof BlobDescriptorResponse];
          const bVal = b[field as keyof BlobDescriptorResponse];
          let cmp: number;
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            cmp = aVal - bVal;
          } else {
            cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
          }
          return desc ? -cmp : cmp;
        });
      } else {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      // GroupBy
      const groupBy = url.searchParams.get('groupBy');
      if (groupBy) {
        const groupMap = new Map<string, BlobDescriptorResponse[]>();
        for (const item of filtered) {
          const rawKey = item[groupBy as keyof BlobDescriptorResponse];
          const key = String(rawKey ?? '');
          if (!groupMap.has(key)) groupMap.set(key, []);
          groupMap.get(key)!.push(item);
        }
        const response: GroupedResult<BlobDescriptorResponse> = {
          groups: Array.from(groupMap.entries()).map(([value, items]) => ({
            field: groupBy,
            value,
            label:
              groupBy === 'status'
                ? (STATUS_LABELS[Number(value) as BlobStatusValue] ?? value)
                : value,
            count: items.length,
            items,
          })),
          totalCount: filtered.length,
        };
        return HttpResponse.json(response);
      }

      // Paged result
      const start = (page - 1) * pageSize;
      const response: PagedResult<BlobDescriptorResponse> = {
        items: filtered.slice(start, start + pageSize),
        totalCount: filtered.length,
        nextCursor: undefined,
      };
      return HttpResponse.json(response);
    }),

    http.get(`${baseUrl}/:id`, ({ params }) => {
      const blob = mockBlobs.find((b) => b.id === params.id);
      if (!blob) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(blob);
    }),
  ];
}
