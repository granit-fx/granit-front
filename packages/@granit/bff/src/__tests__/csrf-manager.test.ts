import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CsrfManager } from '../csrf/csrf-manager.js';

describe('CsrfManager', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('fetchToken', () => {
    it('should POST to /{prefix}/bff/csrf-token with credentials', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response(JSON.stringify({ csrfToken: 'csrf-abc' }), { status: 200 })
      );

      const manager = new CsrfManager('/admin');
      await manager.fetchToken();

      expect(globalThis.fetch).toHaveBeenCalledWith('/admin/bff/csrf-token', {
        method: 'POST',
        credentials: 'include',
      });
    });

    it('should store and return the fetched token', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response(JSON.stringify({ csrfToken: 'csrf-xyz' }), { status: 200 })
      );

      const manager = new CsrfManager('/app');
      const token = await manager.fetchToken();

      expect(token).toBe('csrf-xyz');
      expect(manager.getToken()).toBe('csrf-xyz');
    });

    it('should throw on non-ok response', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response('Unauthorized', { status: 401 }));

      const manager = new CsrfManager('/app');
      await expect(manager.fetchToken()).rejects.toThrow('CSRF token fetch failed: 401');
    });
  });

  describe('getToken', () => {
    it('should return null before any fetch', () => {
      const manager = new CsrfManager('/app');
      expect(manager.getToken()).toBeNull();
    });
  });

  describe('createFetchWithCsrf', () => {
    it('should inject X-CSRF-Token on POST requests', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response(JSON.stringify({ csrfToken: 'csrf-post' }), { status: 200 })
      );

      const manager = new CsrfManager('/app');
      await manager.fetchToken();

      vi.mocked(globalThis.fetch).mockClear();
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response('ok'));

      const wrappedFetch = manager.createFetchWithCsrf();
      await wrappedFetch('/api/data', { method: 'POST' });

      const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
      const headers = new Headers(init?.headers);
      expect(headers.get('X-CSRF-Token')).toBe('csrf-post');
      expect(init?.credentials).toBe('include');
    });

    it('should inject X-CSRF-Token on PUT requests', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response(JSON.stringify({ csrfToken: 'csrf-put' }), { status: 200 })
      );

      const manager = new CsrfManager('/app');
      await manager.fetchToken();

      vi.mocked(globalThis.fetch).mockClear();
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response('ok'));

      const wrappedFetch = manager.createFetchWithCsrf();
      await wrappedFetch('/api/data', { method: 'PUT' });

      const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
      const headers = new Headers(init?.headers);
      expect(headers.get('X-CSRF-Token')).toBe('csrf-put');
    });

    it('should inject X-CSRF-Token on DELETE requests', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response(JSON.stringify({ csrfToken: 'csrf-del' }), { status: 200 })
      );

      const manager = new CsrfManager('/app');
      await manager.fetchToken();

      vi.mocked(globalThis.fetch).mockClear();
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response('ok'));

      const wrappedFetch = manager.createFetchWithCsrf();
      await wrappedFetch('/api/data', { method: 'DELETE' });

      const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
      const headers = new Headers(init?.headers);
      expect(headers.get('X-CSRF-Token')).toBe('csrf-del');
    });

    it('should inject X-CSRF-Token on PATCH requests', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response(JSON.stringify({ csrfToken: 'csrf-patch' }), { status: 200 })
      );

      const manager = new CsrfManager('/app');
      await manager.fetchToken();

      vi.mocked(globalThis.fetch).mockClear();
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response('ok'));

      const wrappedFetch = manager.createFetchWithCsrf();
      await wrappedFetch('/api/data', { method: 'PATCH' });

      const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
      const headers = new Headers(init?.headers);
      expect(headers.get('X-CSRF-Token')).toBe('csrf-patch');
    });

    it('should NOT inject X-CSRF-Token on GET requests', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response(JSON.stringify({ csrfToken: 'csrf-get' }), { status: 200 })
      );

      const manager = new CsrfManager('/app');
      await manager.fetchToken();

      vi.mocked(globalThis.fetch).mockClear();
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response('ok'));

      const wrappedFetch = manager.createFetchWithCsrf();
      await wrappedFetch('/api/data', { method: 'GET' });

      const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
      const headers = new Headers(init?.headers);
      expect(headers.get('X-CSRF-Token')).toBeNull();
      expect(init?.credentials).toBe('include');
    });

    it('should NOT inject X-CSRF-Token when no token is available', async () => {
      const manager = new CsrfManager('/app');

      vi.mocked(globalThis.fetch).mockResolvedValue(new Response('ok'));

      const wrappedFetch = manager.createFetchWithCsrf();
      await wrappedFetch('/api/data', { method: 'POST' });

      const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
      const headers = new Headers(init?.headers);
      expect(headers.get('X-CSRF-Token')).toBeNull();
      expect(init?.credentials).toBe('include');
    });

    it('should always set credentials to include', async () => {
      const manager = new CsrfManager('/app');
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response('ok'));

      const wrappedFetch = manager.createFetchWithCsrf();
      await wrappedFetch('/api/data');

      const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
      expect(init?.credentials).toBe('include');
    });

    it('should reject cross-origin requests to prevent BFF cookie leakage', async () => {
      const manager = new CsrfManager('/app');
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response('ok'));
      const wrappedFetch = manager.createFetchWithCsrf();

      await expect(wrappedFetch('https://evil.example.com/steal')).rejects.toThrow(
        /refuses cross-origin request/
      );
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('should accept same-origin absolute URLs', async () => {
      const manager = new CsrfManager('/app');
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response('ok'));
      const wrappedFetch = manager.createFetchWithCsrf();

      const sameOrigin = `${globalThis.location.origin}/app/bff/anything`;
      await wrappedFetch(sameOrigin);
      expect(globalThis.fetch).toHaveBeenCalledOnce();
    });
  });
});
