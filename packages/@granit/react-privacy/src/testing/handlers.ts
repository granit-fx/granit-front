import { DATE_OPERATORS, ENUM_OPERATORS, STRING_OPERATORS } from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { notFound } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import {
  mockAgreementHistory,
  mockAgreementStatuses,
  mockDeletionRequests,
  mockExports,
  mockLegalDocumentDetails,
  mockLegalDocuments,
} from './data';

import type {
  AgreementHistoryEntry,
  AgreementStatus,
  LegalDocumentCreateRequest,
  LegalDocumentDetail,
  LegalDocumentUpdateRequest,
  PrivacyDeletionRequestResponse,
  PrivacyDeletionStatusResponse,
  PrivacyExportStatusResponse,
} from '@granit/privacy';
import type { QueryMetadata } from '@granit/query-engine';
import type { Mutable } from '@granit/testing';

const EXPORT_STATES = ['Pending', 'Completed', 'PartiallyCompleted', 'TimedOut'];
const DELETION_STATES = ['Deferred', 'Executed', 'Cancelled'];
const LEGAL_LIFECYCLE_STATES = ['Draft', 'Published', 'Archived'];

/** Mock /meta payload for the privacy exports resource. */
export const privacyExportQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'requestId',
      label: 'Request ID',
      type: 'String',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'requestedAt',
      label: 'Requested at',
      type: 'DateTime',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'state',
      label: 'State',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'completedAt',
      label: 'Completed at',
      type: 'DateTime',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'archiveBlobReferenceId',
      label: 'Archive',
      type: 'String',
      order: 4,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
  ],
  filterableFields: [
    { name: 'requestedAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'state', type: 'String', operators: ENUM_OPERATORS, enumValues: EXPORT_STATES },
    { name: 'completedAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [{ name: 'requestedAt' }, { name: 'state' }, { name: 'completedAt' }],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [
    {
      name: 'requestedAt',
      defaultPeriod: 'ThisMonth',
      availablePeriods: ['Today', 'ThisWeek', 'ThisMonth', 'LastMonth', 'ThisYear', 'Custom'],
    },
  ],
  groupByFields: [{ name: 'state', type: 'String' }],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: '-requestedAt',
};

/** Mock /meta payload for the privacy deletions resource. */
export const privacyDeletionQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'requestId',
      label: 'Request ID',
      type: 'String',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'state',
      label: 'Status',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'reason',
      label: 'Reason',
      type: 'String',
      order: 2,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'requestedAt',
      label: 'Requested at',
      type: 'DateTime',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'executedAt',
      label: 'Executed at',
      type: 'DateTime',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'scheduledDeletionAt',
      label: 'Scheduled at',
      type: 'DateTime',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'cancelledAt',
      label: 'Cancelled at',
      type: 'DateTime',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
    },
  ],
  filterableFields: [
    { name: 'state', type: 'String', operators: ENUM_OPERATORS, enumValues: DELETION_STATES },
    { name: 'reason', type: 'String', operators: STRING_OPERATORS },
    { name: 'requestedAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'executedAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'scheduledDeletionAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'cancelledAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [
    { name: 'state' },
    { name: 'requestedAt' },
    { name: 'executedAt' },
    { name: 'scheduledDeletionAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [
    {
      name: 'requestedAt',
      defaultPeriod: 'ThisMonth',
      availablePeriods: ['Today', 'ThisWeek', 'ThisMonth', 'LastMonth', 'ThisYear', 'Custom'],
    },
  ],
  groupByFields: [{ name: 'state', type: 'String' }],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: '-requestedAt',
};

/** Mock /meta payload for the legal-documents admin resource. */
export const legalDocumentQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'id',
      label: 'ID',
      type: 'String',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'documentId',
      label: 'Document',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'displayName',
      label: 'Display name',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'version',
      label: 'Version',
      type: 'Int32',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'lifecycleStatus',
      label: 'Status',
      type: 'String',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'createdAt',
      label: 'Created at',
      type: 'DateTime',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'lastModifiedAt',
      label: 'Modified at',
      type: 'DateTime',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'documentId', type: 'String', operators: STRING_OPERATORS },
    { name: 'displayName', type: 'String', operators: STRING_OPERATORS },
    { name: 'version', type: 'Int32', operators: ENUM_OPERATORS },
    {
      name: 'lifecycleStatus',
      type: 'String',
      operators: ENUM_OPERATORS,
      enumValues: LEGAL_LIFECYCLE_STATES,
    },
    { name: 'createdAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'lastModifiedAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [
    { name: 'documentId' },
    { name: 'displayName' },
    { name: 'version' },
    { name: 'lifecycleStatus' },
    { name: 'createdAt' },
    { name: 'lastModifiedAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'draft', label: 'Drafts', isDefault: false },
    { name: 'published', label: 'Published', isDefault: true },
  ],
  dateFilters: [],
  groupByFields: [
    { name: 'lifecycleStatus', type: 'String' },
    { name: 'documentId', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: '-lastModifiedAt',
};

/**
 * Create stateful MSW handlers for privacy endpoints (GDPR export, deletion,
 * agreements) and legal document admin endpoints.
 *
 * @param baseUrl - API base path (default: `/api/v1/privacy`)
 */
export function createPrivacyHandlers(baseUrl = DEFAULT_BASE_PATH) {
  const exports: Mutable<PrivacyExportStatusResponse>[] = mockExports.map((e) => ({ ...e }));
  const deletionRequests: Mutable<PrivacyDeletionStatusResponse>[] = mockDeletionRequests.map(
    (d) => ({ ...d })
  );
  const statuses: Mutable<AgreementStatus>[] = mockAgreementStatuses.map((s) => ({ ...s }));
  let history: AgreementHistoryEntry[] = mockAgreementHistory.map((h) => ({ ...h }));
  let exportCounter = exports.length;
  let deletionCounter = deletionRequests.length;

  const legalDocuments: Mutable<LegalDocumentDetail>[] = mockLegalDocumentDetails.map((d) => ({
    ...d,
  }));
  let legalIdCounter = legalDocuments.length;

  const legalBase = `${baseUrl}/legal-documents`;

  return [
    // GET /exports/meta — query metadata
    createQueryMetaHandler(`${baseUrl}/exports`, privacyExportQueryMetadata),

    // GET /deletions/meta — query metadata
    createQueryMetaHandler(`${baseUrl}/deletions`, privacyDeletionQueryMetadata),

    // GET /legal-documents/meta — query metadata
    createQueryMetaHandler(legalBase, legalDocumentQueryMetadata),

    // POST /exports — request a new data export
    http.post(`${baseUrl}/exports`, () => {
      exportCounter++;
      const requestId = `exp-${String(exportCounter).padStart(3, '0')}`;
      const requestedAt = new Date().toISOString();
      const newExport: Mutable<PrivacyExportStatusResponse> = {
        requestId,
        requestedAt,
        state: 'Pending',
        archiveBlobReferenceId: null,
        completedAt: null,
        missingProviders: [],
      };
      exports.unshift(newExport);
      return HttpResponse.json({ requestId, requestedAt }, { status: 202 });
    }),

    // GET /exports — list all exports
    http.get(`${baseUrl}/exports`, () => {
      return HttpResponse.json(exports);
    }),

    // GET /exports/:requestId — get status of a specific export
    http.get(`${baseUrl}/exports/:requestId`, ({ params }) => {
      const exportItem = exports.find((e) => e.requestId === params.requestId);
      if (!exportItem) return notFound();
      return HttpResponse.json(exportItem);
    }),

    // POST /deletions — request account deletion
    http.post(`${baseUrl}/deletions`, async ({ request }) => {
      const body = (await request.json()) as { reason: string; defer?: boolean };
      deletionCounter++;
      const requestId = `del-${String(deletionCounter).padStart(3, '0')}`;
      const now = new Date().toISOString();
      const scheduledDeletionAt = body.defer
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : now;
      const record: Mutable<PrivacyDeletionStatusResponse> = {
        requestId,
        state: body.defer ? 'Deferred' : 'Executed',
        reason: body.reason,
        requestedAt: now,
        executedAt: body.defer ? null : now,
        scheduledDeletionAt,
        cancelledAt: null,
      };
      deletionRequests.unshift(record);
      const postResponse: PrivacyDeletionRequestResponse = { requestId, scheduledDeletionAt };
      return HttpResponse.json(postResponse, { status: 202 });
    }),

    // GET /deletions — list all deletion requests
    http.get(`${baseUrl}/deletions`, () => {
      return HttpResponse.json(deletionRequests);
    }),

    // GET /deletions/:requestId — get status of a specific deletion request
    http.get(`${baseUrl}/deletions/:requestId`, ({ params }) => {
      const item = deletionRequests.find((r) => r.requestId === params.requestId);
      if (!item) return notFound();
      return HttpResponse.json(item);
    }),

    // POST /deletions/:requestId/cancel — cancel a deferred deletion
    http.post(`${baseUrl}/deletions/:requestId/cancel`, ({ params }) => {
      const item = deletionRequests.find((r) => r.requestId === params.requestId);
      if (!item) return notFound();
      if (item.state !== 'Deferred') {
        return HttpResponse.json(
          { message: 'Deletion request is already executed or cancelled' },
          { status: 409 }
        );
      }
      item.state = 'Cancelled';
      item.cancelledAt = new Date().toISOString();
      return new HttpResponse(null, { status: 200 });
    }),

    // GET /agreements/documents — list legal documents
    http.get(`${baseUrl}/agreements/documents`, () => {
      return HttpResponse.json(mockLegalDocuments);
    }),

    // GET /agreements/status — get agreement statuses
    http.get(`${baseUrl}/agreements/status`, () => {
      return HttpResponse.json(statuses);
    }),

    // GET /agreements/history — get agreement history
    http.get(`${baseUrl}/agreements/history`, () => {
      return HttpResponse.json(history);
    }),

    // POST /agreements/accept — accept a legal document
    http.post(`${baseUrl}/agreements/accept`, async ({ request }) => {
      const body = (await request.json()) as { documentId: string; version: string };
      const { documentId, version } = body;

      const status = statuses.find((s) => s.documentId === documentId);
      if (status) {
        status.currentVersion = version;
        status.hasAcceptedLatest = true;
        status.lastAcceptedAt = new Date().toISOString();
      }

      history = history.map((h) => (h.documentId === documentId ? { ...h, isLatest: false } : h));

      history.unshift({
        id: `ah-${Date.now()}`,
        documentId,
        version,
        acceptedAt: new Date().toISOString(),
        isLatest: true,
      });

      return new HttpResponse(null, { status: 201 });
    }),

    // GET /legal-documents — list all, optionally filtered by documentId
    http.get(legalBase, ({ request }) => {
      const url = new URL(request.url);
      const documentId = url.searchParams.get('documentId');

      let result = legalDocuments as LegalDocumentDetail[];
      if (documentId) {
        result = legalDocuments.filter((d) => d.documentId === documentId) as LegalDocumentDetail[];
      }

      result = [...result].sort((a, b) => b.version - a.version);
      return HttpResponse.json(result);
    }),

    // GET /legal-documents/:id — single document by id
    http.get(`${legalBase}/:id`, ({ params }) => {
      const doc = legalDocuments.find((d) => d.id === params.id);
      if (!doc) return notFound();
      return HttpResponse.json(doc);
    }),

    // POST /legal-documents — create a new draft
    http.post(legalBase, async ({ request }) => {
      const body = (await request.json()) as LegalDocumentCreateRequest;
      legalIdCounter++;
      const id = `ld-${String(legalIdCounter).padStart(3, '0')}`;
      const now = new Date().toISOString();
      const newDoc: LegalDocumentDetail = {
        id,
        documentId: body.documentId,
        version: 1,
        lifecycleStatus: 'Draft',
        displayName: body.displayName,
        description: body.description ?? null,
        templateName: body.templateName ?? null,
        documentBlobId: null,
        createdAt: now,
        lastModifiedAt: now,
        concurrencyStamp: `stamp-${id}`,
      };
      legalDocuments.unshift({ ...newDoc });
      return HttpResponse.json(newDoc, { status: 201 });
    }),

    // PUT /legal-documents/:id — update a draft
    http.put(`${legalBase}/:id`, async ({ params, request }) => {
      const doc = legalDocuments.find((d) => d.id === params.id);
      if (!doc) return notFound();
      if (doc.lifecycleStatus !== 'Draft') {
        return HttpResponse.json(
          { message: 'Only draft documents can be updated' },
          { status: 409 }
        );
      }

      const body = (await request.json()) as LegalDocumentUpdateRequest;
      doc.displayName = body.displayName;
      doc.description = body.description ?? doc.description;
      doc.templateName = body.templateName ?? doc.templateName;
      doc.documentBlobId = body.documentBlobId ?? doc.documentBlobId;
      doc.lastModifiedAt = new Date().toISOString();
      doc.concurrencyStamp = `stamp-${doc.id}-${doc.lastModifiedAt}`;
      return HttpResponse.json(doc);
    }),

    // POST /legal-documents/:id/publish — publish a draft
    http.post(`${legalBase}/:id/publish`, ({ params }) => {
      const doc = legalDocuments.find((d) => d.id === params.id);
      if (!doc) return notFound();
      if (doc.lifecycleStatus !== 'Draft') {
        return HttpResponse.json(
          { message: 'Only draft documents can be published' },
          { status: 409 }
        );
      }

      // Archive any currently published version of the same documentId
      for (const d of legalDocuments) {
        if (d.documentId === doc.documentId && d.lifecycleStatus === 'Published') {
          d.lifecycleStatus = 'Archived';
        }
      }

      doc.lifecycleStatus = 'Published';
      doc.lastModifiedAt = new Date().toISOString();
      return HttpResponse.json(doc);
    }),
  ];
}
