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

  /** Return the current CSRF token, or null if not yet fetched. */
  getToken(): string | null {
    return this.token;
  }

  /** Create a fetch wrapper that auto-injects X-CSRF-Token on mutation requests. */
  createFetchWithCsrf(): typeof fetch {
    return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
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
