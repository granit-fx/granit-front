import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { createScope, deleteScope, listScopes } from '../api/admin-oidc-scope-api.js';

import type { AdminOidcScope } from '../types/index.js';

const BASE = '/api/admin';

const mockScope: AdminOidcScope = {
  name: 'api',
  displayName: 'API Access',
  description: null,
};

describe('admin-oidc-scope-api', () => {
  // ── List ──────────────────────────────────────────────────────────────────

  describe('listScopes', () => {
    it('sends GET to /oidc/scopes', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: [mockScope] });

      const result = await listScopes(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/oidc/scopes`);
      expect(result).toEqual([mockScope]);
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
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/oidc/scopes`, {
        name: 'api',
        displayName: 'API Access',
        description: 'Grants API access',
      });
      expect(result).toEqual(mockScope);
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
