import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import {
  applyStringFilter,
  groupBy as groupByField,
  paginate,
  parseFilters,
  parseSort,
  sortItems,
} from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import { mockBlobs, S } from './data.js';

import type { BlobDescriptorResponse, BlobStatusValue } from '@granit/blob-storage';
import type { QueryMetadata } from '@granit/query-engine';

/** Mock /meta payload for the blobs resource. */
export const blobQueryMetadata: QueryMetadata = {
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
};

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
export function createBlobStorageHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    createQueryMetaHandler(`${baseUrl}/blobs`, blobQueryMetadata),

    http.get(`${baseUrl}/blobs`, ({ request }) => {
      const url = new URL(request.url);
      const search = url.searchParams.get('search') ?? '';
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

      // Sort — fall back to createdAt desc when no explicit sort is given
      if (sortEntries.length > 0) {
        sortItems(filtered as unknown as Record<string, unknown>[], sortEntries);
      } else {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      // GroupBy
      const groupByParam = url.searchParams.get('groupBy');
      if (groupByParam) {
        const labelFn = (key: string): string =>
          groupByParam === 'status' ? (STATUS_LABELS[Number(key) as BlobStatusValue] ?? key) : key;
        return HttpResponse.json(
          groupByField(filtered as unknown as Record<string, unknown>[], groupByParam, labelFn)
        );
      }

      return HttpResponse.json(paginate(filtered, url));
    }),

    http.get(`${baseUrl}/blobs/:id`, ({ params }) => {
      const blob = mockBlobs.find((b) => b.id === params.id);
      if (!blob) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(blob);
    }),
  ];
}
