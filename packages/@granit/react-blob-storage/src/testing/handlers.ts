import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import {
  applyStringFilter,
  paginate,
  parseFilters,
  parseSort,
  sortItems,
} from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockBlobs, S } from './data';

import type {
  BlobConfirmUploadRequest,
  BlobConfirmUploadResponse,
  BlobDescriptorResponse,
  BlobUploadInitiateRequest,
  BlobUploadInitiateResponse,
} from '@granit/blob-storage';
import type { QueryMetadata } from '@granit/query-engine';

/**
 * Mock `/meta` payload for the blobs resource — mirrors the backend
 * `Granit.BlobStorage.Queries.BlobDescriptorQueryDefinition`:
 *
 * - rows are the domain `BlobDescriptor` projection (note `sizeBytes`, not the
 *   DTO's `declaredSizeBytes`/`actualSizeBytes`),
 * - a single `ValidOnly` **quick filter** is the default (no status preset group),
 * - a `createdAt` date filter, default sort `-createdAt`, default page size 25,
 * - no group-by fields.
 */
export const blobQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'tenantId',
      label: 'Tenant',
      type: 'Guid',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
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
      name: 'originalFileName',
      label: 'File Name',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'declaredContentType',
      label: 'Content Type',
      type: 'String',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'verifiedContentType',
      label: 'Verified Content Type',
      type: 'String',
      order: 5,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'sizeBytes',
      label: 'Size (bytes)',
      type: 'Int64',
      order: 6,
      isSortable: true,
      isFilterable: false,
      isVisible: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 7,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'createdAt',
      label: 'Created At',
      type: 'DateTime',
      order: 8,
      isSortable: true,
      isFilterable: false,
      isVisible: true,
    },
    {
      name: 'validatedAt',
      label: 'Validated At',
      type: 'DateTime',
      order: 9,
      isSortable: true,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'deletedAt',
      label: 'Deleted At',
      type: 'DateTime',
      order: 10,
      isSortable: true,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'rejectionReason',
      label: 'Rejection Reason',
      type: 'String',
      order: 11,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
  ],
  filterableFields: [
    { name: 'tenantId', type: 'Guid', operators: ['Eq'] },
    { name: 'containerName', type: 'String', operators: ['Eq', 'Contains', 'StartsWith'] },
    { name: 'originalFileName', type: 'String', operators: ['Eq', 'Contains', 'StartsWith'] },
    { name: 'declaredContentType', type: 'String', operators: ['Eq', 'Contains'] },
    { name: 'verifiedContentType', type: 'String', operators: ['Eq', 'Contains'] },
    {
      name: 'status',
      type: 'String',
      operators: ['Eq'],
      enumValues: ['Pending', 'Uploading', 'Valid', 'Rejected', 'Deleted'],
    },
  ],
  sortableFields: [
    { name: 'tenantId' },
    { name: 'containerName' },
    { name: 'originalFileName' },
    { name: 'declaredContentType' },
    { name: 'sizeBytes' },
    { name: 'status' },
    { name: 'createdAt' },
    { name: 'validatedAt' },
    { name: 'deletedAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [{ name: 'ValidOnly', label: 'Valid uploads only', isDefault: true }],
  dateFilters: [
    {
      name: 'createdAt',
      defaultPeriod: 'ThisMonth',
      availablePeriods: [
        'Today',
        'ThisWeek',
        'ThisMonth',
        'LastMonth',
        'ThisQuarter',
        'ThisYear',
        'Custom',
      ],
    },
  ],
  groupByFields: [],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 1000,
    supportsCursor: false,
  },
  defaultSort: '-createdAt',
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

      // The query endpoint (`MapGranitQuery<BlobDescriptor>`) returns the domain
      // projection, where the actual size lives in `sizeBytes` (null until
      // validated) — not the descriptor DTO's `declaredSizeBytes`/`actualSizeBytes`.
      let filtered = mockBlobs.map((b) => ({ ...b, sizeBytes: b.actualSizeBytes }));

      // Quick filters — `ValidOnly` is the backend default (isDefault: true),
      // applied server-side when the client sends no `quickFilters` param.
      const quickFiltersParam = url.searchParams.get('quickFilters');
      const activeQuickFilters =
        quickFiltersParam !== null
          ? new Set(quickFiltersParam.split(',').filter(Boolean))
          : new Set(['ValidOnly']);
      if (activeQuickFilters.has('ValidOnly')) {
        filtered = filtered.filter((b) => b.status === S.Valid);
      }

      // Advanced filters
      for (const f of filters) {
        filtered = filtered.filter((b) => {
          const fieldValue = b[f.field as keyof typeof b];
          return applyStringFilter(String(fieldValue ?? ''), f.operator, f.value);
        });
      }

      // Full-text search (OriginalFileName, ContainerName)
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (b) =>
            b.originalFileName.toLowerCase().includes(q) ||
            b.containerName.toLowerCase().includes(q)
        );
      }

      // Sort — fall back to createdAt desc (the backend default sort) when none given
      if (sortEntries.length > 0) {
        sortItems(filtered as unknown as Record<string, unknown>[], sortEntries);
      } else {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

    // Cancel a Pending upload (presigned PUT failed client-side). Drops the
    // tracked upload so it no longer lingers — mirrors the backend transition
    // Pending → Rejected. 404 when the blob is unknown / no longer Pending.
    http.delete(`${baseUrl}/blobs/:id/pending`, ({ params }) => {
      const blobId = decodeURIComponent(params.id as string);
      if (!pendingUploads.has(blobId)) {
        return new HttpResponse(null, { status: 404 });
      }
      pendingUploads.delete(blobId);
      return new HttpResponse(null, { status: 204 });
    }),
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
