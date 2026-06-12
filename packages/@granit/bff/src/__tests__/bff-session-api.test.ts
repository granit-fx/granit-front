import { toISODateString } from '@granit/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  listBffSessions,
  revokeAllOtherBffSessions,
  revokeBffSession,
} from '../api/bff-session-api';
import { CsrfManager } from '../csrf/csrf-manager';

describe('BFF session API', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('listBffSessions', () => {
    it('should GET /{prefix}/bff/sessions with credentials', async () => {
      const sessions = [
        {
          sessionId: 'ab12...yz89',
          isCurrent: true,
          createdAt: toISODateString('2026-03-23T10:00:00Z'),
          userAgent: 'Mozilla/5.0',
          lastAccessedAt: null,
          location: null,
          ipAddress: null,
          riskLevel: null,
        },
        {
          sessionId: 'cd34...wx67',
          isCurrent: false,
          createdAt: toISODateString('2026-03-22T08:00:00Z'),
          userAgent: null,
          lastAccessedAt: null,
          location: null,
          ipAddress: null,
          riskLevel: null,
        },
      ];
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response(JSON.stringify({ sessions }), { status: 200 })
      );

      const result = await listBffSessions('/admin');

      expect(globalThis.fetch).toHaveBeenCalledWith('/admin/bff/sessions', {
        credentials: 'include',
      });
      expect(result).toEqual(sessions);
    });

    it('should throw on non-ok response', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response('Unauthorized', { status: 401 }));

      await expect(listBffSessions('/app')).rejects.toThrow('Failed to list BFF sessions: 401');
    });

    it('should return an empty array when no sessions exist', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response(JSON.stringify({ sessions: [] }), { status: 200 })
      );

      const result = await listBffSessions('/app');
      expect(result).toEqual([]);
    });
  });

  describe('revokeBffSession', () => {
    it('should DELETE /{prefix}/bff/sessions/{id} with CSRF token', async () => {
      // Setup CsrfManager with a token
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ csrfToken: 'csrf-123' }), { status: 200 })
      );
      const csrfManager = new CsrfManager('/admin');
      await csrfManager.fetchToken();

      // Mock the revoke call
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

      await revokeBffSession('/admin', 'ab12...yz89', csrfManager);

      const lastCall = vi.mocked(globalThis.fetch).mock.calls[1];
      expect(lastCall[0]).toBe('/admin/bff/sessions/ab12...yz89');
      expect(lastCall[1]?.method).toBe('DELETE');
      const headers = new Headers(lastCall[1]?.headers);
      expect(headers.get('X-CSRF-Token')).toBe('csrf-123');
    });

    it('should URL-encode the session ID', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ csrfToken: 'csrf-enc' }), { status: 200 })
      );
      const csrfManager = new CsrfManager('/app');
      await csrfManager.fetchToken();

      vi.mocked(globalThis.fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

      await revokeBffSession('/app', 'id/with special', csrfManager);

      const lastCall = vi.mocked(globalThis.fetch).mock.calls[1];
      expect(lastCall[0]).toBe('/app/bff/sessions/id%2Fwith%20special');
    });

    it('should throw on 404 response', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ csrfToken: 'csrf-404' }), { status: 200 })
      );
      const csrfManager = new CsrfManager('/admin');
      await csrfManager.fetchToken();

      vi.mocked(globalThis.fetch).mockResolvedValueOnce(new Response('Not found', { status: 404 }));

      await expect(revokeBffSession('/admin', 'unknown', csrfManager)).rejects.toThrow(
        'Failed to revoke BFF session: 404'
      );
    });
  });

  describe('revokeAllOtherBffSessions', () => {
    it('should DELETE /{prefix}/bff/sessions with CSRF token', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ csrfToken: 'csrf-all' }), { status: 200 })
      );
      const csrfManager = new CsrfManager('/admin');
      await csrfManager.fetchToken();

      vi.mocked(globalThis.fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

      await revokeAllOtherBffSessions('/admin', csrfManager);

      const lastCall = vi.mocked(globalThis.fetch).mock.calls[1];
      expect(lastCall[0]).toBe('/admin/bff/sessions');
      expect(lastCall[1]?.method).toBe('DELETE');
      const headers = new Headers(lastCall[1]?.headers);
      expect(headers.get('X-CSRF-Token')).toBe('csrf-all');
    });

    it('should throw on 401 response', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ csrfToken: 'csrf-401' }), { status: 200 })
      );
      const csrfManager = new CsrfManager('/app');
      await csrfManager.fetchToken();

      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 })
      );

      await expect(revokeAllOtherBffSessions('/app', csrfManager)).rejects.toThrow(
        'Failed to revoke all other BFF sessions: 401'
      );
    });
  });
});
