import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  listAuthorizations,
  revokeAuthorization,
  revokeUserAuthorizations,
} from '../api/admin-oidc-authorization-api.js';

import type { AdminOidcAuthorization } from '../types/index.js';

const BASE = '/admin';

const mockAuthorization: AdminOidcAuthorization = {
  id: 'auth-001',
  clientId: 'my-spa',
  subject: 'user-001',
  type: 'permanent',
  status: 'valid',
};

const mockAuthorizations: readonly AdminOidcAuthorization[] = [mockAuthorization];

describe('admin-oidc-authorization-api', () => {
  // ── List ──────────────────────────────────────────────────────────────────

  describe('listAuthorizations', () => {
    it('sends GET to /oidc/authorizations with params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockAuthorizations });

      const result = await listAuthorizations(client, BASE, {
        userId: 'user-001',
      });

      expect(client.get).toHaveBeenCalledWith(`${BASE}/oidc/authorizations`, {
        params: { userId: 'user-001' },
      });
      expect(result).toEqual(mockAuthorizations);
    });

    it('sends GET to /oidc/authorizations without params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockAuthorizations });

      const result = await listAuthorizations(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/oidc/authorizations`, {
        params: undefined,
      });
      expect(result).toEqual(mockAuthorizations);
    });
  });

  // ── Revoke ────────────────────────────────────────────────────────────────

  describe('revokeAuthorization', () => {
    it('sends DELETE to /oidc/authorizations/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await revokeAuthorization(client, BASE, 'auth-001');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/oidc/authorizations/auth-001`);
    });

    it('encodes authorization ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await revokeAuthorization(client, BASE, 'id/slash');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/oidc/authorizations/id%2Fslash`);
    });
  });

  // ── Revoke user authorizations ──────────────────────────────────────────

  describe('revokeUserAuthorizations', () => {
    it('sends DELETE to /oidc/authorizations/user/{userId}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await revokeUserAuthorizations(client, BASE, 'user-001');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/oidc/authorizations/user/user-001`);
    });

    it('encodes user ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await revokeUserAuthorizations(client, BASE, 'id/slash');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/oidc/authorizations/user/id%2Fslash`);
    });
  });
});
