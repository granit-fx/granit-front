import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  getAuditEntriesByCorrelationId,
  getAuditLogEntry,
  listAuditLogEntries,
  listEntityAuditTrail,
} from '../api/audit-log-api';
import { AuditCategory } from '../types/index';

import type { AuditEntryDetail, AuditPage } from '../types/index';

const basePath = '/audit-log';

describe('audit-log-api', () => {
  describe('listAuditLogEntries', () => {
    it('should call GET with params', async () => {
      const client = createMockClient();
      const page: AuditPage = {
        items: [],
        totalCount: 0,
        hasMore: false,
        nextCursor: null,
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

      const params = { category: AuditCategory.DataMutation, page: 1, pageSize: 20 };
      const result = await listAuditLogEntries(client, basePath, params);

      expect(client.get).toHaveBeenCalledWith('/audit-log', { params });
      expect(result).toEqual(page);
    });

    it('should call GET without params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(
        axiosResponse({ items: [], totalCount: 0, hasMore: false, nextCursor: null })
      );

      await listAuditLogEntries(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/audit-log', { params: undefined });
    });
  });

  describe('getAuditLogEntry', () => {
    it('should call GET with encoded id', async () => {
      const client = createMockClient();
      const entry: AuditEntryDetail = {
        id: toEntityId<'AuditEntry'>('abc-123'),
        timestamp: toISODateString('2026-03-17T10:00:00Z'),
        userId: toEntityId<'User'>('user-1'),
        userName: 'admin',
        category: AuditCategory.DataMutation,
        ipAddress: '127.0.0.1',
        tenantId: null,
        correlationId: null,
        entityChanges: [],
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(entry));

      const result = await getAuditLogEntry(client, basePath, 'abc-123');

      expect(client.get).toHaveBeenCalledWith('/audit-log/abc-123');
      expect(result).toEqual(entry);
    });
  });

  describe('listEntityAuditTrail', () => {
    it('should call GET with encoded entity type and id', async () => {
      const client = createMockClient();
      const page: AuditPage = {
        items: [],
        totalCount: 0,
        hasMore: false,
        nextCursor: null,
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

      const result = await listEntityAuditTrail(client, basePath, 'Patient', '42', {
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

      await listEntityAuditTrail(client, basePath, 'Type/Sub', 'id with spaces');

      expect(client.get).toHaveBeenCalledWith('/audit-log/entity/Type%2FSub/id%20with%20spaces', {
        params: undefined,
      });
    });
  });

  describe('getAuditEntriesByCorrelationId', () => {
    it('should GET the correlation endpoint with an encoded id and return the array', async () => {
      const client = createMockClient();
      const details: AuditEntryDetail[] = [];
      vi.mocked(client.get).mockResolvedValue(axiosResponse(details));

      const result = await getAuditEntriesByCorrelationId(client, basePath, 'corr/42');

      expect(client.get).toHaveBeenCalledWith('/audit-log/correlation/corr%2F42');
      expect(result).toBe(details);
    });
  });
});
