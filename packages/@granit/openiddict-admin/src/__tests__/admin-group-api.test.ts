import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  addGroupMember,
  createGroup,
  deleteGroup,
  listGroups,
  removeGroupMember,
} from '../api/admin-group-api.js';

import type { AdminGroup } from '../types/index.js';

const BASE = '/admin';

const mockGroup: AdminGroup = {
  id: 'grp-001',
  name: 'Developers',
  description: null,
  tenantId: null,
};

describe('admin-group-api', () => {
  // ── List ──────────────────────────────────────────────────────────────────

  describe('listGroups', () => {
    it('sends GET to /groups', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: [mockGroup] });

      const result = await listGroups(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/groups`);
      expect(result).toEqual([mockGroup]);
    });
  });

  // ── Create ────────────────────────────────────────────────────────────────

  describe('createGroup', () => {
    it('sends POST with request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: mockGroup });

      const result = await createGroup(client, BASE, {
        name: 'editors',
        description: 'Content editors group',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/groups`, {
        name: 'editors',
        description: 'Content editors group',
      });
      expect(result).toEqual(mockGroup);
    });
  });

  // ── Delete ────────────────────────────────────────────────────────────────

  describe('deleteGroup', () => {
    it('sends DELETE to /groups/{groupId}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await deleteGroup(client, BASE, 'grp-001');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/groups/grp-001`);
    });

    it('encodes group ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await deleteGroup(client, BASE, 'id/slash');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/groups/id%2Fslash`);
    });
  });

  // ── Members ───────────────────────────────────────────────────────────────

  describe('addGroupMember', () => {
    it('sends POST to /groups/{groupId}/members with request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await addGroupMember(client, BASE, 'grp-001', { userId: 'user-001' });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/groups/grp-001/members`, {
        userId: 'user-001',
      });
    });

    it('encodes group ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await addGroupMember(client, BASE, 'id/slash', { userId: 'user-001' });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/groups/id%2Fslash/members`, {
        userId: 'user-001',
      });
    });
  });

  describe('removeGroupMember', () => {
    it('sends DELETE to /groups/{groupId}/members/{userId}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await removeGroupMember(client, BASE, 'grp-001', 'user-001');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/groups/grp-001/members/user-001`);
    });

    it('encodes both IDs with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await removeGroupMember(client, BASE, 'id/slash', 'user/slash');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/groups/id%2Fslash/members/user%2Fslash`);
    });
  });
});
