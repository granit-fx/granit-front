import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  createAuthorization,
  listAuthorizations,
  revokeAuthorization,
  revokeUserAuthorizations,
} from '../api/admin-oidc-authorization-api';

import type {
  AdminOidcAuthorizationPage,
  AdminOidcAuthorizationResponse,
  AdminOidcCreateAuthorizationRequest,
} from '../types/index';

const BASE = '/admin';

const mockAuthorization: AdminOidcAuthorizationResponse = {
  id: 'auth-001',
  clientId: 'my-spa',
  subject: 'user-001',
  type: 'permanent',
  status: 'valid',
  scopes: ['openid', 'profile'],
};

const mockAuthorizationPage: AdminOidcAuthorizationPage = {
  items: [mockAuthorization],
  totalCount: 1,
  hasMore: false,
};

describe('admin-oidc-authorization-api', () => {
  // ── Create ────────────────────────────────────────────────────────────────

  describe('createAuthorization', () => {
    it('sends POST to /oidc/authorizations with request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: mockAuthorization });

      const request: AdminOidcCreateAuthorizationRequest = {
        subject: 'user-001',
        clientId: 'my-spa',
        scopes: ['openid', 'profile'],
      };
      const result = await createAuthorization(client, BASE, request);

      expect(client.post).toHaveBeenCalledWith(`${BASE}/oidc/authorizations`, request);
      expect(result).toEqual(mockAuthorization);
    });
  });

  // ── List ──────────────────────────────────────────────────────────────────

  describe('listAuthorizations', () => {
    it('sends GET to /oidc/authorizations with subject/client filters and paging', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockAuthorizationPage });

      const result = await listAuthorizations(client, BASE, {
        subject: 'user-001',
        clientId: 'my-spa',
        page: 2,
        pageSize: 50,
      });

      expect(client.get).toHaveBeenCalledWith(`${BASE}/oidc/authorizations`, {
        params: { subject: 'user-001', clientId: 'my-spa', page: 2, pageSize: 50 },
      });
      expect(result).toEqual(mockAuthorizationPage);
    });

    it('sends GET to /oidc/authorizations without params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockAuthorizationPage });

      const result = await listAuthorizations(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/oidc/authorizations`, {
        params: undefined,
      });
      expect(result.items).toEqual([mockAuthorization]);
      expect(result.totalCount).toBe(1);
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
