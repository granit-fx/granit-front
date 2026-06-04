import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  disableTwoFactor,
  enableTwoFactor,
  generateRecoveryCodes,
  getAuthenticatorKey,
  getTwoFactorStatus,
} from '../api/account-two-factor-api';

import type {
  AccountAuthenticatorKeyResponse,
  AccountRecoveryCodesResponse,
  AccountTwoFactorEnableResponse,
  AccountTwoFactorStatusResponse,
} from '../types/index';

const BASE = '/api/account';

const mockStatus: AccountTwoFactorStatusResponse = {
  isEnabled: false,
  hasAuthenticatorApp: false,
  recoveryCodesLeft: 0,
};

const mockAuthKey: AccountAuthenticatorKeyResponse = {
  sharedKey: 'JBSWY3DPEHPK3PXP',
  qrCodeUri: 'otpauth://totp/Granit:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Granit',
};

const mockRecoveryCodes: readonly string[] = ['AAAA-BBBB', 'CCCC-DDDD', 'EEEE-FFFF'];

describe('account-two-factor-api', () => {
  describe('getTwoFactorStatus', () => {
    it('sends GET /two-factor', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockStatus });

      const result = await getTwoFactorStatus(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/two-factor`);
      expect(result).toEqual(mockStatus);
    });
  });

  describe('getAuthenticatorKey', () => {
    it('sends GET /two-factor/authenticator-key', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockAuthKey });

      const result = await getAuthenticatorKey(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/two-factor/authenticator-key`);
      expect(result).toEqual(mockAuthKey);
    });
  });

  describe('enableTwoFactor', () => {
    it('sends POST /two-factor/enable with TOTP code', async () => {
      const client = createMockClient();
      const response: AccountTwoFactorEnableResponse = { recoveryCodes: mockRecoveryCodes };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await enableTwoFactor(client, BASE, { code: '123456' });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/two-factor/enable`, { code: '123456' });
      expect(result.recoveryCodes).toEqual(mockRecoveryCodes);
    });
  });

  describe('disableTwoFactor', () => {
    it('sends POST /two-factor/disable', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await disableTwoFactor(client, BASE, { password: 'P@ssw0rd!' });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/two-factor/disable`, {
        password: 'P@ssw0rd!',
      });
    });
  });

  describe('generateRecoveryCodes', () => {
    it('sends POST /two-factor/recovery-codes', async () => {
      const client = createMockClient();
      const response: AccountRecoveryCodesResponse = { recoveryCodes: mockRecoveryCodes };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await generateRecoveryCodes(client, BASE, { password: 'P@ssw0rd!' });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/two-factor/recovery-codes`, {
        password: 'P@ssw0rd!',
      });
      expect(result.recoveryCodes).toEqual(mockRecoveryCodes);
    });
  });
});
