import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { createRole, deleteRole, getRoleMembers, listRoles } from '../api/admin-role-api.js';

import type { AdminRole, AdminRoleMember } from '../types/index.js';

const BASE = '/admin';

const mockRole: AdminRole = {
  name: 'editor',
  description: 'Content editor role',
};

const mockMember: AdminRoleMember = {
  userId: 'user-001',
  username: 'alice',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Doe',
};

describe('admin-role-api', () => {
  // ── List ──────────────────────────────────────────────────────────────────

  describe('listRoles', () => {
    it('sends GET to /roles', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: [mockRole] });

      const result = await listRoles(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/roles`);
      expect(result).toEqual([mockRole]);
    });
  });

  // ── Create ────────────────────────────────────────────────────────────────

  describe('createRole', () => {
    it('sends POST with request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: mockRole });

      const result = await createRole(client, BASE, {
        name: 'editor',
        description: 'Content editor role',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/roles`, {
        name: 'editor',
        description: 'Content editor role',
      });
      expect(result).toEqual(mockRole);
    });
  });

  // ── Delete ────────────────────────────────────────────────────────────────

  describe('deleteRole', () => {
    it('sends DELETE to /roles/{roleName}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await deleteRole(client, BASE, 'editor');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/roles/editor`);
    });

    it('encodes role name with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await deleteRole(client, BASE, 'role/slash');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/roles/role%2Fslash`);
    });
  });

  // ── Members ───────────────────────────────────────────────────────────────

  describe('getRoleMembers', () => {
    it('sends GET to /roles/{roleName}/members', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: [mockMember] });

      const result = await getRoleMembers(client, BASE, 'editor');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/roles/editor/members`);
      expect(result).toEqual([mockMember]);
    });

    it('encodes role name with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: [] });

      await getRoleMembers(client, BASE, 'role/slash');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/roles/role%2Fslash/members`);
    });
  });
});
