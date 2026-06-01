import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  confirmEmail,
  registerAccount,
  resendConfirmationEmail,
} from '../api/account-registration-api';

import type { AccountRegisterResponse } from '../types/index';

const BASE = '/api/account';

const mockRegisterResponse: AccountRegisterResponse = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  requiresEmailConfirmation: true,
};

describe('account-registration-api', () => {
  describe('registerAccount', () => {
    it('sends POST /register with request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: mockRegisterResponse });

      const result = await registerAccount(client, BASE, {
        email: 'user@example.com',
        password: 'P@ssw0rd!',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/register`, {
        email: 'user@example.com',
        password: 'P@ssw0rd!',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result).toEqual(mockRegisterResponse);
    });
  });

  describe('confirmEmail', () => {
    it('sends GET /confirm-email with query params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: undefined });

      await confirmEmail(client, BASE, 'user-id-123', 'token-abc');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/confirm-email`, {
        params: { userId: 'user-id-123', token: 'token-abc' },
      });
    });
  });

  describe('resendConfirmationEmail', () => {
    it('sends POST /resend-confirmation-email', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await resendConfirmationEmail(client, BASE);

      expect(client.post).toHaveBeenCalledWith(`${BASE}/resend-confirmation-email`);
    });
  });
});
