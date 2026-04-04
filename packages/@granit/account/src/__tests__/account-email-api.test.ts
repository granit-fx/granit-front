import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { changeEmail, confirmEmailChange } from '../api/account-email-api.js';

const BASE = '/api/account';

describe('account-email-api', () => {
  describe('changeEmail', () => {
    it('sends POST /change-email with request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await changeEmail(client, BASE, { newEmail: 'new@example.com' });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/change-email`, {
        newEmail: 'new@example.com',
      });
    });
  });

  describe('confirmEmailChange', () => {
    it('sends POST /confirm-email-change with token and new email', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await confirmEmailChange(client, BASE, {
        userId: 'user-123',
        newEmail: 'new@example.com',
        token: 'confirm-token',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/confirm-email-change`, {
        userId: 'user-123',
        newEmail: 'new@example.com',
        token: 'confirm-token',
      });
    });
  });
});
