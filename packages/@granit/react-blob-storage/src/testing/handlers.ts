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

import type {
  BlobConfirmUploadRequest,
  BlobConfirmUploadResponse,
  BlobDescriptorResponse,
  BlobStatusValue,
  BlobUploadInitiateRequest,
  BlobUploadInitiateResponse,
} from '@granit/blob-storage';
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

    // Direct-to-cloud upload flow — three handlers covering the
    // initiate → PUT → confirm shape `useBlobUpload` orchestrates. The
    // pre-signed URL points back at this same MSW deployment so the
    // PUT is interceptable in mock mode (real hosts hit S3 / Azure /
    // GCS pre-signed URLs that bypass the API). Uploads are tracked
    // in-memory by `pendingUploads` so the confirm step can echo back
    // the right metadata.
    http.post<never, BlobUploadInitiateRequest>(`${baseUrl}/blobs/upload`, async ({ request }) => {
      const body = await request.json();
      const blobId = `${body.containerName}/${randomId()}-${body.fileName}`;
      pendingUploads.set(blobId, body);
      const response: BlobUploadInitiateResponse = {
        blobId,
        uploadUrl: `${baseUrl}/blobs/${encodeURIComponent(blobId)}/_mock-upload-target`,
        httpMethod: 'PUT',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        requiredHeaders: {},
      };
      return HttpResponse.json(response);
    }),

    http.put(`${baseUrl}/blobs/:id/_mock-upload-target`, () => {
      // Stand-in for the real provider's pre-signed PUT — accept the
      // bytes, no body, no headers. The bytes are discarded; the
      // confirm step is what surfaces a "Valid" descriptor.
      return new HttpResponse(null, { status: 200 });
    }),

    http.post<{ id: string }, BlobConfirmUploadRequest>(
      `${baseUrl}/blobs/:id/confirm`,
      ({ params }) => {
        const blobId = decodeURIComponent(params.id);
        const tracked = pendingUploads.get(blobId);
        if (!tracked) return new HttpResponse(null, { status: 404 });
        pendingUploads.delete(blobId);
        const response: BlobConfirmUploadResponse = {
          blobId,
          isValid: true,
          status: S.Valid,
          verifiedContentType: tracked.contentType,
          sizeBytes: tracked.sizeBytes,
          rejectionReason: null,
        };
        // Stash the descriptor so subsequent `GET /blobs/:id` requests
        // (typically issued by `<BlobImage>` or the blob list page)
        // find the freshly-uploaded record.
        const now = new Date().toISOString();
        const descriptor: BlobDescriptorResponse = {
          id: blobId,
          containerName: tracked.containerName,
          originalFileName: tracked.fileName,
          declaredContentType: tracked.contentType,
          verifiedContentType: tracked.contentType,
          declaredSizeBytes: tracked.sizeBytes,
          actualSizeBytes: tracked.sizeBytes,
          status: S.Valid,
          rejectionReason: null,
          deletionReason: null,
          createdAt: now,
          validatedAt: now,
          deletedAt: null,
        };
        mockBlobs.push(descriptor);
        return HttpResponse.json(response);
      }
    ),
  ];
}

const pendingUploads = new Map<string, BlobUploadInitiateRequest>();

function randomId(): string {
  // Crypto-grade ids are overkill for the mock; the goal is just a
  // collision-free token within a session.
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
}
