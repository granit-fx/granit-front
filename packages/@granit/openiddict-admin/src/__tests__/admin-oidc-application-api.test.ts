import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  createApplication,
  deleteApplication,
  listApplications,
  rotateApplicationSecret,
} from '../api/admin-oidc-application-api.js';

import type { AdminOidcApplication, AdminOidcApplicationSecretResponse } from '../types/index.js';

const BASE = '/api/admin';

const mockApplication: AdminOidcApplication = {
  clientId: 'my-spa',
  displayName: 'My SPA',
  type: 'public',
  tenantId: null,
};

describe('admin-oidc-application-api', () => {
  // ── List ──────────────────────────────────────────────────────────────────

  describe('listApplications', () => {
    it('sends GET to /oidc/applications', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: [mockApplication] });

      const result = await listApplications(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/oidc/applications`);
      expect(result).toEqual([mockApplication]);
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

  // ── Rotate secret ─────────────────────────────────────────────────────────

  describe('rotateApplicationSecret', () => {
    it('sends POST to /oidc/applications/{clientId}/rotate-secret', async () => {
      const client = createMockClient();
      const response: AdminOidcApplicationSecretResponse = {
        clientId: 'my-spa',
        newSecret: 'new-secret-value',
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await rotateApplicationSecret(client, BASE, 'my-spa');

      expect(client.post).toHaveBeenCalledWith(`${BASE}/oidc/applications/my-spa/rotate-secret`);
      expect(result).toEqual(response);
    });

    it('encodes client ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({
        data: { newSecret: 'secret' },
      });

      await rotateApplicationSecret(client, BASE, 'id/slash');

      expect(client.post).toHaveBeenCalledWith(
        `${BASE}/oidc/applications/id%2Fslash/rotate-secret`
      );
    });
  });
});
