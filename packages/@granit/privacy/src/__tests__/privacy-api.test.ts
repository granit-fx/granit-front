import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  acceptAgreement,
  cancelDeletion,
  createLegalDocument,
  downloadExport,
  downloadExportManifest,
  downloadExportShard,
  getAgreementStatuses,
  getApplicableRegulation,
  getDeletionStatus,
  getExportStatus,
  getLegalDocument,
  getOptOutStatus,
  listAgreementDocuments,
  listAgreementHistory,
  listDeletions,
  listExportScopes,
  listExports,
  listLegalDocuments,
  listProcessingPurposes,
  publishLegalDocument,
  requestDeletion,
  requestExport,
  requestExportOnBehalfOf,
  requestOptOut,
  updateLegalDocument,
} from '../api/privacy-api';

import type {
  LegalDocumentDetailResponse,
  PrivacyConsentStatusResponse,
  PrivacyDeletionRequestResponse,
  PrivacyDeletionStatusResponse,
  PrivacyExportScopeResponse,
  PrivacyExportStatusResponse,
  PrivacyLegalDocumentResponse,
  PrivacyUserAgreementResponse,
} from '../types/index';

const BASE = '/api/v1/privacy';

describe('privacy-api', () => {
  // ── Data Export ──────────────────────────────────────────────────────────

  describe('requestExport', () => {
    it('sends POST to /exports without body when no request given', async () => {
      const client = createMockClient();
      const response = { requestId: 'req-1', requestedAt: '2026-03-21T10:00:00Z' };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await requestExport(client, BASE);

      expect(client.post).toHaveBeenCalledWith(`${BASE}/exports`, undefined);
      expect(result).toEqual(response);
    });

    it('sends POST to /exports with scopes when request given', async () => {
      const client = createMockClient();
      const response = { requestId: 'req-2', requestedAt: '2026-03-21T10:01:00Z' };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await requestExport(client, BASE, { scopes: ['Granit.Auditing'] });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/exports`, { scopes: ['Granit.Auditing'] });
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
      const response: PrivacyDeletionRequestResponse = {
        requestId: 'del-1',
        scheduledDeletionAt: '2026-03-22T10:00:01Z',
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
      const response: PrivacyDeletionRequestResponse = {
        requestId: 'del-2',
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
      const response: PrivacyDeletionStatusResponse[] = [
        {
          requestId: 'del-1',
          state: 'Deferred',
          reason: 'Closing account',
          requestedAt: '2026-03-22T10:00:00Z',
          executedAt: null,
          scheduledDeletionAt: '2026-04-21T10:00:00Z',
          cancelledAt: null,
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
      const response: PrivacyDeletionStatusResponse = {
        requestId: 'del-1',
        state: 'Deferred',
        reason: 'Closing account',
        requestedAt: '2026-03-22T10:00:00Z',
        executedAt: null,
        scheduledDeletionAt: '2026-04-21T10:00:00Z',
        cancelledAt: null,
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

  describe('listAgreementDocuments', () => {
    it('sends GET to /agreements/documents', async () => {
      const client = createMockClient();
      const response: PrivacyLegalDocumentResponse[] = [
        { documentId: 'tos', currentVersion: '2.0', displayName: 'Terms of Service' },
      ];
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await listAgreementDocuments(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/agreements/documents`);
      expect(result).toEqual(response);
    });
  });

  describe('getAgreementStatuses', () => {
    it('sends GET to /agreements/status', async () => {
      const client = createMockClient();
      const response: PrivacyConsentStatusResponse[] = [
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

  describe('listAgreementHistory', () => {
    it('sends GET to /agreements/history', async () => {
      const client = createMockClient();
      const response: PrivacyUserAgreementResponse[] = [
        {
          id: 'h-1',
          documentId: 'tos',
          version: '1.0',
          acceptedAt: '2024-06-01T00:00:00Z',
          isLatest: false,
        },
      ];
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await listAgreementHistory(client, BASE);

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

  const mockDocument: LegalDocumentDetailResponse = {
    id: 'ldv-001',
    documentId: 'privacy-policy',
    version: 1,
    lifecycleStatus: 'Draft',
    displayName: 'Privacy Policy',
    description: 'Initial draft',
    templateName: 'privacy-policy-template',
    documentBlobId: null,
    createdAt: '2026-04-01T10:00:00Z',
    lastModifiedAt: '2026-04-01T10:00:00Z',
    concurrencyStamp: 'stamp-ldv-001',
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
        concurrencyStamp: 'stamp-ldv-001',
        description: 'Revised draft',
      });

      expect(client.put).toHaveBeenCalledWith(`${BASE}/legal-documents/ldv-001`, {
        displayName: 'Updated Policy',
        concurrencyStamp: 'stamp-ldv-001',
        description: 'Revised draft',
      });
      expect(result).toEqual(updated);
    });

    it('encodes id with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValueOnce({ data: mockDocument });

      await updateLegalDocument(client, BASE, 'id/slash', {
        displayName: 'Test',
        concurrencyStamp: 'stamp',
      });

      expect(client.put).toHaveBeenCalledWith(`${BASE}/legal-documents/id%2Fslash`, {
        displayName: 'Test',
        concurrencyStamp: 'stamp',
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

  // ── Regulation Profile ─────────────────────────────────────────────────────

  describe('getApplicableRegulation', () => {
    it('sends GET to /regulation', async () => {
      const client = createMockClient();
      const response = {
        regulation: 'GDPR',
        displayName: 'General Data Protection Regulation',
        jurisdictionCode: 'EU',
        consentModel: 'OptIn',
        availableLegalBases: ['Consent', 'LegitimateInterest'],
        subjectAccessRequestDays: 30,
        subjectAccessRequestExtensionDays: null,
        deletionRequestDays: null,
        defaultDeletionGracePeriodDays: 30,
        maxDeletionGracePeriodDays: 90,
        breachNotifyAuthorityHours: 72,
        breachNotifyIndividualsHours: null,
        minimumConsentAge: 16,
        requiresParentalIdentityVerification: false,
        cookieConsentModel: 'OptIn',
        honorGlobalPrivacyControl: true,
        requiresCrossBorderAssessment: true,
        transferMechanisms: ['SCCs'],
        dataLocalizationRequired: false,
        requiresDpoOrRepresentative: true,
        requiredExportFormats: ['JSON'],
      };
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await getApplicableRegulation(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/regulation`);
      expect(result).toEqual(response);
    });
  });

  // ── Processing Purposes ────────────────────────────────────────────────────

  describe('listProcessingPurposes', () => {
    it('sends GET to /purposes', async () => {
      const client = createMockClient();
      const response = [
        {
          purposeId: 'analytics',
          displayName: 'Analytics',
          description: 'Usage analytics',
          legalBasis: 'Consent',
          requiresExplicitConsent: true,
          dataCategory: null,
        },
      ];
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await listProcessingPurposes(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/purposes`);
      expect(result).toEqual(response);
    });
  });

  // ── Opt-Out (CCPA) ─────────────────────────────────────────────────────────

  describe('requestOptOut', () => {
    it('sends POST to /opt-out', async () => {
      const client = createMockClient();
      const response = { isOptedOut: true, optedOutAt: '2026-06-07T10:00:00Z', regulation: 'CCPA' };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await requestOptOut(client, BASE);

      expect(client.post).toHaveBeenCalledWith(`${BASE}/opt-out`);
      expect(result).toEqual(response);
    });
  });

  describe('getOptOutStatus', () => {
    it('sends GET to /opt-out/status', async () => {
      const client = createMockClient();
      const response = { isOptedOut: false, optedOutAt: null, regulation: null };
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await getOptOutStatus(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/opt-out/status`);
      expect(result).toEqual(response);
    });
  });

  // ── Export Scopes ──────────────────────────────────────────────────────────

  describe('listExportScopes', () => {
    it('sends GET to /exports/scopes', async () => {
      const client = createMockClient();
      const response: PrivacyExportScopeResponse[] = [
        {
          providerName: 'Granit.Auditing',
          displayKey: 'privacy.export.scope.auditing',
          featureName: null,
          defaultSelected: true,
          estimatedSizeBytes: null,
        },
      ];
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await listExportScopes(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/exports/scopes`);
      expect(result).toEqual(response);
    });
  });

  // ── Export On Behalf Of ────────────────────────────────────────────────────

  describe('requestExportOnBehalfOf', () => {
    it('sends POST to /exports/on-behalf-of with subject user id', async () => {
      const client = createMockClient();
      const response = { requestId: 'req-obo-1', requestedAt: '2026-06-07T10:00:00Z' };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await requestExportOnBehalfOf(client, BASE, {
        subjectUserId: 'user-uuid-123',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/exports/on-behalf-of`, {
        subjectUserId: 'user-uuid-123',
      });
      expect(result).toEqual(response);
    });

    it('sends POST with scopes when provided', async () => {
      const client = createMockClient();
      const response = { requestId: 'req-obo-2', requestedAt: '2026-06-07T10:01:00Z' };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await requestExportOnBehalfOf(client, BASE, {
        subjectUserId: 'user-uuid-456',
        scopes: ['Granit.Auditing'],
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/exports/on-behalf-of`, {
        subjectUserId: 'user-uuid-456',
        scopes: ['Granit.Auditing'],
      });
      expect(result).toEqual(response);
    });
  });

  // ── Export Downloads ───────────────────────────────────────────────────────

  describe('downloadExport', () => {
    it('sends GET to /exports/{requestId}/download as stream', async () => {
      const client = createMockClient();
      const mockStream = {} as ReadableStream;
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockStream });

      const result = await downloadExport(client, BASE, 'req-1');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/exports/req-1/download`, {
        adapter: 'fetch',
        responseType: 'stream',
      });
      expect(result).toBe(mockStream);
    });

    it('encodes requestId with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: {} as ReadableStream });

      await downloadExport(client, BASE, 'req/slash');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/exports/req%2Fslash/download`, {
        adapter: 'fetch',
        responseType: 'stream',
      });
    });
  });

  describe('downloadExportManifest', () => {
    it('sends GET to /exports/{requestId}/download/manifest as stream', async () => {
      const client = createMockClient();
      const mockStream = {} as ReadableStream;
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockStream });

      const result = await downloadExportManifest(client, BASE, 'req-1');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/exports/req-1/download/manifest`, {
        adapter: 'fetch',
        responseType: 'stream',
      });
      expect(result).toBe(mockStream);
    });
  });

  describe('downloadExportShard', () => {
    it('sends GET to /exports/{requestId}/download/{shardIndex} as stream', async () => {
      const client = createMockClient();
      const mockStream = {} as ReadableStream;
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockStream });

      const result = await downloadExportShard(client, BASE, 'req-1', 0);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/exports/req-1/download/0`, {
        adapter: 'fetch',
        responseType: 'stream',
      });
      expect(result).toBe(mockStream);
    });

    it('sends correct shard index', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: {} as ReadableStream });

      await downloadExportShard(client, BASE, 'req-1', 2);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/exports/req-1/download/2`, {
        adapter: 'fetch',
        responseType: 'stream',
      });
    });
  });
});
