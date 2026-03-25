import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  createUser,
  deleteUser,
  getUser,
  impersonateUser,
  listUsers,
} from '../api/admin-user-api.js';

import type { AdminImpersonationResult, AdminUser, AdminUserPage } from '../types/index.js';

const BASE = '/api/admin';

const mockUser: AdminUser = {
  userId: 'user-001',
  username: 'alice',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Doe',
  enabled: true,
  extraProperties: {},
};

const mockUserPage: AdminUserPage = {
  items: [mockUser],
  totalCount: 1,
};

describe('admin-user-api', () => {
  // ── List ──────────────────────────────────────────────────────────────────

  describe('listUsers', () => {
    it('sends GET to /users with params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockUserPage });

      const result = await listUsers(client, BASE, { search: 'alice', page: 1, pageSize: 10 });

      expect(client.get).toHaveBeenCalledWith(`${BASE}/users`, {
        params: { search: 'alice', page: 1, pageSize: 10 },
      });
      expect(result).toEqual(mockUserPage);
    });

    it('sends GET to /users without params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockUserPage });

      const result = await listUsers(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/users`, { params: undefined });
      expect(result).toEqual(mockUserPage);
    });
  });

  // ── Get ───────────────────────────────────────────────────────────────────

  describe('getUser', () => {
    it('sends GET to /users/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockUser });

      const result = await getUser(client, BASE, 'user-001');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/users/user-001`);
      expect(result).toEqual(mockUser);
    });

    it('encodes user ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockUser });

      await getUser(client, BASE, 'id/slash');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/users/id%2Fslash`);
    });
  });

  // ── Create ────────────────────────────────────────────────────────────────

  describe('createUser', () => {
    it('sends POST with request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: mockUser });

      const result = await createUser(client, BASE, {
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Doe',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/users`, {
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Doe',
      });
      expect(result).toEqual(mockUser);
    });
  });

  // ── Delete ────────────────────────────────────────────────────────────────

  describe('deleteUser', () => {
    it('sends DELETE to /users/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await deleteUser(client, BASE, 'user-001');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/users/user-001`);
    });

    it('encodes user ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await deleteUser(client, BASE, 'id/slash');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/users/id%2Fslash`);
    });
  });

  // ── Impersonate ───────────────────────────────────────────────────────────

  describe('impersonateUser', () => {
    it('sends POST to /users/{id}/impersonate', async () => {
      const client = createMockClient();
      const response: AdminImpersonationResult = {
        accessToken: 'eyJ...',
        refreshToken: 'ref...',
        expiresIn: 3600,
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await impersonateUser(client, BASE, 'user-001');

      expect(client.post).toHaveBeenCalledWith(`${BASE}/users/user-001/impersonate`);
      expect(result).toEqual(response);
    });

    it('encodes user ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({
        data: { accessToken: 'x', refreshToken: 'y', expiresIn: 60 },
      });

      await impersonateUser(client, BASE, 'id/slash');

      expect(client.post).toHaveBeenCalledWith(`${BASE}/users/id%2Fslash/impersonate`);
    });
  });
});
