import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { createScope, deleteScope, listScopes, updateScope } from '../api/admin-oidc-scope-api';

import type { AdminOidcScopePage, AdminOidcScopeResponse } from '../types/index';

const BASE = '/admin';

const mockScope: AdminOidcScopeResponse = {
  name: 'api',
  displayName: 'API Access',
  description: null,
  resources: ['api://my-api'],
  tenantId: null,
};

const mockScopePage: AdminOidcScopePage = {
  items: [mockScope],
  totalCount: 1,
  hasMore: false,
};

describe('admin-oidc-scope-api', () => {
  // ── List ──────────────────────────────────────────────────────────────────

  describe('listScopes', () => {
    it('sends GET to /oidc/scopes and returns the paged envelope', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockScopePage });

      const result = await listScopes(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/oidc/scopes`, { params: undefined });
      expect(result.items).toEqual([mockScope]);
      expect(result.totalCount).toBe(1);
    });

    it('forwards page/pageSize', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockScopePage });

      await listScopes(client, BASE, { page: 3, pageSize: 10 });

      expect(client.get).toHaveBeenCalledWith(`${BASE}/oidc/scopes`, {
        params: { page: 3, pageSize: 10 },
      });
    });
  });

  // ── Create ────────────────────────────────────────────────────────────────

  describe('createScope', () => {
    it('sends POST with request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: mockScope });

      const result = await createScope(client, BASE, {
        name: 'api',
        displayName: 'API Access',
        description: 'Grants API access',
        resources: ['api://my-api'],
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/oidc/scopes`, {
        name: 'api',
        displayName: 'API Access',
        description: 'Grants API access',
        resources: ['api://my-api'],
      });
      expect(result).toEqual(mockScope);
    });
  });

  // ── Update ────────────────────────────────────────────────────────────────

  describe('updateScope', () => {
    it('sends PUT to /oidc/scopes/{scopeName} with request body', async () => {
      const client = createMockClient();
      const updated: AdminOidcScopeResponse = { ...mockScope, displayName: 'Updated API Access' };
      vi.mocked(client.put).mockResolvedValueOnce({ data: updated });

      const result = await updateScope(client, BASE, 'api', {
        displayName: 'Updated API Access',
      });

      expect(client.put).toHaveBeenCalledWith(`${BASE}/oidc/scopes/api`, {
        displayName: 'Updated API Access',
      });
      expect(result).toEqual(updated);
    });

    it('encodes scope name with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValueOnce({ data: mockScope });

      await updateScope(client, BASE, 'scope/slash', { resources: [] });

      expect(client.put).toHaveBeenCalledWith(`${BASE}/oidc/scopes/scope%2Fslash`, {
        resources: [],
      });
    });
  });

  // ── Delete ────────────────────────────────────────────────────────────────

  describe('deleteScope', () => {
    it('sends DELETE to /oidc/scopes/{scopeName}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await deleteScope(client, BASE, 'api');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/oidc/scopes/api`);
    });

    it('encodes scope name with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await deleteScope(client, BASE, 'scope/slash');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/oidc/scopes/scope%2Fslash`);
    });
  });
});
