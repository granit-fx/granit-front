import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { backToImpersonator, sessionHeartbeat } from '../api/account-session-api';

import type { AccountImpersonationResult } from '../types/index';

const BASE = '/api/account';

describe('account-session-api', () => {
  describe('sessionHeartbeat', () => {
    it('sends POST /session/heartbeat', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await sessionHeartbeat(client, BASE);

      expect(client.post).toHaveBeenCalledWith(`${BASE}/session/heartbeat`);
    });
  });

  describe('backToImpersonator', () => {
    it('sends POST /session/back-to-impersonator and returns tokens', async () => {
      const client = createMockClient();
      const response: AccountImpersonationResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await backToImpersonator(client, BASE);

      expect(client.post).toHaveBeenCalledWith(`${BASE}/session/back-to-impersonator`);
      expect(result).toEqual(response);
    });
  });
});
