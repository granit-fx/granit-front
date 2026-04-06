import { notFound } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import {
  mockAgreementHistory,
  mockAgreementStatuses,
  mockDeletionRequests,
  mockExports,
  mockLegalDocumentDetails,
  mockLegalDocuments,
} from './data.js';

import type {
  AgreementHistoryEntry,
  AgreementStatus,
  LegalDocumentCreateRequest,
  LegalDocumentDetail,
  LegalDocumentUpdateRequest,
  PrivacyDeletionResponse,
  PrivacyExportStatusResponse,
} from '@granit/privacy';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * Create stateful MSW handlers for privacy endpoints (GDPR export, deletion,
 * agreements) and legal document admin endpoints.
 *
 * @param baseUrl - API base path (default: `/api/v1/privacy`)
 */
export function createPrivacyHandlers(baseUrl = '/api/v1/privacy') {
  const exports: Mutable<PrivacyExportStatusResponse>[] = mockExports.map((e) => ({ ...e }));
  const deletionRequests: Mutable<PrivacyDeletionResponse>[] = mockDeletionRequests.map((d) => ({
    ...d,
  }));
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
    // POST /export — request a new data export
    http.post(`${baseUrl}/export`, () => {
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

    // GET /export — list all exports
    http.get(`${baseUrl}/export`, () => {
      return HttpResponse.json(exports);
    }),

    // GET /export/:requestId — get status of a specific export
    http.get(`${baseUrl}/export/:requestId`, ({ params }) => {
      const exportItem = exports.find((e) => e.requestId === params.requestId);
      if (!exportItem) return notFound();
      return HttpResponse.json(exportItem);
    }),

    // POST /deletion — request account deletion
    http.post(`${baseUrl}/deletion`, async ({ request }) => {
      const body = (await request.json()) as { reason: string; defer?: boolean };
      deletionCounter++;
      const requestId = `del-${String(deletionCounter).padStart(3, '0')}`;
      const now = new Date().toISOString();
      const response: Mutable<PrivacyDeletionResponse> = {
        requestId,
        status: body.defer ? 'Deferred' : 'Executed',
        reason: body.reason,
        requestedAt: now,
        executedAt: body.defer ? null : now,
        ...(body.defer && {
          scheduledDeletionAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      };
      deletionRequests.unshift(response);
      return HttpResponse.json(response, { status: 202 });
    }),

    // GET /deletion — list all deletion requests
    http.get(`${baseUrl}/deletion`, () => {
      return HttpResponse.json(deletionRequests);
    }),

    // GET /deletion/:requestId — get status of a specific deletion request
    http.get(`${baseUrl}/deletion/:requestId`, ({ params }) => {
      const item = deletionRequests.find((r) => r.requestId === params.requestId);
      if (!item) return notFound();
      return HttpResponse.json(item);
    }),

    // POST /deletion/:requestId/cancel — cancel a deferred deletion
    http.post(`${baseUrl}/deletion/:requestId/cancel`, ({ params }) => {
      const item = deletionRequests.find((r) => r.requestId === params.requestId);
      if (!item) return notFound();
      if (item.status !== 'Deferred') {
        return HttpResponse.json(
          { message: 'Deletion request is already executed or cancelled' },
          { status: 409 }
        );
      }
      item.status = 'Cancelled';
      (item as Record<string, unknown>)['cancelledAt'] = new Date().toISOString();
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
      const now = new Date().toISOString();
      const newDoc: LegalDocumentDetail = {
        id: `ld-${String(legalIdCounter).padStart(3, '0')}`,
        documentId: body.documentId,
        version: 1,
        lifecycleStatus: 'Draft',
        displayName: body.displayName,
        description: body.description,
        templateName: body.templateName,
        documentBlobId: undefined,
        createdAt: now,
        lastModifiedAt: now,
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
