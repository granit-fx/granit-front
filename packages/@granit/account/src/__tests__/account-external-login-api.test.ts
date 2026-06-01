import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  challengeExternalLogin,
  externalLoginCallback,
  getExternalLogins,
  unlinkExternalLogin,
} from '../api/account-external-login-api';

import type {
  AccountExternalLoginCallbackResponse,
  AccountExternalLoginInfo,
} from '../types/index';

const BASE = '/api/account';

const mockLogins: readonly AccountExternalLoginInfo[] = [
  { loginProvider: 'Google', providerKey: 'google-123', providerDisplayName: 'Google' },
  { loginProvider: 'Microsoft', providerKey: 'ms-456', providerDisplayName: 'Microsoft' },
];

describe('account-external-login-api', () => {
  describe('getExternalLogins', () => {
    it('sends GET /external-logins', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockLogins });

      const result = await getExternalLogins(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/external-logins`);
      expect(result).toEqual(mockLogins);
    });
  });

  describe('challengeExternalLogin', () => {
    it('sends POST /external-logins/challenge/{provider}', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await challengeExternalLogin(client, BASE, 'Google');

      expect(client.post).toHaveBeenCalledWith(`${BASE}/external-logins/challenge/Google`);
    });

    it('encodes provider name with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await challengeExternalLogin(client, BASE, 'provider/name');

      expect(client.post).toHaveBeenCalledWith(`${BASE}/external-logins/challenge/provider%2Fname`);
    });
  });

  describe('externalLoginCallback', () => {
    it('sends GET /external-logins/callback with provider query param', async () => {
      const client = createMockClient();
      const response: AccountExternalLoginCallbackResponse = {
        userId: 'user-123',
        isNewUser: false,
      };
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await externalLoginCallback(client, BASE, 'Google');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/external-logins/callback`, {
        params: { provider: 'Google' },
      });
      expect(result).toEqual(response);
    });
  });

  describe('unlinkExternalLogin', () => {
    it('sends DELETE /external-logins/{provider}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await unlinkExternalLogin(client, BASE, 'Google');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/external-logins/Google`);
    });
  });
});
