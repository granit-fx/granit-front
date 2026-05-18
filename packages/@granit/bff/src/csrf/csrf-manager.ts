// ---------------------------------------------------------------------------
// CSRF token manager for BFF authentication.
//
// The BFF server requires an X-CSRF-Token header on all mutation requests
// (POST, PUT, DELETE, PATCH). This manager fetches the token from the
// /{prefix}/bff/csrf-token endpoint and provides a fetch wrapper that
// auto-injects it on mutation methods.
// ---------------------------------------------------------------------------

const MUTATION_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

/** Manages CSRF token lifecycle for BFF-authenticated SPAs. */
export class CsrfManager {
  private token: string | null = null;
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
    const data = (await response.json()) as { csrfToken: string };
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
      if (MUTATION_METHODS.has(method) && this.token) {
        const headers = new Headers(init?.headers);
        headers.set('X-CSRF-Token', this.token);
        return fetch(input, { ...init, headers, credentials: 'include' });
      }
      return fetch(input, { ...init, credentials: 'include' });
    };
  }
}

/**
 * Throws if `input` resolves to a different origin than the current document.
 * Relative URLs (`/bff/...`) and same-origin absolute URLs are accepted.
 */
function assertSameOrigin(input: RequestInfo | URL): void {
  if (globalThis.location === undefined) return; // SSR / Node tests
  const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
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
