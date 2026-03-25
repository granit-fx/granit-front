import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  acceptAgreement,
  cancelDeletion,
  getAgreementDocuments,
  getAgreementHistory,
  getAgreementStatuses,
  getDeletionStatus,
  getExportStatus,
  listDeletions,
  listExports,
  requestDeletion,
  requestExport,
} from '../api/privacy-api.js';

import type {
  AgreementHistoryEntry,
  AgreementStatus,
  LegalDocument,
  PrivacyDeletionResponse,
  PrivacyExportStatusResponse,
} from '../types/index.js';

const BASE = '/api/v1/privacy';

describe('privacy-api', () => {
  // ── Data Export ──────────────────────────────────────────────────────────

  describe('requestExport', () => {
    it('sends POST to /export', async () => {
      const client = createMockClient();
      const response = { requestId: 'req-1', requestedAt: '2026-03-21T10:00:00Z' };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await requestExport(client, BASE);

      expect(client.post).toHaveBeenCalledWith(`${BASE}/export`);
      expect(result).toEqual(response);
    });
  });

  describe('getExportStatus', () => {
    it('sends GET to /export/{requestId}', async () => {
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

      expect(client.get).toHaveBeenCalledWith(`${BASE}/export/req-1`);
      expect(result).toEqual(response);
    });
  });

  describe('listExports', () => {
    it('sends GET to /export', async () => {
      const client = createMockClient();
      const response: PrivacyExportStatusResponse[] = [];
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await listExports(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/export`);
      expect(result).toEqual(response);
    });
  });

  // ── Data Deletion ───────────────────────────────────────────────────────

  describe('requestDeletion', () => {
    it('sends POST to /deletion with reason', async () => {
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

      expect(client.post).toHaveBeenCalledWith(`${BASE}/deletion`, {
        reason: 'User requested account deletion',
      });
      expect(result).toEqual(response);
    });

    it('sends POST to /deletion with defer flag', async () => {
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

      expect(client.post).toHaveBeenCalledWith(`${BASE}/deletion`, {
        reason: 'Closing account',
        defer: true,
      });
      expect(result).toEqual(response);
    });
  });

  describe('listDeletions', () => {
    it('sends GET to /deletion', async () => {
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

      expect(client.get).toHaveBeenCalledWith(`${BASE}/deletion`);
      expect(result).toEqual(response);
    });
  });

  describe('getDeletionStatus', () => {
    it('sends GET to /deletion/{requestId}', async () => {
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

      expect(client.get).toHaveBeenCalledWith(`${BASE}/deletion/del-1`);
      expect(result).toEqual(response);
    });
  });

  describe('cancelDeletion', () => {
    it('sends POST to /deletion/{requestId}/cancel', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await cancelDeletion(client, BASE, 'del-1');

      expect(client.post).toHaveBeenCalledWith(`${BASE}/deletion/del-1/cancel`);
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
});
