import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  changeEmail,
  changePassword,
  completePasskeyRegistration,
  confirmEmail,
  confirmEmailChange,
  deleteAccount,
  deletePasskey,
  disableTwoFactor,
  enableTwoFactor,
  forgotPassword,
  generateRecoveryCodes,
  getAccountConfig,
  getAuthenticatorKey,
  getProfile,
  getTwoFactorStatus,
  listPasskeys,
  registerAccount,
  renamePasskey,
  resendConfirmationEmail,
  resetPassword,
  sendSessionHeartbeat,
  updateProfile,
} from '../index';

const BASE = '/api/account';

describe('authentication-local account management API', () => {
  describe('registration', () => {
    it('registerAccount POSTs /register', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });
      await registerAccount(client, BASE, {
        email: 'a@b.c',
        password: 'P@ss',
        firstName: null,
        lastName: null,
      });
      expect(client.post).toHaveBeenCalledWith(`${BASE}/register`, {
        email: 'a@b.c',
        password: 'P@ss',
        firstName: null,
        lastName: null,
      });
    });

    it('confirmEmail GETs /confirm-email with userId + token', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: undefined });
      await confirmEmail(client, BASE, 'u1', 't1');
      expect(client.get).toHaveBeenCalledWith(`${BASE}/confirm-email`, {
        params: { userId: 'u1', token: 't1' },
      });
    });

    it('resendConfirmationEmail POSTs /resend-confirmation-email', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });
      await resendConfirmationEmail(client, BASE);
      expect(client.post).toHaveBeenCalledWith(`${BASE}/resend-confirmation-email`);
    });
  });

  describe('password', () => {
    it('changePassword POSTs /change-password', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });
      await changePassword(client, BASE, { currentPassword: 'old', newPassword: 'new' });
      expect(client.post).toHaveBeenCalledWith(`${BASE}/change-password`, {
        currentPassword: 'old',
        newPassword: 'new',
      });
    });

    it('forgotPassword POSTs /forgot-password', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });
      await forgotPassword(client, BASE, { email: 'a@b.c' });
      expect(client.post).toHaveBeenCalledWith(`${BASE}/forgot-password`, { email: 'a@b.c' });
    });

    it('resetPassword POSTs /reset-password', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });
      await resetPassword(client, BASE, { userId: 'u1', token: 't1', newPassword: 'new' });
      expect(client.post).toHaveBeenCalledWith(`${BASE}/reset-password`, {
        userId: 'u1',
        token: 't1',
        newPassword: 'new',
      });
    });
  });

  describe('email change', () => {
    it('changeEmail POSTs /change-email', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });
      await changeEmail(client, BASE, { newEmail: 'new@b.c', currentPassword: 'pw' });
      expect(client.post).toHaveBeenCalledWith(`${BASE}/change-email`, {
        newEmail: 'new@b.c',
        currentPassword: 'pw',
      });
    });

    it('confirmEmailChange POSTs /confirm-email-change', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });
      await confirmEmailChange(client, BASE, { userId: 'u1', newEmail: 'new@b.c', token: 't1' });
      expect(client.post).toHaveBeenCalledWith(`${BASE}/confirm-email-change`, {
        userId: 'u1',
        newEmail: 'new@b.c',
        token: 't1',
      });
    });
  });

  describe('profile', () => {
    it('getProfile GETs /profile and returns data', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: { userId: 'u1', email: 'a@b.c' } });
      const result = await getProfile(client, BASE);
      expect(client.get).toHaveBeenCalledWith(`${BASE}/profile`);
      expect(result).toEqual({ userId: 'u1', email: 'a@b.c' });
    });

    it('updateProfile PUTs /profile and returns data', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValueOnce({ data: { firstName: 'Ada' } });
      const result = await updateProfile(client, BASE, { firstName: 'Ada', lastName: null });
      expect(client.put).toHaveBeenCalledWith(`${BASE}/profile`, {
        firstName: 'Ada',
        lastName: null,
      });
      expect(result).toEqual({ firstName: 'Ada' });
    });
  });

  describe('two-factor management', () => {
    it('getTwoFactorStatus GETs /two-factor', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: { isEnabled: false } });
      await getTwoFactorStatus(client, BASE);
      expect(client.get).toHaveBeenCalledWith(`${BASE}/two-factor`);
    });

    it('getAuthenticatorKey GETs /two-factor/authenticator-key', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({
        data: { sharedKey: 'K', qrCodeUri: 'otpauth://' },
      });
      await getAuthenticatorKey(client, BASE);
      expect(client.get).toHaveBeenCalledWith(`${BASE}/two-factor/authenticator-key`);
    });

    it('enableTwoFactor POSTs /two-factor/enable and returns recovery codes', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: { recoveryCodes: ['a'] } });
      const result = await enableTwoFactor(client, BASE, { code: '123456' });
      expect(client.post).toHaveBeenCalledWith(`${BASE}/two-factor/enable`, { code: '123456' });
      expect(result.recoveryCodes).toEqual(['a']);
    });

    it('disableTwoFactor POSTs /two-factor/disable', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });
      await disableTwoFactor(client, BASE, { password: 'pw' });
      expect(client.post).toHaveBeenCalledWith(`${BASE}/two-factor/disable`, { password: 'pw' });
    });

    it('generateRecoveryCodes POSTs /two-factor/recovery-codes', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: { recoveryCodes: ['a', 'b'] } });
      const result = await generateRecoveryCodes(client, BASE, { password: 'pw' });
      expect(client.post).toHaveBeenCalledWith(`${BASE}/two-factor/recovery-codes`, {
        password: 'pw',
      });
      expect(result.recoveryCodes).toHaveLength(2);
    });
  });

  describe('passkey management', () => {
    it('listPasskeys GETs /passkeys', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: [] });
      await listPasskeys(client, BASE);
      expect(client.get).toHaveBeenCalledWith(`${BASE}/passkeys`);
    });

    it('completePasskeyRegistration POSTs /passkeys/register/complete', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: { id: 'pk-1' } });
      await completePasskeyRegistration(client, BASE, { credentialJson: '{}', name: 'Laptop' });
      expect(client.post).toHaveBeenCalledWith(`${BASE}/passkeys/register/complete`, {
        credentialJson: '{}',
        name: 'Laptop',
      });
    });

    it('renamePasskey PATCHes /passkeys/{id} with encoded id', async () => {
      const client = createMockClient();
      vi.mocked(client.patch).mockResolvedValueOnce({ data: undefined });
      await renamePasskey(client, BASE, 'pk 1', { name: 'New' });
      expect(client.patch).toHaveBeenCalledWith(`${BASE}/passkeys/pk%201`, { name: 'New' });
    });

    it('deletePasskey DELETEs /passkeys/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });
      await deletePasskey(client, BASE, 'pk-1');
      expect(client.delete).toHaveBeenCalledWith(`${BASE}/passkeys/pk-1`);
    });
  });

  describe('deletion, session, config', () => {
    it('deleteAccount POSTs /delete', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });
      await deleteAccount(client, BASE, { password: 'pw' });
      expect(client.post).toHaveBeenCalledWith(`${BASE}/delete`, { password: 'pw' });
    });

    it('sendSessionHeartbeat POSTs /session/heartbeat', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });
      await sendSessionHeartbeat(client, BASE);
      expect(client.post).toHaveBeenCalledWith(`${BASE}/session/heartbeat`);
    });

    it('getAccountConfig GETs /config', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: { allowSelfRegistration: true } });
      const result = await getAccountConfig(client, BASE);
      expect(client.get).toHaveBeenCalledWith(`${BASE}/config`);
      expect(result.allowSelfRegistration).toBe(true);
    });
  });
});
