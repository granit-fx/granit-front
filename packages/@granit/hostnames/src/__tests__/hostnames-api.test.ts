import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  checkAvailability,
  clearPrimary,
  createHostname,
  deleteHostname,
  getHostname,
  listHostnames,
  reportCertificateStatus,
  setPrimary,
  verifyNow,
} from '../api/hostnames-api';
import { CertificateStatus, ManagedHostnameStatus } from '../types/index';

import type { CheckAvailabilityResponse, ManagedHostnameResponse } from '../types/index';

const BASE = '/api/hostnames';

const mockHostname: ManagedHostnameResponse = {
  id: '11111111-0001-4000-a000-000000000001',
  host: 'app.example.com',
  ownerType: 'cms.site',
  ownerId: '22222222-0002-4000-a000-000000000002',
  tenantId: '33333333-0003-4000-a000-000000000003',
  isPrimary: true,
  status: ManagedHostnameStatus.Active,
  verificationToken: null,
  expectedDnsRecords: [],
  lastCheckedAt: '2026-06-01T10:00:00Z',
  conflicts: [],
  failedCheckCount: 0,
  nextCheckAt: '2026-06-02T10:00:00Z',
  certificateStatus: CertificateStatus.Secured,
  certExpiresAt: '2027-06-01T10:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'user@example.com',
  modifiedAt: '2026-06-01T10:00:00Z',
  modifiedBy: 'user@example.com',
  concurrencyStamp: 'stamp-abc',
};

describe('hostnames-api', () => {
  describe('listHostnames', () => {
    it('sends GET to basePath with required owner params', async () => {
      const client = createMockClient();
      const response: readonly ManagedHostnameResponse[] = [mockHostname];
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const params = { ownerType: 'cms.site', ownerId: 'owner-1' };
      const result = await listHostnames(client, BASE, params);

      expect(client.get).toHaveBeenCalledWith(BASE, { params });
      expect(result).toEqual(response);
    });

    it('passes maxResults param', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: [] });

      const params = { ownerType: 'cms.site', ownerId: 'owner-1', maxResults: 50 };
      await listHostnames(client, BASE, params);

      expect(client.get).toHaveBeenCalledWith(BASE, { params });
    });
  });

  describe('getHostname', () => {
    it('sends GET to /{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockHostname });

      const result = await getHostname(client, BASE, mockHostname.id);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/${mockHostname.id}`);
      expect(result).toEqual(mockHostname);
    });

    it('encodes IDs with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockHostname });

      await getHostname(client, BASE, 'id/with/slashes');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/id%2Fwith%2Fslashes`);
    });
  });

  describe('createHostname', () => {
    it('sends POST to basePath with request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: mockHostname });

      const request = {
        host: 'app.example.com',
        ownerType: 'cms.site',
        ownerId: 'owner-1',
        isPrimary: true,
      };
      const result = await createHostname(client, BASE, request);

      expect(client.post).toHaveBeenCalledWith(BASE, request);
      expect(result).toEqual(mockHostname);
    });
  });

  describe('setPrimary', () => {
    it('sends POST to /{id}/primary', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await setPrimary(client, BASE, mockHostname.id);

      expect(client.post).toHaveBeenCalledWith(`${BASE}/${mockHostname.id}/primary`);
    });
  });

  describe('clearPrimary', () => {
    it('sends DELETE to /{id}/primary', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await clearPrimary(client, BASE, mockHostname.id);

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/${mockHostname.id}/primary`);
    });
  });

  describe('deleteHostname', () => {
    it('sends DELETE to /{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await deleteHostname(client, BASE, mockHostname.id);

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/${mockHostname.id}`);
    });
  });

  describe('checkAvailability', () => {
    it('sends GET to /availability with host param', async () => {
      const client = createMockClient();
      const response: CheckAvailabilityResponse = { host: 'new.example.com', isAvailable: true };
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await checkAvailability(client, BASE, 'new.example.com');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/availability`, {
        params: { host: 'new.example.com' },
      });
      expect(result).toEqual(response);
    });

    it('returns isAvailable false for taken hostnames', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({
        data: { host: 'taken.example.com', isAvailable: false },
      });

      const result = await checkAvailability(client, BASE, 'taken.example.com');

      expect(result.isAvailable).toBe(false);
    });
  });

  describe('verifyNow', () => {
    it('sends POST to /{id}/verify-now and returns the updated hostname', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: mockHostname });

      const result = await verifyNow(client, BASE, mockHostname.id);

      expect(client.post).toHaveBeenCalledWith(`${BASE}/${mockHostname.id}/verify-now`);
      expect(result).toEqual(mockHostname);
    });
  });

  describe('reportCertificateStatus', () => {
    it('sends POST to /{id}/certificate-status with body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await reportCertificateStatus(client, BASE, mockHostname.id, {
        status: CertificateStatus.Secured,
        expiresAt: '2027-06-01T10:00:00Z',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/${mockHostname.id}/certificate-status`, {
        status: CertificateStatus.Secured,
        expiresAt: '2027-06-01T10:00:00Z',
      });
    });
  });
});
