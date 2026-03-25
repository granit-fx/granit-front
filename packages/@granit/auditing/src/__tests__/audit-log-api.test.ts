import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  fetchAuditLogEntries,
  fetchAuditLogEntry,
  fetchEntityAuditTrail,
} from '../api/audit-log-api.js';
import { AuditLogCategory } from '../types/index.js';

import type { AuditLogEntryDetail, AuditLogPage } from '../types/index.js';

const basePath = '/audit-log';

describe('audit-log-api', () => {
  describe('fetchAuditLogEntries', () => {
    it('should call GET with params', async () => {
      const client = createMockClient();
      const page: AuditLogPage = {
        items: [],
        totalCount: 0,
        hasMore: false,
        nextCursor: null,
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

      const params = { category: AuditLogCategory.DataMutation, page: 1, pageSize: 20 };
      const result = await fetchAuditLogEntries(client, basePath, params);

      expect(client.get).toHaveBeenCalledWith('/audit-log', { params });
      expect(result).toEqual(page);
    });

    it('should call GET without params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(
        axiosResponse({ items: [], totalCount: 0, hasMore: false, nextCursor: null })
      );

      await fetchAuditLogEntries(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/audit-log', { params: undefined });
    });
  });

  describe('fetchAuditLogEntry', () => {
    it('should call GET with encoded id', async () => {
      const client = createMockClient();
      const entry: AuditLogEntryDetail = {
        id: 'abc-123',
        timestamp: '2026-03-17T10:00:00Z',
        userId: 'user-1',
        userName: 'admin',
        category: AuditLogCategory.DataMutation,
        ipAddress: '127.0.0.1',
        tenantId: null,
        correlationId: null,
        entityChanges: [],
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(entry));

      const result = await fetchAuditLogEntry(client, basePath, 'abc-123');

      expect(client.get).toHaveBeenCalledWith('/audit-log/abc-123');
      expect(result).toEqual(entry);
    });
  });

  describe('fetchEntityAuditTrail', () => {
    it('should call GET with encoded entity type and id', async () => {
      const client = createMockClient();
      const page: AuditLogPage = {
        items: [],
        totalCount: 0,
        hasMore: false,
        nextCursor: null,
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

      const result = await fetchEntityAuditTrail(client, basePath, 'Patient', '42', {
        page: 1,
        pageSize: 10,
      });

      expect(client.get).toHaveBeenCalledWith('/audit-log/entity/Patient/42', {
        params: { page: 1, pageSize: 10 },
      });
      expect(result).toEqual(page);
    });

    it('should encode special characters in entity type and id', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(
        axiosResponse({ items: [], totalCount: 0, hasMore: false, nextCursor: null })
      );

      await fetchEntityAuditTrail(client, basePath, 'Type/Sub', 'id with spaces');

      expect(client.get).toHaveBeenCalledWith('/audit-log/entity/Type%2FSub/id%20with%20spaces', {
        params: undefined,
      });
    });
  });
});
