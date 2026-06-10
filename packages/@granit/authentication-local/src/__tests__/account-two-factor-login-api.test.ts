import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  sendTwoFactorLoginEmailCode,
  verifyTwoFactorLogin,
} from '../api/account-two-factor-login-api';

import type { AccountLoginResponse } from '../types/index';

const BASE = '/api/account';

describe('account-two-factor-login-api', () => {
  describe('verifyTwoFactorLogin', () => {
    it('sends POST /login/two-factor with TOTP code', async () => {
      const client = createMockClient();
      const response: AccountLoginResponse = {
        succeeded: true,
        requiresTwoFactor: false,
        isLockedOut: false,
        isNotAllowed: false,
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await verifyTwoFactorLogin(client, BASE, {
        code: '123456',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/login/two-factor`, {
        code: '123456',
      });
      expect(result).toEqual(response);
    });

    it('sends POST /login/two-factor with a recovery code', async () => {
      const client = createMockClient();
      const response: AccountLoginResponse = {
        succeeded: true,
        requiresTwoFactor: false,
        isLockedOut: false,
        isNotAllowed: false,
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await verifyTwoFactorLogin(client, BASE, {
        code: 'ABCD-1234-EFGH',
        method: 'RecoveryCode',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/login/two-factor`, {
        code: 'ABCD-1234-EFGH',
        method: 'RecoveryCode',
      });
      expect(result.succeeded).toBe(true);
    });

    it('sends POST /login/two-factor with an emailed code', async () => {
      const client = createMockClient();
      const response: AccountLoginResponse = {
        succeeded: true,
        requiresTwoFactor: false,
        isLockedOut: false,
        isNotAllowed: false,
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      await verifyTwoFactorLogin(client, BASE, { code: '123456', method: 'Email' });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/login/two-factor`, {
        code: '123456',
        method: 'Email',
      });
    });
  });

  describe('sendTwoFactorLoginEmailCode', () => {
    it('sends POST /login/two-factor/send-email with no body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await sendTwoFactorLoginEmailCode(client, BASE);

      expect(client.post).toHaveBeenCalledWith(`${BASE}/login/two-factor/send-email`);
    });
  });
});
