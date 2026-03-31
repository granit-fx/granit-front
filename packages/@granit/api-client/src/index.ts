import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

/** Authentication mode for the API client. */
export type ApiClientMode = 'bearer' | 'bff';

/** Getter that returns the current CSRF token, or null if unavailable. */
export type CsrfTokenGetter = () => string | null;

export interface ApiClientConfig {
  baseURL: string;
  /** Request timeout in milliseconds. Default: 10_000 */
  timeout?: number;
  /**
   * Authentication mode. Default: `'bearer'`.
   *
   * - `'bearer'` — Injects `Authorization: Bearer <token>` via the global token getter.
   * - `'bff'` — Uses `withCredentials` (cookies) and injects `X-CSRF-Token` on mutations.
   *   No Authorization header is sent (the BFF YARP proxy adds it server-side).
   */
  mode?: ApiClientMode;
  /**
   * CSRF token getter for BFF mode. Required when `mode` is `'bff'`.
   * Typically obtained from `CsrfManager.getToken` in `@granit/bff`.
   */
  csrfTokenGetter?: CsrfTokenGetter;
}

// ---------------------------------------------------------------------------
// Generic response types (REST APIs)
// ---------------------------------------------------------------------------

// RFC 7807 Problem Details — standard error format from Granit .NET backend.
// See: Granit.ExceptionHandling (400 BusinessException, 404 NotFoundException,
// 403 ForbiddenException, 409 ConflictException, 422 ValidationException, 500).
//
// Re-exported from errors.ts as ProblemDetailsPayload (readonly variant for
// error classes). This mutable variant is kept for backward compatibility
// with consumers that import `ProblemDetails` from `@granit/api-client`.
export type { ProblemDetailsPayload as ProblemDetails } from './errors.js';

// Global async token getter — shared across all createApiClient instances.
// Call setTokenGetter() from the auth provider after Keycloak initializes.
let _tokenGetter: (() => Promise<string | undefined>) | null = null;

// Global synchronous tenant getter — opt-in for multi-tenant apps.
// Call setTenantGetter() from the app initialization code.
let _tenantGetter: (() => string | undefined) | null = null;

// Global callback invoked on any 401 response — wired by @granit/react-authentication to force logout.
let _onUnauthorized: (() => void) | null = null;

// Global idempotency key generator — opt-in via @granit/idempotency.
// When set, mutation requests (POST/PUT/PATCH/DELETE) automatically receive
// an Idempotency-Key header. The generator receives the request config and
// returns a key string, or undefined to skip the header for that request.
let _idempotencyKeyGenerator: ((config: InternalAxiosRequestConfig) => string | undefined) | null =
  null;

export function setTokenGetter(getter: () => Promise<string | undefined>): void {
  _tokenGetter = getter;
}

export function setTenantGetter(getter: () => string | undefined): void {
  _tenantGetter = getter;
}

/**
 * Register a callback invoked on any HTTP 401 response.
 *
 * Typically wired by `@granit/react-authentication` to force a Keycloak logout when the
 * backend rejects a token (e.g. session revoked via back-channel logout).
 */
export function setOnUnauthorized(callback: () => void): void {
  _onUnauthorized = callback;
}

/**
 * Register a synchronous idempotency key generator for mutation requests.
 *
 * When set, POST/PUT/PATCH/DELETE requests receive an `Idempotency-Key` header.
 * Typically wired by `@granit/idempotency` during app initialization.
 *
 * @param generator - Receives the request config, returns a key string or
 *   `undefined` to skip the header for that specific request.
 */
export function setIdempotencyKeyGenerator(
  generator: (config: InternalAxiosRequestConfig) => string | undefined
): void {
  _idempotencyKeyGenerator = generator;
}

const MUTATION_METHODS = new Set(['post', 'put', 'delete', 'patch']);

/**
 * Create a pre-configured Axios instance.
 *
 * - **Bearer mode** (default): injects `Authorization: Bearer <token>` via the global token getter.
 * - **BFF mode**: uses `withCredentials` (cookies) and injects `X-CSRF-Token` on mutations.
 *
 * Both modes support optional `X-Tenant-Id`, idempotency keys, and a 401 response interceptor.
 */
export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const mode = config.mode ?? 'bearer';
  const isBff = mode === 'bff';

  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout ?? 10_000,
    withCredentials: isBff,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    async (req: InternalAxiosRequestConfig) => {
      if (isBff) {
        // BFF mode: inject CSRF token on mutation methods
        if (config.csrfTokenGetter && MUTATION_METHODS.has(req.method ?? '')) {
          const csrfToken = config.csrfTokenGetter();
          if (csrfToken) {
            req.headers['X-CSRF-Token'] = csrfToken;
          }
        }
      } else if (_tokenGetter) {
        // Bearer mode: inject Authorization header
        const token = await _tokenGetter();
        if (token) {
          req.headers.Authorization = `Bearer ${token}`;
        }
      }

      const tenantId = _tenantGetter?.();
      if (tenantId) {
        req.headers['X-Tenant-Id'] = tenantId;
      }

      const idempotencyKey = _idempotencyKeyGenerator?.(req);
      if (idempotencyKey) {
        req.headers['Idempotency-Key'] = idempotencyKey;
      }

      return req;
    },
    /* v8 ignore next 3 */
    (error: unknown) => {
      throw error;
    }
  );

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401 && _onUnauthorized) {
        _onUnauthorized();
      }
      throw error;
    }
  );

  return instance;
}

/**
 * Create an orval-compatible mutator function from an existing Axios instance.
 *
 * The returned function matches the orval custom instance signature:
 * `<T>(config: AxiosRequestConfig, options?: AxiosRequestConfig) => Promise<T>`
 *
 * It reuses the instance's interceptors (token injection, tenant header, etc.).
 *
 * @example
 * ```typescript
 * // src/api/mutator.ts (in consuming app)
 * import { api } from '@/lib/api';
 * import { createMutator } from '@granit/api-client';
 *
 * export const customInstance = createMutator(api);
 * export default customInstance;
 * ```
 */
export function createMutator(instance: AxiosInstance) {
  return <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
    return instance({ ...config, ...options }).then(({ data }) => data as T);
  };
}

// ---------------------------------------------------------------------------
// Domain error classes
// ---------------------------------------------------------------------------

export { HttpError, TimeoutError, ValidationError } from './errors.js';
export type { ProblemDetailsPayload, ValidationDetails } from './errors.js';
