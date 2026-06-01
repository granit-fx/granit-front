import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { loginAccount } from '../api/account-login-api';

import type { AccountLoginResponse } from '../types/index';

const BASE = '/api/account';

describe('account-login-api', () => {
  describe('loginAccount', () => {
    it('sends POST /login with credentials', async () => {
      const client = createMockClient();
      const response: AccountLoginResponse = {
        succeeded: true,
        requiresTwoFactor: false,
        isLockedOut: false,
        isNotAllowed: false,
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await loginAccount(client, BASE, {
        login: 'user@example.com',
        password: 'P@ssw0rd!',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/login`, {
        login: 'user@example.com',
        password: 'P@ssw0rd!',
      });
      expect(result).toEqual(response);
    });

    it('returns requiresTwoFactor when 2FA is enabled', async () => {
      const client = createMockClient();
      const response: AccountLoginResponse = {
        succeeded: false,
        requiresTwoFactor: true,
        isLockedOut: false,
        isNotAllowed: false,
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await loginAccount(client, BASE, {
        login: 'user@example.com',
        password: 'P@ssw0rd!',
      });

      expect(result.succeeded).toBe(false);
      expect(result.requiresTwoFactor).toBe(true);
    });
  });
});
