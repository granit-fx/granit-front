import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  getPasswordChangedAt,
  sendPasswordResetEmail,
  setTemporaryPassword,
} from '../api/identity-provider-password-api';

import type { IdentityPasswordChangedAtResponse } from '../types/index';

const basePath = '/identity/provider';

describe('identity-provider-password-api', () => {
  describe('getPasswordChangedAt', () => {
    it('should GET {basePath}/users/{userId}/password/changed-at', async () => {
      const client = createMockClient();
      const response: IdentityPasswordChangedAtResponse = {
        changedAt: toISODateString('2026-03-15T08:00:00Z'),
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(response));

      const result = await getPasswordChangedAt(client, basePath, toEntityId<'User'>('user-1'));

      expect(client.get).toHaveBeenCalledWith(`${basePath}/users/user-1/password/changed-at`);
      expect(result).toEqual(response);
    });

    it('should return null changedAt when password was never changed', async () => {
      const client = createMockClient();
      const response: IdentityPasswordChangedAtResponse = { changedAt: null };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(response));

      const result = await getPasswordChangedAt(client, basePath, toEntityId<'User'>('user-1'));

      expect(result.changedAt).toBeNull();
    });

    it('should encode userId with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse({ changedAt: null }));

      await getPasswordChangedAt(client, basePath, toEntityId<'User'>('user/special@id'));

      expect(client.get).toHaveBeenCalledWith(
        `${basePath}/users/${encodeURIComponent('user/special@id')}/password/changed-at`
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should POST {basePath}/users/{userId}/password/reset-email', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

      await sendPasswordResetEmail(client, basePath, toEntityId<'User'>('user-1'));

      expect(client.post).toHaveBeenCalledWith(`${basePath}/users/user-1/password/reset-email`);
    });
  });

  describe('setTemporaryPassword', () => {
    it('should POST {basePath}/users/{userId}/password/temporary with password body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

      await setTemporaryPassword(client, basePath, 'user-1', 'temp123!');

      expect(client.post).toHaveBeenCalledWith(`${basePath}/users/user-1/password/temporary`, {
        password: 'temp123!',
      });
    });
  });
});
