import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { changePassword, forgotPassword, resetPassword } from '../api/account-password-api';

const BASE = '/api/account';

describe('account-password-api', () => {
  describe('changePassword', () => {
    it('sends POST /change-password with request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await changePassword(client, BASE, {
        currentPassword: 'OldPass1!',
        newPassword: 'NewPass2!',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/change-password`, {
        currentPassword: 'OldPass1!',
        newPassword: 'NewPass2!',
      });
    });
  });

  describe('forgotPassword', () => {
    it('sends POST /forgot-password with email', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await forgotPassword(client, BASE, { email: 'user@example.com' });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/forgot-password`, {
        email: 'user@example.com',
      });
    });
  });

  describe('resetPassword', () => {
    it('sends POST /reset-password with token and new password', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await resetPassword(client, BASE, {
        userId: 'user-123',
        token: 'reset-token',
        newPassword: 'NewPass3!',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/reset-password`, {
        userId: 'user-123',
        token: 'reset-token',
        newPassword: 'NewPass3!',
      });
    });
  });
});
