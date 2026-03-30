import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  beginPasskeyRegistration,
  completePasskeyRegistration,
  deletePasskey,
  getPasskeys,
  renamePasskey,
} from '../api/account-passkey-api.js';

import type { AccountPasskeyCreatedResponse, AccountPasskeyInfo } from '../types/index.js';

const BASE = '/api/account';

const mockPasskeys: readonly AccountPasskeyInfo[] = [
  {
    id: 'pk-001',
    name: 'MacBook Pro',
    createdAt: '2026-03-01T08:00:00Z',
    lastUsedAt: '2026-03-20T10:00:00Z',
  },
];

describe('account-passkey-api', () => {
  describe('getPasskeys', () => {
    it('sends GET /passkeys', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockPasskeys });

      const result = await getPasskeys(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/passkeys`);
      expect(result).toEqual(mockPasskeys);
    });
  });

  describe('beginPasskeyRegistration', () => {
    it('sends POST /passkeys/register/begin and returns raw JSON', async () => {
      const client = createMockClient();
      const optionsJson = '{"challenge":"abc123"}';
      vi.mocked(client.post).mockResolvedValueOnce({ data: optionsJson });

      const result = await beginPasskeyRegistration(client, BASE);

      expect(client.post).toHaveBeenCalledWith(`${BASE}/passkeys/register/begin`);
      expect(result).toBe(optionsJson);
    });
  });

  describe('completePasskeyRegistration', () => {
    it('sends POST /passkeys/register/complete with credential', async () => {
      const client = createMockClient();
      const response: AccountPasskeyCreatedResponse = {
        id: 'pk-002',
        name: 'iPhone',
        createdAt: '2026-03-21T12:00:00Z',
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await completePasskeyRegistration(client, BASE, {
        credentialJson: '{"attestation":"..."}',
        name: 'iPhone',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/passkeys/register/complete`, {
        credentialJson: '{"attestation":"..."}',
        name: 'iPhone',
      });
      expect(result).toEqual(response);
    });
  });

  describe('renamePasskey', () => {
    it('sends PATCH /passkeys/{id} with new name', async () => {
      const client = createMockClient();
      vi.mocked(client.patch).mockResolvedValueOnce({ data: undefined });

      await renamePasskey(client, BASE, 'pk-001', { name: 'Work Laptop' });

      expect(client.patch).toHaveBeenCalledWith(`${BASE}/passkeys/pk-001`, {
        name: 'Work Laptop',
      });
    });

    it('encodes passkey ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.patch).mockResolvedValueOnce({ data: undefined });

      await renamePasskey(client, BASE, 'id/slash', { name: 'Test' });

      expect(client.patch).toHaveBeenCalledWith(`${BASE}/passkeys/id%2Fslash`, { name: 'Test' });
    });
  });

  describe('deletePasskey', () => {
    it('sends DELETE /passkeys/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await deletePasskey(client, BASE, 'pk-001');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/passkeys/pk-001`);
    });
  });
});
