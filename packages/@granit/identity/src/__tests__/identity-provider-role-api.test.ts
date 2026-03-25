import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  assignRole,
  fetchRoleMembers,
  fetchRoles,
  fetchUserRoles,
  removeRole,
} from '../api/identity-provider-role-api.js';

import type { IdentityRole, IdentityUser } from '../types/index.js';

const sampleRole: IdentityRole = {
  id: 'role-1',
  name: 'admin',
  description: 'Administrator role',
};

const sampleUser: IdentityUser = {
  userId: 'user-1',
  username: 'jdoe',
  email: 'jdoe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  enabled: true,
  extraProperties: {},
};

const basePath = '/identity/provider';

describe('identity-provider-role-api', () => {
  describe('fetchRoles', () => {
    it('should GET {basePath}/roles', async () => {
      const client = createMockClient();
      const roles = [sampleRole];
      vi.mocked(client.get).mockResolvedValue(axiosResponse(roles));

      const result = await fetchRoles(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/roles`);
      expect(result).toEqual(roles);
    });
  });

  describe('fetchRoleMembers', () => {
    it('should GET {basePath}/roles/{roleName}/members', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleUser]));

      const result = await fetchRoleMembers(client, basePath, 'admin');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/roles/admin/members`);
      expect(result).toEqual([sampleUser]);
    });

    it('should encode roleName with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

      await fetchRoleMembers(client, basePath, 'role/special@name');

      expect(client.get).toHaveBeenCalledWith(
        `${basePath}/roles/${encodeURIComponent('role/special@name')}/members`
      );
    });
  });

  describe('fetchUserRoles', () => {
    it('should GET {basePath}/users/{userId}/roles', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleRole]));

      const result = await fetchUserRoles(client, basePath, 'user-1');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/users/user-1/roles`);
      expect(result).toEqual([sampleRole]);
    });
  });

  describe('assignRole', () => {
    it('should PUT {basePath}/users/{userId}/roles/{roleName}', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

      await assignRole(client, basePath, 'user-1', 'admin');

      expect(client.put).toHaveBeenCalledWith(`${basePath}/users/user-1/roles/admin`);
    });

    it('should encode userId and roleName with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

      await assignRole(client, basePath, 'user/special@id', 'role/special@name');

      expect(client.put).toHaveBeenCalledWith(
        `${basePath}/users/${encodeURIComponent('user/special@id')}/roles/${encodeURIComponent('role/special@name')}`
      );
    });
  });

  describe('removeRole', () => {
    it('should DELETE {basePath}/users/{userId}/roles/{roleName}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await removeRole(client, basePath, 'user-1', 'admin');

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/users/user-1/roles/admin`);
    });
  });
});
