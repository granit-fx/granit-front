import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  createApplication,
  deleteApplication,
  listApplications,
  rotateApplicationSecret,
  updateApplication,
} from '../api/admin-oidc-application-api';

import type {
  AdminOidcApplicationPage,
  AdminOidcApplicationResponse,
  AdminOidcRotateSecretResponse,
} from '../types/index';

const BASE = '/admin';

const mockApplication: AdminOidcApplicationResponse = {
  clientId: 'my-spa',
  displayName: 'My SPA',
  type: 'public',
  tenantId: null,
  permissions: ['ept:token', 'gt:authorization_code'],
  redirectUris: ['https://example.com/callback'],
  postLogoutRedirectUris: ['https://example.com/signout-callback'],
  consentType: 'implicit',
  clientSide: 3,
  deviceKind: null,
  hasSigningKey: false,
};

const mockApplicationPage: AdminOidcApplicationPage = {
  items: [mockApplication],
  totalCount: 1,
  hasMore: false,
};

describe('admin-oidc-application-api', () => {
  // ── List ──────────────────────────────────────────────────────────────────

  describe('listApplications', () => {
    it('sends GET to /oidc/applications and returns the paged envelope', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockApplicationPage });

      const result = await listApplications(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/oidc/applications`, { params: undefined });
      expect(result.items).toEqual([mockApplication]);
      expect(result.totalCount).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('forwards page/pageSize', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockApplicationPage });

      await listApplications(client, BASE, { page: 2, pageSize: 100 });

      expect(client.get).toHaveBeenCalledWith(`${BASE}/oidc/applications`, {
        params: { page: 2, pageSize: 100 },
      });
    });
  });

  // ── Create ────────────────────────────────────────────────────────────────

  describe('createApplication', () => {
    it('sends POST with request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: mockApplication });

      const result = await createApplication(client, BASE, {
        clientId: 'my-spa',
        displayName: 'My SPA',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/oidc/applications`, {
        clientId: 'my-spa',
        displayName: 'My SPA',
      });
      expect(result).toEqual(mockApplication);
    });

    it('returns the one-shot generated secret when generateClientSecret is set', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({
        data: { ...mockApplication, generatedClientSecret: 's3cr3t' },
      });

      const result = await createApplication(client, BASE, {
        clientId: 'my-spa',
        generateClientSecret: true,
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/oidc/applications`, {
        clientId: 'my-spa',
        generateClientSecret: true,
      });
      expect(result.generatedClientSecret).toBe('s3cr3t');
    });

    it('omits generatedClientSecret when the server did not generate one', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: mockApplication });

      const result = await createApplication(client, BASE, { clientId: 'my-spa' });

      expect(result.generatedClientSecret).toBeUndefined();
    });
  });

  // ── Delete ────────────────────────────────────────────────────────────────

  describe('deleteApplication', () => {
    it('sends DELETE to /oidc/applications/{clientId}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await deleteApplication(client, BASE, 'my-spa');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/oidc/applications/my-spa`);
    });

    it('encodes client ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await deleteApplication(client, BASE, 'id/slash');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/oidc/applications/id%2Fslash`);
    });
  });

  // ── Update ────────────────────────────────────────────────────────────────

  describe('updateApplication', () => {
    it('sends PUT to /oidc/applications/{clientId} with request body', async () => {
      const client = createMockClient();
      const updated: AdminOidcApplicationResponse = {
        ...mockApplication,
        displayName: 'Updated SPA',
      };
      vi.mocked(client.put).mockResolvedValueOnce({ data: updated });

      const result = await updateApplication(client, BASE, 'my-spa', {
        displayName: 'Updated SPA',
      });

      expect(client.put).toHaveBeenCalledWith(`${BASE}/oidc/applications/my-spa`, {
        displayName: 'Updated SPA',
      });
      expect(result).toEqual(updated);
    });

    it('encodes client ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValueOnce({ data: mockApplication });

      await updateApplication(client, BASE, 'id/slash', { type: 'web' });

      expect(client.put).toHaveBeenCalledWith(`${BASE}/oidc/applications/id%2Fslash`, {
        type: 'web',
      });
    });
  });

  // ── Rotate secret ─────────────────────────────────────────────────────────

  describe('rotateApplicationSecret', () => {
    it('sends POST to /oidc/applications/{clientId}/rotate-secret', async () => {
      const client = createMockClient();
      const response: AdminOidcRotateSecretResponse = {
        clientId: 'my-spa',
        displayName: 'My SPA',
        newClientSecret: 'new-secret-value',
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await rotateApplicationSecret(client, BASE, 'my-spa');

      expect(client.post).toHaveBeenCalledWith(`${BASE}/oidc/applications/my-spa/rotate-secret`);
      expect(result).toEqual(response);
    });

    it('encodes client ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({
        data: { clientId: null, displayName: null, newClientSecret: 'secret' },
      });

      await rotateApplicationSecret(client, BASE, 'id/slash');

      expect(client.post).toHaveBeenCalledWith(
        `${BASE}/oidc/applications/id%2Fslash/rotate-secret`
      );
    });
  });
});
