import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  acceptAgreement,
  cancelDeletion,
  createLegalDocument,
  getAgreementDocuments,
  getAgreementHistory,
  getAgreementStatuses,
  getDeletionStatus,
  getExportStatus,
  getLegalDocument,
  listDeletions,
  listExports,
  listLegalDocuments,
  publishLegalDocument,
  requestDeletion,
  requestExport,
  updateLegalDocument,
} from '../api/privacy-api';

import type {
  AgreementHistoryEntry,
  AgreementStatus,
  LegalDocument,
  LegalDocumentDetail,
  PrivacyDeletionResponse,
  PrivacyExportStatusResponse,
} from '../types/index';

const BASE = '/api/v1/privacy';

describe('privacy-api', () => {
  // ── Data Export ──────────────────────────────────────────────────────────

  describe('requestExport', () => {
    it('sends POST to /exports', async () => {
      const client = createMockClient();
      const response = { requestId: 'req-1', requestedAt: '2026-03-21T10:00:00Z' };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await requestExport(client, BASE);

      expect(client.post).toHaveBeenCalledWith(`${BASE}/exports`);
      expect(result).toEqual(response);
    });
  });

  describe('getExportStatus', () => {
    it('sends GET to /exports/{requestId}', async () => {
      const client = createMockClient();
      const response: PrivacyExportStatusResponse = {
        requestId: 'req-1',
        requestedAt: '2026-03-21T10:00:00Z',
        state: 'Completed',
        archiveBlobReferenceId: 'blob-123',
        completedAt: '2026-03-21T10:05:00Z',
        missingProviders: [],
      };
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await getExportStatus(client, BASE, 'req-1');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/exports/req-1`);
      expect(result).toEqual(response);
    });
  });

  describe('listExports', () => {
    it('sends GET to /exports', async () => {
      const client = createMockClient();
      const response: PrivacyExportStatusResponse[] = [];
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await listExports(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/exports`);
      expect(result).toEqual(response);
    });
  });

  // ── Data Deletion ───────────────────────────────────────────────────────

  describe('requestDeletion', () => {
    it('sends POST to /deletions with reason', async () => {
      const client = createMockClient();
      const response: PrivacyDeletionResponse = {
        requestId: 'del-1',
        status: 'Executed',
        reason: 'User requested account deletion',
        requestedAt: '2026-03-22T10:00:00Z',
        executedAt: '2026-03-22T10:00:01Z',
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await requestDeletion(client, BASE, {
        reason: 'User requested account deletion',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/deletions`, {
        reason: 'User requested account deletion',
      });
      expect(result).toEqual(response);
    });

    it('sends POST to /deletions with defer flag', async () => {
      const client = createMockClient();
      const response: PrivacyDeletionResponse = {
        requestId: 'del-2',
        status: 'Deferred',
        reason: 'Closing account',
        requestedAt: '2026-03-22T10:00:00Z',
        executedAt: null,
        scheduledDeletionAt: '2026-04-21T10:00:00Z',
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await requestDeletion(client, BASE, {
        reason: 'Closing account',
        defer: true,
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/deletions`, {
        reason: 'Closing account',
        defer: true,
      });
      expect(result).toEqual(response);
    });
  });

  describe('listDeletions', () => {
    it('sends GET to /deletions', async () => {
      const client = createMockClient();
      const response: PrivacyDeletionResponse[] = [
        {
          requestId: 'del-1',
          status: 'Deferred',
          reason: 'Closing account',
          requestedAt: '2026-03-22T10:00:00Z',
          executedAt: null,
          scheduledDeletionAt: '2026-04-21T10:00:00Z',
        },
      ];
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await listDeletions(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/deletions`);
      expect(result).toEqual(response);
    });
  });

  describe('getDeletionStatus', () => {
    it('sends GET to /deletions/{requestId}', async () => {
      const client = createMockClient();
      const response: PrivacyDeletionResponse = {
        requestId: 'del-1',
        status: 'Deferred',
        reason: 'Closing account',
        requestedAt: '2026-03-22T10:00:00Z',
        executedAt: null,
        scheduledDeletionAt: '2026-04-21T10:00:00Z',
      };
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await getDeletionStatus(client, BASE, 'del-1');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/deletions/del-1`);
      expect(result).toEqual(response);
    });
  });

  describe('cancelDeletion', () => {
    it('sends POST to /deletions/{requestId}/cancel', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await cancelDeletion(client, BASE, 'del-1');

      expect(client.post).toHaveBeenCalledWith(`${BASE}/deletions/del-1/cancel`);
    });
  });

  // ── Legal Agreements ────────────────────────────────────────────────────

  describe('getAgreementDocuments', () => {
    it('sends GET to /agreements/documents', async () => {
      const client = createMockClient();
      const response: LegalDocument[] = [
        { documentId: 'tos', currentVersion: '2.0', displayName: 'Terms of Service' },
      ];
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await getAgreementDocuments(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/agreements/documents`);
      expect(result).toEqual(response);
    });
  });

  describe('getAgreementStatuses', () => {
    it('sends GET to /agreements/status', async () => {
      const client = createMockClient();
      const response: AgreementStatus[] = [
        {
          documentId: 'tos',
          currentVersion: '2.0',
          hasAcceptedLatest: false,
          lastAcceptedAt: '2025-01-01T00:00:00Z',
        },
      ];
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await getAgreementStatuses(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/agreements/status`);
      expect(result).toEqual(response);
    });
  });

  describe('getAgreementHistory', () => {
    it('sends GET to /agreements/history', async () => {
      const client = createMockClient();
      const response: AgreementHistoryEntry[] = [
        {
          id: 'h-1',
          documentId: 'tos',
          version: '1.0',
          acceptedAt: '2024-06-01T00:00:00Z',
          isLatest: false,
        },
      ];
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await getAgreementHistory(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/agreements/history`);
      expect(result).toEqual(response);
    });
  });

  describe('acceptAgreement', () => {
    it('sends POST to /agreements/accept', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await acceptAgreement(client, BASE, { documentId: 'tos', version: '2.0' });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/agreements/accept`, {
        documentId: 'tos',
        version: '2.0',
      });
    });
  });

  // ── Legal Document Admin ─────────────────────────────────────────────────

  const mockDocument: LegalDocumentDetail = {
    id: 'ldv-001',
    documentId: 'privacy-policy',
    version: 1,
    lifecycleStatus: 'Draft',
    displayName: 'Privacy Policy',
    description: 'Initial draft',
    templateName: 'privacy-policy-template',
    createdAt: '2026-04-01T10:00:00Z',
    lastModifiedAt: '2026-04-01T10:00:00Z',
  };

  describe('createLegalDocument', () => {
    it('sends POST to /legal-documents with request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: mockDocument });

      const result = await createLegalDocument(client, BASE, {
        documentId: 'privacy-policy',
        displayName: 'Privacy Policy',
        description: 'Initial draft',
        templateName: 'privacy-policy-template',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/legal-documents`, {
        documentId: 'privacy-policy',
        displayName: 'Privacy Policy',
        description: 'Initial draft',
        templateName: 'privacy-policy-template',
      });
      expect(result).toEqual(mockDocument);
    });
  });

  describe('getLegalDocument', () => {
    it('sends GET to /legal-documents/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockDocument });

      const result = await getLegalDocument(client, BASE, 'ldv-001');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/legal-documents/ldv-001`);
      expect(result).toEqual(mockDocument);
    });

    it('encodes id with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockDocument });

      await getLegalDocument(client, BASE, 'id/slash');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/legal-documents/id%2Fslash`);
    });
  });

  describe('listLegalDocuments', () => {
    it('sends GET to /legal-documents with params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: [mockDocument] });

      const result = await listLegalDocuments(client, BASE, { documentId: 'privacy-policy' });

      expect(client.get).toHaveBeenCalledWith(`${BASE}/legal-documents`, {
        params: { documentId: 'privacy-policy' },
      });
      expect(result).toEqual([mockDocument]);
    });

    it('sends GET to /legal-documents without params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: [mockDocument] });

      const result = await listLegalDocuments(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/legal-documents`, {
        params: undefined,
      });
      expect(result).toEqual([mockDocument]);
    });
  });

  describe('updateLegalDocument', () => {
    it('sends PUT to /legal-documents/{id} with request body', async () => {
      const client = createMockClient();
      const updated = { ...mockDocument, displayName: 'Updated Policy' };
      vi.mocked(client.put).mockResolvedValueOnce({ data: updated });

      const result = await updateLegalDocument(client, BASE, 'ldv-001', {
        displayName: 'Updated Policy',
        description: 'Revised draft',
      });

      expect(client.put).toHaveBeenCalledWith(`${BASE}/legal-documents/ldv-001`, {
        displayName: 'Updated Policy',
        description: 'Revised draft',
      });
      expect(result).toEqual(updated);
    });

    it('encodes id with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValueOnce({ data: mockDocument });

      await updateLegalDocument(client, BASE, 'id/slash', {
        displayName: 'Test',
      });

      expect(client.put).toHaveBeenCalledWith(`${BASE}/legal-documents/id%2Fslash`, {
        displayName: 'Test',
      });
    });
  });

  describe('publishLegalDocument', () => {
    it('sends POST to /legal-documents/{id}/publish', async () => {
      const client = createMockClient();
      const published = { ...mockDocument, lifecycleStatus: 'Published' as const };
      vi.mocked(client.post).mockResolvedValueOnce({ data: published });

      const result = await publishLegalDocument(client, BASE, 'ldv-001');

      expect(client.post).toHaveBeenCalledWith(`${BASE}/legal-documents/ldv-001/publish`);
      expect(result).toEqual(published);
    });

    it('encodes id with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: mockDocument });

      await publishLegalDocument(client, BASE, 'id/slash');

      expect(client.post).toHaveBeenCalledWith(`${BASE}/legal-documents/id%2Fslash/publish`);
    });
  });
});
