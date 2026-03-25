import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  createUser,
  fetchProviderUser,
  fetchProviderUsers,
  setUserEnabled,
  updateUser,
} from '../api/identity-provider-user-api.js';

import type { IdentityUser } from '../types/index.js';

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

describe('identity-provider-user-api', () => {
  describe('fetchProviderUsers', () => {
    it('should GET {basePath}/users without params', async () => {
      const client = createMockClient();
      const users = [sampleUser];
      vi.mocked(client.get).mockResolvedValue(axiosResponse(users));

      const result = await fetchProviderUsers(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/users`, { params: undefined });
      expect(result).toEqual(users);
    });

    it('should GET {basePath}/users with search params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

      const params = { search: 'john', first: 0, max: 10 };
      const result = await fetchProviderUsers(client, basePath, params);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/users`, { params });
      expect(result).toEqual([]);
    });
  });

  describe('fetchProviderUser', () => {
    it('should GET {basePath}/users/{userId}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleUser));

      const result = await fetchProviderUser(client, basePath, 'user-1');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/users/user-1`);
      expect(result).toEqual(sampleUser);
    });

    it('should encode userId with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleUser));

      await fetchProviderUser(client, basePath, 'user/special@id');

      expect(client.get).toHaveBeenCalledWith(
        `${basePath}/users/${encodeURIComponent('user/special@id')}`
      );
    });
  });

  describe('createUser', () => {
    it('should POST {basePath}/users with request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleUser));

      const request = { username: 'jdoe', email: 'jdoe@example.com', enabled: true };
      const result = await createUser(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/users`, request);
      expect(result).toEqual(sampleUser);
    });
  });

  describe('updateUser', () => {
    it('should PUT {basePath}/users/{userId} with request body', async () => {
      const client = createMockClient();
      const updated = { ...sampleUser, email: 'new@example.com' };
      vi.mocked(client.put).mockResolvedValue(axiosResponse(updated));

      const request = { email: 'new@example.com' };
      const result = await updateUser(client, basePath, 'user-1', request);

      expect(client.put).toHaveBeenCalledWith(`${basePath}/users/user-1`, request);
      expect(result).toEqual(updated);
    });

    it('should encode userId with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue(axiosResponse(sampleUser));

      await updateUser(client, basePath, 'user/special@id', { email: 'x@y.com' });

      expect(client.put).toHaveBeenCalledWith(
        `${basePath}/users/${encodeURIComponent('user/special@id')}`,
        { email: 'x@y.com' }
      );
    });
  });

  describe('setUserEnabled', () => {
    it('should PATCH {basePath}/users/{userId}/enabled', async () => {
      const client = createMockClient();
      vi.mocked(client.patch).mockResolvedValue(axiosResponse(undefined));

      await setUserEnabled(client, basePath, 'user-1', false);

      expect(client.patch).toHaveBeenCalledWith(`${basePath}/users/user-1/enabled`, {
        enabled: false,
      });
    });

    it('should encode userId with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.patch).mockResolvedValue(axiosResponse(undefined));

      await setUserEnabled(client, basePath, 'user/special@id', true);

      expect(client.patch).toHaveBeenCalledWith(
        `${basePath}/users/${encodeURIComponent('user/special@id')}/enabled`,
        { enabled: true }
      );
    });
  });
});
