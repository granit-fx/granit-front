// ---------------------------------------------------------------------------
// CSRF token manager for BFF authentication.
//
// The BFF server requires an X-CSRF-Token header on all mutation requests
// (POST, PUT, DELETE, PATCH). This manager fetches the token from the
// /{prefix}/bff/csrf-token endpoint and provides a fetch wrapper that
// auto-injects it on mutation methods.
// ---------------------------------------------------------------------------

import { logger } from '../logger';

import type { BffCsrfTokenResponse } from '../types/index';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

/** Manages CSRF token lifecycle for BFF-authenticated SPAs. */
export class CsrfManager {
  private token: string | null = null;
  private pendingFetch: Promise<string | null> | null = null;
  private readonly pathPrefix: string;

  constructor(pathPrefix: string) {
    this.pathPrefix = pathPrefix;
  }

  /** Fetch a fresh CSRF token from the BFF server. */
  async fetchToken(): Promise<string> {
    const response = await fetch(`${this.pathPrefix}/bff/csrf-token`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`CSRF token fetch failed: ${response.status}`);
    }
    const data = (await response.json()) as BffCsrfTokenResponse;
    this.token = data.csrfToken;
    return this.token;
  }

  /**
   * Return the current CSRF token, or null if not yet fetched.
   *
   * @internal Intended for the api-client interceptor wiring only. Consumers
   * should let `@granit/api-client` inject the header automatically rather
   * than calling this directly; exposing the raw token to UI code expands the
   * attack surface for malicious same-origin scripts.
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Create a fetch wrapper that auto-injects `X-CSRF-Token` on mutation
   * requests and sends the BFF session cookie via `credentials: 'include'`.
   *
   * The wrapper rejects any URL that is not same-origin as the document — a
   * cross-origin request would inadvertently send the BFF session cookie to
   * a third party. Domain API calls must go through `@granit/api-client`
   * instead of this helper.
   */
  createFetchWithCsrf(): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      assertSameOrigin(input);
      const method = (init?.method ?? 'GET').toUpperCase();
      if (MUTATION_METHODS.has(method)) {
        // Ensure a token is present before sending a mutation. During the
        // bootstrap window (or after a reset) `this.token` may still be null;
        // fetch it on demand rather than sending a header-less mutation that
        // depends entirely on the BFF rejecting it. Mirrors the async-refresh
        // fallback in the @granit/api-client interceptor. See VULN-300.
        const token = this.token ?? (await this.ensureToken());
        if (token) {
          const headers = new Headers(init?.headers);
          headers.set('X-CSRF-Token', token);
          return fetch(input, { ...init, headers, credentials: 'include' });
        }
      }
      return fetch(input, { ...init, credentials: 'include' });
    };
  }

  /**
   * Resolve a CSRF token, fetching one if the cache is empty. Concurrent
   * callers share a single in-flight request. Returns `null` if the fetch
   * fails — the caller then falls back to a header-less request that the BFF
   * will reject, which is no worse than the previous behaviour.
   */
  private async ensureToken(): Promise<string | null> {
    if (this.token) return this.token;
    this.pendingFetch ??= this.fetchToken().catch((err: unknown) => {
      // Degraded path: the caller falls back to a header-less mutation the BFF
      // will reject. Surface why the token could not be refreshed.
      logger.warn('CSRF token refresh failed; falling back to header-less request', { err });
      return null;
    });
    try {
      return await this.pendingFetch;
    } finally {
      this.pendingFetch = null;
    }
  }
}

/**
 * Throws if `input` resolves to a different origin than the current document.
 * Relative URLs (`/bff/...`) and same-origin absolute URLs are accepted.
 */
function extractRawUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function assertSameOrigin(input: RequestInfo | URL): void {
  if (globalThis.location === undefined) return; // SSR / Node tests
  const rawUrl = extractRawUrl(input);
  let resolved: URL;
  try {
    resolved = new URL(rawUrl, globalThis.location.href);
  } catch {
    throw new TypeError(`[@granit/bff] CsrfManager: invalid URL "${String(rawUrl)}"`);
  }
  if (resolved.origin !== globalThis.location.origin) {
    throw new Error(
      `[@granit/bff] CsrfManager refuses cross-origin request to ${resolved.origin}. ` +
        `Use @granit/api-client for domain APIs; this helper is reserved for BFF same-origin endpoints.`
    );
  }
}
