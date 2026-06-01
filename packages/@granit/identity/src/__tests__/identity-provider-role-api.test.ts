import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  assignRole,
  listRoleMembers,
  listRoles,
  listUserRoles,
  removeRole,
} from '../api/identity-provider-role-api';

import type { IdentityRole, IdentityUser } from '../types/index';

const sampleRole: IdentityRole = {
  id: toEntityId<'IdentityRole'>('role-1'),
  name: 'admin',
  description: 'Administrator role',
};

const sampleUser: IdentityUser = {
  userId: toEntityId<'User'>('user-1'),
  username: 'jdoe',
  email: 'jdoe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  enabled: true,
  metadata: {},
};

const basePath = '/identity/provider';

describe('identity-provider-role-api', () => {
  describe('listRoles', () => {
    it('should GET {basePath}/roles', async () => {
      const client = createMockClient();
      const roles = [sampleRole];
      vi.mocked(client.get).mockResolvedValue(axiosResponse(roles));

      const result = await listRoles(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/roles`);
      expect(result).toEqual(roles);
    });
  });

  describe('listRoleMembers', () => {
    it('should GET {basePath}/roles/{roleName}/members', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleUser]));

      const result = await listRoleMembers(client, basePath, 'admin');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/roles/admin/members`);
      expect(result).toEqual([sampleUser]);
    });

    it('should encode roleName with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

      await listRoleMembers(client, basePath, 'role/special@name');

      expect(client.get).toHaveBeenCalledWith(
        `${basePath}/roles/${encodeURIComponent('role/special@name')}/members`
      );
    });
  });

  describe('listUserRoles', () => {
    it('should GET {basePath}/users/{userId}/roles', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleRole]));

      const result = await listUserRoles(client, basePath, toEntityId<'User'>('user-1'));

      expect(client.get).toHaveBeenCalledWith(`${basePath}/users/user-1/roles`);
      expect(result).toEqual([sampleRole]);
    });
  });

  describe('assignRole', () => {
    it('should PUT {basePath}/users/{userId}/roles/{roleName}', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

      await assignRole(client, basePath, toEntityId<'User'>('user-1'), 'admin');

      expect(client.put).toHaveBeenCalledWith(`${basePath}/users/user-1/roles/admin`);
    });

    it('should encode userId and roleName with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

      await assignRole(
        client,
        basePath,
        toEntityId<'User'>('user/special@id'),
        'role/special@name'
      );

      expect(client.put).toHaveBeenCalledWith(
        `${basePath}/users/${encodeURIComponent('user/special@id')}/roles/${encodeURIComponent('role/special@name')}`
      );
    });
  });

  describe('removeRole', () => {
    it('should DELETE {basePath}/users/{userId}/roles/{roleName}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await removeRole(client, basePath, toEntityId<'User'>('user-1'), 'admin');

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/users/user-1/roles/admin`);
    });
  });
});
