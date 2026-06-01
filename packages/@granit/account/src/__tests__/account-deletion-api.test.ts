import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { deleteAccount } from '../api/account-deletion-api';

const BASE = '/api/account';

describe('account-deletion-api', () => {
  describe('deleteAccount', () => {
    it('sends POST /delete with password confirmation', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await deleteAccount(client, BASE, { password: 'MyP@ssw0rd!' });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/delete`, { password: 'MyP@ssw0rd!' });
    });
  });
});
