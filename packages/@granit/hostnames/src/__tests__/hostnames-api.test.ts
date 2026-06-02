import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  checkAvailability,
  createHostname,
  deleteHostname,
  getHostname,
  listHostnames,
  reportCertificateStatus,
  updateHostname,
  verifyNow,
} from '../api/hostnames-api';
import { CertificateStatus, ManagedHostnameStatus } from '../types/index';

import type {
  CheckAvailabilityResponse,
  ManagedHostnameResponse,
  PagedResponse,
} from '../types/index';

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
  updatedAt: '2026-06-01T10:00:00Z',
  concurrencyStamp: 'stamp-abc',
};

describe('hostnames-api', () => {
  describe('listHostnames', () => {
    it('sends GET to basePath without params', async () => {
      const client = createMockClient();
      const response: PagedResponse<ManagedHostnameResponse> = {
        items: [mockHostname],
        totalCount: 1,
        page: 0,
        pageSize: 20,
      };
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await listHostnames(client, BASE);

      expect(client.get).toHaveBeenCalledWith(BASE, { params: undefined });
      expect(result).toEqual(response);
    });

    it('passes pagination and filter params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({
        data: { items: [], totalCount: 0, page: 1, pageSize: 10 },
      });

      await listHostnames(client, BASE, { page: 1, pageSize: 10, ownerType: 'cms.site' });

      expect(client.get).toHaveBeenCalledWith(BASE, {
        params: { page: 1, pageSize: 10, ownerType: 'cms.site' },
      });
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

      const request = { host: 'app.example.com', ownerType: 'cms.site', ownerId: 'owner-1', isPrimary: true };
      const result = await createHostname(client, BASE, request);

      expect(client.post).toHaveBeenCalledWith(BASE, request);
      expect(result).toEqual(mockHostname);
    });
  });

  describe('updateHostname', () => {
    it('sends PATCH to /{id} with isPrimary', async () => {
      const client = createMockClient();
      const updated = { ...mockHostname, isPrimary: false };
      vi.mocked(client.patch).mockResolvedValueOnce({ data: updated });

      const result = await updateHostname(client, BASE, mockHostname.id, { isPrimary: false });

      expect(client.patch).toHaveBeenCalledWith(`${BASE}/${mockHostname.id}`, { isPrimary: false });
      expect(result).toEqual(updated);
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
    it('sends GET to /check-availability with host param', async () => {
      const client = createMockClient();
      const response: CheckAvailabilityResponse = { isAvailable: true };
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await checkAvailability(client, BASE, 'new.example.com');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/check-availability`, {
        params: { host: 'new.example.com' },
      });
      expect(result).toEqual(response);
    });

    it('returns isAvailable false for taken hostnames', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: { isAvailable: false } });

      const result = await checkAvailability(client, BASE, 'taken.example.com');

      expect(result.isAvailable).toBe(false);
    });
  });

  describe('verifyNow', () => {
    it('sends POST to /{id}/verify-now', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await verifyNow(client, BASE, mockHostname.id);

      expect(client.post).toHaveBeenCalledWith(`${BASE}/${mockHostname.id}/verify-now`);
    });
  });

  describe('reportCertificateStatus', () => {
    it('sends POST to /{id}/certificate-status with body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await reportCertificateStatus(client, BASE, mockHostname.id, {
        status: CertificateStatus.Secured,
        certExpiresAt: '2027-06-01T10:00:00Z',
        errorDetails: null,
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/${mockHostname.id}/certificate-status`, {
        status: CertificateStatus.Secured,
        certExpiresAt: '2027-06-01T10:00:00Z',
        errorDetails: null,
      });
    });
  });
});
