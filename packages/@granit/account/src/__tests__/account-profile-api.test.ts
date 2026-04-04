import { createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import { getProfile, updateProfile } from '../api/account-profile-api.js';

import type { AccountProfileResponse } from '../types/index.js';

const BASE = '/api/account';

const mockProfile: AccountProfileResponse = {
  userId: toEntityId<'User'>('550e8400-e29b-41d4-a716-446655440000'),
  email: 'user@example.com',
  emailConfirmed: true,
  firstName: 'John',
  lastName: 'Doe',
  twoFactorEnabled: false,
  hasPassword: true,
  externalLogins: [],
};

describe('account-profile-api', () => {
  describe('getProfile', () => {
    it('sends GET /profile', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockProfile });

      const result = await getProfile(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/profile`);
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('sends PUT /profile with request body', async () => {
      const client = createMockClient();
      const updated = { ...mockProfile, firstName: 'Jane' };
      vi.mocked(client.put).mockResolvedValueOnce({ data: updated });

      const result = await updateProfile(client, BASE, { firstName: 'Jane' });

      expect(client.put).toHaveBeenCalledWith(`${BASE}/profile`, { firstName: 'Jane' });
      expect(result.firstName).toBe('Jane');
    });
  });
});
