import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  addUserToGroup,
  fetchGroups,
  fetchUserGroups,
  removeUserFromGroup,
} from '../api/identity-provider-group-api.js';

import type { IdentityGroup } from '../types/index.js';

const sampleGroup: IdentityGroup = {
  id: toEntityId<'IdentityGroup'>('group-1'),
  name: 'developers',
  path: '/developers',
  subGroups: [],
};

const basePath = '/identity/provider';

describe('identity-provider-group-api', () => {
  describe('fetchGroups', () => {
    it('should GET {basePath}/groups', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleGroup]));

      const result = await fetchGroups(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/groups`);
      expect(result).toEqual([sampleGroup]);
    });
  });

  describe('fetchUserGroups', () => {
    it('should GET {basePath}/users/{userId}/groups', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleGroup]));

      const result = await fetchUserGroups(client, basePath, toEntityId<'User'>('user-1'));

      expect(client.get).toHaveBeenCalledWith(`${basePath}/users/user-1/groups`);
      expect(result).toEqual([sampleGroup]);
    });

    it('should encode userId with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

      await fetchUserGroups(client, basePath, toEntityId<'User'>('user/special@id'));

      expect(client.get).toHaveBeenCalledWith(
        `${basePath}/users/${encodeURIComponent('user/special@id')}/groups`
      );
    });
  });

  describe('addUserToGroup', () => {
    it('should PUT {basePath}/users/{userId}/groups/{groupId}', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

      await addUserToGroup(client, basePath, toEntityId<'User'>('user-1'), 'group-1');

      expect(client.put).toHaveBeenCalledWith(`${basePath}/users/user-1/groups/group-1`);
    });

    it('should encode userId and groupId with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

      await addUserToGroup(
        client,
        basePath,
        toEntityId<'User'>('user/special@id'),
        'group/special@id'
      );

      expect(client.put).toHaveBeenCalledWith(
        `${basePath}/users/${encodeURIComponent('user/special@id')}/groups/${encodeURIComponent('group/special@id')}`
      );
    });
  });

  describe('removeUserFromGroup', () => {
    it('should DELETE {basePath}/users/{userId}/groups/{groupId}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await removeUserFromGroup(client, basePath, toEntityId<'User'>('user-1'), 'group-1');

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/users/user-1/groups/group-1`);
    });
  });
});
