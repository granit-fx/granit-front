import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  beginPasskeyAssertion,
  completePasskeyAssertion,
} from '../api/account-passkey-assertion-api.js';

import type { AccountLoginResponse } from '../types/index.js';

const BASE = '/api/account';

describe('account-passkey-assertion-api', () => {
  describe('beginPasskeyAssertion', () => {
    it('sends POST /passkeys/assertion/begin and returns JSON options', async () => {
      const client = createMockClient();
      const optionsJson = '{"challenge":"abc123","rpId":"example.com"}';
      vi.mocked(client.post).mockResolvedValueOnce({ data: optionsJson });

      const result = await beginPasskeyAssertion(client, BASE);

      expect(client.post).toHaveBeenCalledWith(`${BASE}/passkeys/assertion/begin`);
      expect(result).toBe(optionsJson);
    });
  });

  describe('completePasskeyAssertion', () => {
    it('sends POST /passkeys/assertion/complete with credential JSON', async () => {
      const client = createMockClient();
      const response: AccountLoginResponse = {
        succeeded: true,
        requiresTwoFactor: false,
        isLockedOut: false,
        isNotAllowed: false,
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await completePasskeyAssertion(client, BASE, {
        credentialJson: '{"id":"cred-1","response":{"authenticatorData":"..."}}',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/passkeys/assertion/complete`, {
        credentialJson: '{"id":"cred-1","response":{"authenticatorData":"..."}}',
      });
      expect(result).toEqual(response);
    });
  });
});
