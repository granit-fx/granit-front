import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  challengeExternalLogin,
  completeExternalRegistration,
  externalLoginCallback,
  getExternalLoginStartUrl,
  getExternalLogins,
  unlinkExternalLogin,
} from '../api/account-external-login-api';

import type {
  AccountCompleteExternalRegistrationRequest,
  AccountExternalLoginCompleted,
  AccountExternalLoginInfo,
  AccountExternalLoginNeedsProfile,
} from '../types/index';

function makeAxiosError(status: number) {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data: { title: 'Error', status } },
  });
}

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

    it('throws HttpError(400) when provider is not configured', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockRejectedValueOnce(makeAxiosError(400));

      await expect(challengeExternalLogin(client, BASE, 'Unknown')).rejects.toMatchObject({
        name: 'HttpError',
        status: 400,
        message: 'External login provider "Unknown" is not configured.',
      });
    });

    it('throws HttpError(500) when provider handler is not registered', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockRejectedValueOnce(makeAxiosError(500));

      await expect(challengeExternalLogin(client, BASE, 'Apple')).rejects.toMatchObject({
        name: 'HttpError',
        status: 500,
        message:
          'External login provider "Apple" is unavailable: the authentication handler is not registered.',
      });
    });
  });

  describe('getExternalLoginStartUrl', () => {
    it('builds the challenge start URL without returnUrl', () => {
      expect(getExternalLoginStartUrl(BASE, 'Google')).toBe(
        `${BASE}/external-logins/challenge/Google/start`
      );
    });

    it('appends and URL-encodes returnUrl', () => {
      expect(getExternalLoginStartUrl(BASE, 'Google', '/account/security?tab=logins')).toBe(
        `${BASE}/external-logins/challenge/Google/start?returnUrl=%2Faccount%2Fsecurity%3Ftab%3Dlogins`
      );
    });

    it('omits returnUrl when empty', () => {
      expect(getExternalLoginStartUrl(BASE, 'Google', '')).toBe(
        `${BASE}/external-logins/challenge/Google/start`
      );
    });

    it('encodes provider names with special characters', () => {
      expect(getExternalLoginStartUrl(BASE, 'provider/name')).toBe(
        `${BASE}/external-logins/challenge/provider%2Fname/start`
      );
    });
  });

  describe('externalLoginCallback', () => {
    it('sends GET /external-logins/callback in headless json mode', async () => {
      const client = createMockClient();
      const response: AccountExternalLoginCompleted = {
        status: 'completed',
        userId: 'user-123',
        isNewUser: true,
        continuationToken: null,
        prefill: null,
      };
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await externalLoginCallback(client, BASE, 'Google');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/external-logins/callback`, {
        params: { provider: 'Google', mode: 'json' },
      });
      expect(result).toEqual(response);
    });

    it('returns the needs-profile-completion variant as-is', async () => {
      const client = createMockClient();
      const response: AccountExternalLoginNeedsProfile = {
        status: 'needs-profile-completion',
        userId: null,
        isNewUser: false,
        continuationToken: 'opaque-token',
        prefill: { email: 'jane@example.com', firstName: 'Jane', lastName: null },
      };
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await externalLoginCallback(client, BASE, 'Google');

      expect(result).toEqual(response);
    });

    it('normalizes a legacy { userId, isNewUser } payload to the completed variant', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({
        data: { userId: 'user-123', isNewUser: false },
      });

      const result = await externalLoginCallback(client, BASE, 'Google');

      expect(result).toEqual({
        status: 'completed',
        userId: 'user-123',
        isNewUser: false,
        continuationToken: null,
        prefill: null,
      });
    });
  });

  describe('completeExternalRegistration', () => {
    const request: AccountCompleteExternalRegistrationRequest = {
      token: 'opaque-token',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    it('sends POST /external-logins/complete-registration with the request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await completeExternalRegistration(client, BASE, request);

      expect(client.post).toHaveBeenCalledWith(
        `${BASE}/external-logins/complete-registration`,
        request
      );
    });

    it.each([400, 403, 409, 422])('propagates HttpError(%i) from the server', async (status) => {
      const client = createMockClient();
      vi.mocked(client.post).mockRejectedValueOnce(makeAxiosError(status));

      await expect(completeExternalRegistration(client, BASE, request)).rejects.toMatchObject({
        isAxiosError: true,
        response: { status },
      });
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
