import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { beginPasskeyAssertion } from '../api/account-passkey-assertion-api.js';

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
});
